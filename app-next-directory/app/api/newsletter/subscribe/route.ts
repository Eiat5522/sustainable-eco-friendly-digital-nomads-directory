import { z } from 'zod'
import { ApiResponseHandler } from '@/utils/api-response'
import { NextResponse } from 'next/server'

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
  const cur = memoryGet(key)
  if (!cur) {
    memorySet(key, '1', ttlSeconds)
    return 1
  }
  const next = String(Number(cur) + 1)
  memorySet(key, next, ttlSeconds)
  return Number(next)
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
    // dynamic import to avoid a hard dependency failure if package missing
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const IORedis = require('ioredis')
    redisClient = new IORedis(redisUrl)
    useRedis = true
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
  await initRedisIfAvailable()

  try {
    const body = await request.json()
    const validationResult = newsletterSubscriptionSchema.safeParse(body)

    if (!validationResult.success) {
      return ApiResponseHandler.error('Invalid email address.', 422, validationResult.error.flatten())
    }

    const { email } = validationResult.data

    // --- Rate limit checks ---
    // Determine IP (best-effort using headers)
    const forwardedFor = request.headers.get('x-forwarded-for') || request.headers.get('X-Forwarded-For')
    const cfConnecting = request.headers.get('cf-connecting-ip')
    const ip = (forwardedFor ? forwardedFor.split(',')[0].trim() : (cfConnecting || 'unknown'))

    const ipKey = `newsletter:ip:${ip}`
    const ipCount = await storeIncr(ipKey, RATE_LIMIT_PER_IP_WINDOW)
    if (ipCount > RATE_LIMIT_PER_IP) {
      return ApiResponseHandler.error('Too many requests from this IP. Please try again later.', 429)
    }

    const emailKey = `newsletter:email:${email}`
    const emailCount = await storeGet(emailKey)
    if (emailCount) {
      // Email has been subscribed recently — short-circuit without enqueueing again
      // Support Idempotency-Key: if provided, persist mapping as well
      const idempotencyKey = request.headers.get('Idempotency-Key') || request.headers.get('idempotency-key')
      if (idempotencyKey) {
        const idKey = `newsletter:idempotency:${idempotencyKey}`
        await storeSet(idKey, JSON.stringify({ status: 200, body: { success: true, data: null, message: 'Already subscribed recently.' } }), IDEMPOTENCY_TTL)
      }
      // ApiResponseHandler.success expects (data, message?) and returns { success: true, data, message }
      return ApiResponseHandler.success(null, 'Already subscribed recently.')
    }

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

    // Passed validation and rate/idempotency checks — proceed to enqueue or process
    // Here you would typically add the email to your mailing list queue (Mailchimp, SendGrid, etc.)
    // For this example, we'll just log it to the console and persist a short-lived marker to prevent duplicates
    console.log('New newsletter subscription:', email)

    // Persist an email marker to prevent another subscription within the window
    await storeSet(emailKey, '1', RATE_LIMIT_PER_EMAIL_WINDOW)

    // If idempotency key was provided, persist the outcome so retries can be short-circuited
    if (idempotencyKey) {
      const idKey = `newsletter:idempotency:${idempotencyKey}`
      await storeSet(idKey, JSON.stringify({ status: 200, body: { success: true, message: 'Thank you for subscribing to our newsletter!' } }), IDEMPOTENCY_TTL)
    }

    return ApiResponseHandler.success({ message: 'Thank you for subscribing to our newsletter!' })
  } catch (error) {
    console.error('Newsletter subscription error:', error)
    return ApiResponseHandler.error('An internal server error occurred.', 500)
  }
}
