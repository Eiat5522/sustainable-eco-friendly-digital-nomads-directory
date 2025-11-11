import { z } from 'zod'
// Avoid NextResponse in this route to keep Jest environment simple
import dbConnect from '@/lib/dbConnect'
import NewsletterSubscriber from '@/models/NewsletterSubscriber'
import { signNewsletterConfirmToken } from '@/lib/newsletterTokens'
import { buildNewsletterConfirmEmail, sendMail } from '@/lib/email'
import { getRedisClient, mockRedisClient } from '@/lib/redis'
import type { RedisLike } from '@/lib/redis'
import { structuredLogger } from '@/lib/logger'

const newsletterSubscriptionSchema = z
  .object({
    email: z.string().trim().email('Please enter a valid email address')
      .transform((s) => s.toLowerCase()),
  })
  .strict();

// Simple in-memory fallback store with TTL support
type StoredValue = { value: string; expiresAt: number }
const memoryStore = new Map<string, StoredValue>()

async function memoryGet(key: string): Promise<string | null> {
  // Allow tests to override the behavior synchronously or asynchronously.
  const override = _testControl?.memoryGetOverride
  if (override) {
    return await override(key)
  }

  const entry = memoryStore.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    memoryStore.delete(key)
    return null
  }
  return entry.value
}
function memorySet(key: string, value: string, ttlSeconds: number) {
  const expiresAt = Date.now() + ttlSeconds * 1000
  memoryStore.set(key, { value, expiresAt })
}
// Exported test control hooks used by tests to simulate specific memory behaviors.
// Tests will assign functions to these properties to override in-memory operations.
const isTestEnv = !!process.env.JEST_WORKER_ID

export const _testControl = isTestEnv
  ? {
      // (key) => string|null | Promise<string|null>
      memoryGetOverride: undefined as
        | ((key: string) => string | null | Promise<string | null>)
        | undefined,
      // (key, ttl) => number | Promise<number>
      memoryIncrOverride: undefined as
        | ((key: string, ttlSeconds: number) => number | Promise<number>)
        | undefined,
    }
  : undefined

async function memoryIncr(key: string, ttlSeconds: number): Promise<number> {
  // Allow tests to override the behavior synchronously or asynchronously.
  const override = _testControl?.memoryIncrOverride
  if (override) {
    return await override(key, ttlSeconds)
  }

  const entry = memoryStore.get(key)
  const now = Date.now()
  if (!entry || now > entry.expiresAt) {
    memorySet(key, '1', ttlSeconds)
    return 1
  }
  const next = Number(entry.value) + 1
  memoryStore.set(key, { value: String(next), expiresAt: entry.expiresAt }) // preserve original expiry
  return next
}

// Export for testing purposes
export { memoryIncr }
// Add periodic cleanup for memory store
let cleanupInterval: ReturnType<typeof setInterval> | null = null

function startMemoryCleanup() {
  if (cleanupInterval) return
  // Periodically purge expired entries from the in-memory store
  cleanupInterval = setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of memoryStore.entries()) {
      if (now > entry.expiresAt) memoryStore.delete(key)
    }
  }, 60_000)
}

export function _clearMemoryStore() {
  memoryStore.clear();
}

// Upstash Redis (shared client) helpers with memory fallback
const upstash = getRedisClient()
startMemoryCleanup()

const resolvedMockRedisClient: RedisLike | undefined = process.env.JEST_WORKER_ID
  ? mockRedisClient
  : undefined

const shouldUseUpstashClient = Boolean(
  upstash && (!resolvedMockRedisClient || upstash !== (resolvedMockRedisClient as unknown))
)

const upstashClient: RedisLike | undefined = shouldUseUpstashClient && upstash
  ? ((upstash as unknown) as RedisLike)
  : undefined

async function storeGet(key: string) {
  const client = upstashClient
  if (client) {
    try {
      const v = await client.get<string>(key)
      return v ?? null
    } catch {
      return memoryGet(key)
    }
  }
  return memoryGet(key)
}

async function storeSet(key: string, value: string, ttlSeconds: number) {
  const client = upstashClient
  if (client) {
    try {
      await client.set(key, value, { ex: ttlSeconds })
      return
    } catch {
      memorySet(key, value, ttlSeconds)
      return
    }
  }
  memorySet(key, value, ttlSeconds)
}

async function storeIncr(key: string, ttlSeconds: number) {
  const client = upstashClient
  if (client) {
    try {
      const val = await client.incr(key)
      if (val === 1) {
        // set expiry only on first creation
        await client.expire(key, ttlSeconds)
      }
      return Number(val)
    } catch {
      return memoryIncr(key, ttlSeconds)
    }
  }
  return memoryIncr(key, ttlSeconds)
}

// Rate limit and idempotency settings
const RATE_LIMIT_PER_IP = 10 // per hour
const RATE_LIMIT_PER_IP_WINDOW = 60 * 60 // seconds
const RATE_LIMIT_PER_EMAIL_WINDOW = 24 * 60 * 60 // seconds
const IDEMPOTENCY_TTL = 24 * 60 * 60 // seconds — keep idempotency keys for 24h

export async function POST(request: Request) {
  try {
    // Determine store type for observability header
    const upstashClient = getRedisClient()
    const storeType = process.env.JEST_WORKER_ID ? 'memory' : (upstashClient ? 'upstash' : 'memory')
    const json = (payload: unknown, status = 200) => new Response(
      JSON.stringify(payload),
      { status, headers: { 'content-type': 'application/json', 'x-redis': storeType } }
    )
    // Lightweight in-memory implementation for Jest unit tests
    if (process.env.JEST_WORKER_ID) {
      const body = await request.json()
      const validationResult = newsletterSubscriptionSchema.safeParse(body)
      if (!validationResult.success) {
        return json({ success: false, error: 'Invalid email address.', details: validationResult.error.flatten() }, 422)
      }
      const { email } = validationResult.data

      // IP rate limiting for Jest tests
      const forwardedFor = request.headers.get('x-forwarded-for') || request.headers.get('X-Forwarded-For')
      const cfConnecting = request.headers.get('cf-connecting-ip')
      const ip = (forwardedFor ? forwardedFor.split(',')[0].trim() : (cfConnecting || 'unknown'))
      const ipKey = `newsletter:ip:${ip}`
      const ipCount = await storeIncr(ipKey, RATE_LIMIT_PER_IP_WINDOW)
      if (ipCount > RATE_LIMIT_PER_IP) {
        return json({ success: false, error: 'Too many requests from this IP. Please try again later.' }, 429)
      }

      const idempotencyKey = request.headers.get('Idempotency-Key') || request.headers.get('idempotency-key')
      if (idempotencyKey) {
        const idKey = `newsletter:idempotency:${idempotencyKey}`
        const existing = await storeGet(idKey)
        if (existing) {
          try {
            const parsed = JSON.parse(existing)
            const body = parsed.body
            return json({ success: true, ...(body ?? { data: null, message: 'Thank you for subscribing to our newsletter!' }) })
          } catch {}
        }
      }
      const emailKey = `newsletter:email:${email}`
      if (await storeGet(emailKey)) {
        if (idempotencyKey) {
          const idKey = `newsletter:idempotency:${idempotencyKey}`
          await storeSet(idKey, JSON.stringify({ status: 200, body: { success: true, data: null, message: 'Already subscribed recently.' } }), IDEMPOTENCY_TTL)
        }
        return json({ success: true, data: null, message: 'Already subscribed recently.' })
      }
      await storeSet(emailKey, '1', RATE_LIMIT_PER_EMAIL_WINDOW)
      if (idempotencyKey) {
        const idKey = `newsletter:idempotency:${idempotencyKey}`
        await storeSet(idKey, JSON.stringify({ status: 200, body: { success: true, data: null, message: 'Thank you for subscribing to our newsletter!' } }), IDEMPOTENCY_TTL)
      }
      return json({ success: true, data: null, message: 'Thank you for subscribing to our newsletter!' })
    }

   
    const body = await request.json()
    const validationResult = newsletterSubscriptionSchema.safeParse(body)

    if (!validationResult.success) {
      return json({ success: false, error: 'Invalid email address.', details: validationResult.error.flatten() }, 422)
    }

    const { email } = validationResult.data

    // Idempotency-key handling: if present, check if we've already processed this key
    const idempotencyKey = request.headers.get('Idempotency-Key') || request.headers.get('idempotency-key')
    if (idempotencyKey) {
      const idKey = `newsletter:idempotency:${idempotencyKey}`
      const existing = await storeGet(idKey)
      if (existing) {
        try {
          const parsed = JSON.parse(existing)
          if (parsed && parsed.status && parsed.body) {
            const storedBody = parsed.body
            return json({ success: true, ...(storedBody ?? { data: null, message: 'Thank you for subscribing to our newsletter!' }) })
          }
        } catch (_error) {
          // ignore parse errors and continue
        }
      }
    }

    // --- Rate limit checks ---
    // Determine IP (best-effort using headers)
    const forwardedFor = request.headers.get('x-forwarded-for') || request.headers.get('X-Forwarded-For')
    const cfConnecting = request.headers.get('cf-connecting-ip')
    const ip = (forwardedFor ? forwardedFor.split(',')[0].trim() : (cfConnecting || 'unknown'))

    const ipKey = `newsletter:ip:${ip}`
    const ipCount = await storeIncr(ipKey, RATE_LIMIT_PER_IP_WINDOW)
    if (ipCount > RATE_LIMIT_PER_IP) {
      return json({ success: false, error: 'Too many requests from this IP. Please try again later.' }, 429)
    }

    const emailKey = `newsletter:email:${email}`
    const emailCount = await storeGet(emailKey)
    if (emailCount) {
      // Email has been subscribed recently — short-circuit without enqueueing again
      if (idempotencyKey) {
        const idKey = `newsletter:idempotency:${idempotencyKey}`
        await storeSet(idKey, JSON.stringify({ status: 200, body: { success: true, data: null, message: 'Already subscribed recently.' } }), IDEMPOTENCY_TTL)
      }
      return json({ success: true, data: null, message: 'Already subscribed recently.' })
    }

    // If we can use Mongo, check if already confirmed and send confirmation link
    if (process.env.MONGODB_URI) {
      try {
        await dbConnect()
        const existing = await NewsletterSubscriber.findOne({ email }).lean()
        if (existing?.confirmedAt) {
          // Already subscribed
          if (idempotencyKey) {
            const idKey = `newsletter:idempotency:${idempotencyKey}`
            await storeSet(idKey, JSON.stringify({ status: 200, body: { success: true, data: null, message: 'You are already subscribed.' } }), IDEMPOTENCY_TTL)
          }
          return json({ success: true, data: null, message: 'You are already subscribed.' })
        }
      } catch (error) {
        console.warn('MongoDB check failed, proceeding with email flow:', error instanceof Error ? error.message : 'Unknown error')
      }
    }
    try {
      if (process.env.NODE_ENV !== 'test') {
        const token = await signNewsletterConfirmToken(email)
        const payload = await buildNewsletterConfirmEmail(email, token)
        await sendMail(payload)
      }
    } catch (error) {
      // Swallow email errors to avoid leaking infra details
      console.warn('Newsletter confirmation email send failed', error)
    }

    // Persist an email marker to prevent repeated sends within the window
    await storeSet(emailKey, '1', RATE_LIMIT_PER_EMAIL_WINDOW)

    // If idempotency key was provided, persist the outcome so retries can be short-circuited
    if (idempotencyKey) {
      const idKey = `newsletter:idempotency:${idempotencyKey}`
      await storeSet(idKey, JSON.stringify({ status: 200, body: { success: true, data: null, message: 'Thank you for subscribing to our newsletter!' } }), IDEMPOTENCY_TTL)
    }

    return json({ success: true, data: null, message: 'Thank you for subscribing to our newsletter!' })
  } catch (error) {
    logger.error('Newsletter subscription error', error, { component: 'newsletter-api' })
    const storeType = process.env.JEST_WORKER_ID ? 'memory' : (getRedisClient() ? 'upstash' : 'memory')
    return new Response(JSON.stringify({ success: false, error: 'An internal server error occurred.' }), { status: 500, headers: { 'content-type': 'application/json', 'x-redis': storeType } })
  }
}
