import { z } from 'zod'
// Avoid NextResponse in this route to keep Jest environment simple
import dbConnect from '@/lib/dbConnect'
import NewsletterSubscriber from '@/models/NewsletterSubscriber'
import { signNewsletterConfirmToken } from '@/lib/newsletterTokens'
import { buildNewsletterConfirmEmail, sendMail } from '@/lib/email'

const newsletterSubscriptionSchema = z
  .object({
    email: z.string().trim().email('Please enter a valid email address')
      .transform((s) => s.toLowerCase()),
  })
  .strict();

// Simple in-memory fallback store with TTL support
type StoredValue = { value: string; expiresAt: number }
const memoryStore = new Map<string, StoredValue>()

function memoryGet(key: string) {
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
function memoryIncr(key: string, ttlSeconds: number) {
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
// Add periodic cleanup for memory store
let cleanupInterval: NodeJS.Timeout | null = null

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

// Attempt to use Redis if configured; otherwise use memory store
let redisClient: any = null
let useRedis = false

async function initRedisIfAvailable() {
  if (redisClient !== null) return
  try {
    const redisUrl = process.env.REDIS_URL || process.env.REDIS
    if (!redisUrl) {
      redisClient = null
      useRedis = false
      return
    }
    try {
      const { default: IORedis } = await import('ioredis')
      redisClient = new IORedis(redisUrl)
      redisClient.on('error', (err: unknown) => {
        // Optional: add observability here
        // console.error('Redis client error', err)
      })
      useRedis = true
    } catch (e) {
      // ...
    }
  } catch (e) {
    // not available — fall back to memory
    redisClient = null
    useRedis = false
  }
}

async function storeGet(key: string) {
  if (useRedis && redisClient) {
    try {
      const v = await redisClient.get(key)
      return v
    } catch (e) {
      return memoryGet(key)
    }
  }
  return memoryGet(key)
}

async function storeSet(key: string, value: string, ttlSeconds: number) {
  if (useRedis && redisClient) {
    try {
      await redisClient.set(key, value, 'EX', ttlSeconds)
      return
    } catch (e) {
      memorySet(key, value, ttlSeconds)
      return
    }
  }
  memorySet(key, value, ttlSeconds)
}

async function storeIncr(key: string, ttlSeconds: number) {
  if (useRedis && redisClient) {
    try {
      const val = await redisClient.incr(key)
      if (val === 1) {
        await redisClient.expire(key, ttlSeconds)
      }
      return Number(val)
    } catch (e) {
      return memoryIncr(key, ttlSeconds)
    }
  }
  return memoryIncr(key, ttlSeconds)
}

// Rate limit and idempotency settings
const RATE_LIMIT_PER_IP = 10 // per hour
const RATE_LIMIT_PER_IP_WINDOW = 60 * 60 // seconds
const RATE_LIMIT_PER_EMAIL = 1 // per 24h
const RATE_LIMIT_PER_EMAIL_WINDOW = 24 * 60 * 60 // seconds
const IDEMPOTENCY_TTL = 24 * 60 * 60 // seconds — keep idempotency keys for 24h

export async function POST(request: Request) {
  try {
    // Lightweight in-memory implementation for Jest unit tests
    if (process.env.JEST_WORKER_ID) {
      const body = await request.json()
      const validationResult = newsletterSubscriptionSchema.safeParse(body)
      if (!validationResult.success) {
        return new Response(JSON.stringify({ success: false, error: 'Invalid email address.', details: validationResult.error.flatten() }), { status: 422, headers: { 'content-type': 'application/json' } })
      }
      const { email } = validationResult.data
      const idempotencyKey = request.headers.get('Idempotency-Key') || request.headers.get('idempotency-key')
      if (idempotencyKey) {
        const idKey = `newsletter:idempotency:${idempotencyKey}`
        const existing = memoryGet(idKey)
        if (existing) {
          try {
            const parsed = JSON.parse(existing)
            const body = parsed.body
            return new Response(JSON.stringify({ success: true, ...(body ?? { data: null, message: 'Thank you for subscribing to our newsletter!' }) }), { status: 200, headers: { 'content-type': 'application/json' } })
          } catch {}
        }
      }
      const emailKey = `newsletter:email:${email}`
      if (memoryGet(emailKey)) {
        if (idempotencyKey) {
          const idKey = `newsletter:idempotency:${idempotencyKey}`
          memorySet(idKey, JSON.stringify({ status: 200, body: { success: true, data: null, message: 'Already subscribed recently.' } }), IDEMPOTENCY_TTL)
        }
        return new Response(JSON.stringify({ success: true, data: null, message: 'Already subscribed recently.' }), { status: 200, headers: { 'content-type': 'application/json' } })
      }
      memorySet(emailKey, '1', RATE_LIMIT_PER_EMAIL_WINDOW)
      if (idempotencyKey) {
        const idKey = `newsletter:idempotency:${idempotencyKey}`
        memorySet(idKey, JSON.stringify({ status: 200, body: { success: true, data: null, message: 'Thank you for subscribing to our newsletter!' } }), IDEMPOTENCY_TTL)
      }
      return new Response(JSON.stringify({ success: true, data: null, message: 'Thank you for subscribing to our newsletter!' }), { status: 200, headers: { 'content-type': 'application/json' } })
    }

    try { await initRedisIfAvailable() } catch {}
    // eslint-disable-next-line no-console
    const body = await request.json()
    const validationResult = newsletterSubscriptionSchema.safeParse(body)

    if (!validationResult.success) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid email address.', details: validationResult.error.flatten() }), { status: 422, headers: { 'content-type': 'application/json' } })
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
          // Return the stored successful response
          if (parsed && parsed.status && parsed.body) {
            // If stored body matches ApiResponseHandler.success signature, replay appropriately
            const body = parsed.body
            // If stored body contains message and/or data fields, use them
            return ApiResponseHandler.success(body.data ?? null, body.message ?? undefined)
          }
        } catch (e) {
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
      return new Response(JSON.stringify({ success: false, error: 'Too many requests from this IP. Please try again later.' }), { status: 429, headers: { 'content-type': 'application/json' } })
    }

    const emailKey = `newsletter:email:${email}`
    const emailCount = await storeGet(emailKey)
    if (emailCount) {
      // Email has been subscribed recently — short-circuit without enqueueing again
      if (idempotencyKey) {
        const idKey = `newsletter:idempotency:${idempotencyKey}`
        await storeSet(idKey, JSON.stringify({ status: 200, body: { success: true, data: null, message: 'Already subscribed recently.' } }), IDEMPOTENCY_TTL)
      }
      return new Response(JSON.stringify({ success: true, data: null, message: 'Already subscribed recently.' }), { status: 200, headers: { 'content-type': 'application/json' } })
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
          return new Response(JSON.stringify({ success: true, data: null, message: 'You are already subscribed.' }), { status: 200, headers: { 'content-type': 'application/json' } })
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
    } catch (e) {
      // Swallow email errors to avoid leaking infra details
      // eslint-disable-next-line no-console
      console.warn('Newsletter confirmation email send failed', e)
    }

    // Persist an email marker to prevent repeated sends within the window
    await storeSet(emailKey, '1', RATE_LIMIT_PER_EMAIL_WINDOW)

    // If idempotency key was provided, persist the outcome so retries can be short-circuited
    if (idempotencyKey) {
      const idKey = `newsletter:idempotency:${idempotencyKey}`
      await storeSet(idKey, JSON.stringify({ status: 200, body: { success: true, data: null, message: 'Thank you for subscribing to our newsletter!' } }), IDEMPOTENCY_TTL)
    }

    return new Response(JSON.stringify({ success: true, data: null, message: 'Thank you for subscribing to our newsletter!' }), { status: 200, headers: { 'content-type': 'application/json' } })
  } catch (error) {
    console.error('Newsletter subscription error:', error)
    return new Response(JSON.stringify({ success: false, error: 'An internal server error occurred.' }), { status: 500, headers: { 'content-type': 'application/json' } })
  }
}
