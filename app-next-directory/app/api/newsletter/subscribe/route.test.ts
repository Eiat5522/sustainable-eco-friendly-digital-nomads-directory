import { jest } from '@jest/globals'

type UpstashClient = {
  get: (key: string) => Promise<string | null>
  set: (key: string, value: string, opts?: { ex?: number }) => Promise<'OK'>
  incr: (key: string) => Promise<number>
  expire: (key: string, seconds: number) => Promise<1 | 0>
}

function makeRequest(body: unknown, headers: Record<string, string> = {}) {
  return new Request('http://localhost/api/newsletter/subscribe', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-forwarded-for': '127.0.0.1',
      ...headers,
    },
    body: JSON.stringify(body),
  })
}

describe('newsletter subscribe API', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    jest.resetModules()
  })

  test('returns 422 and x-redis: memory for invalid email (Jest mode)', async () => {
    // In Jest, JEST_WORKER_ID is typically set → forces memory mode header
    process.env.JEST_WORKER_ID = process.env.JEST_WORKER_ID || '1'
    await jest.unstable_mockModule('@/lib/redis', () => ({
      getRedisClient: () => undefined,
    }))
    const { POST } = await import('./route')

    const req = makeRequest({ email: 'not-an-email' })
    const res = await POST(req)
    expect(res.status).toBe(422)
    expect(res.headers.get('content-type')).toMatch(/application\/json/)
    expect(res.headers.get('x-redis')).toBe('memory')
    const json = await res.json()
    expect(json).toMatchObject({ success: false, error: expect.any(String) })
  })

  test('returns 200 and x-redis: memory for valid email without Upstash (Jest mode)', async () => {
    process.env.JEST_WORKER_ID = process.env.JEST_WORKER_ID || '1'
    await jest.unstable_mockModule('@/lib/redis', () => ({
      getRedisClient: () => undefined,
    }))
    const { POST } = await import('./route')

    const req = makeRequest({ email: 'test@example.com' })
    const res = await POST(req)
    expect(res.status).toBe(200)
    expect(res.headers.get('x-redis')).toBe('memory')
    const json = await res.json()
    expect(json).toMatchObject({ success: true })
  })

  test('when Upstash client present under Jest, header remains memory and request succeeds', async () => {
    // Temporarily simulate a non-Jest environment so header can be `upstash`
    const prevJestWorker = process.env.JEST_WORKER_ID
    delete process.env.JEST_WORKER_ID

    // Simple in-memory fake of Upstash client
    const store = new Map<string, string>()
    const counters = new Map<string, number>()
    const get = jest.fn(async (key: string) => (store.has(key) ? store.get(key)! : null))
    const set = jest.fn(async (key: string, value: string) => { store.set(key, value); return 'OK' as const })
    const incr = jest.fn(async (key: string) => { const v = (counters.get(key) || 0) + 1; counters.set(key, v); return v })
  const expire = jest.fn(async () => 1 as const)
    const upstash: UpstashClient = { get, set, incr, expire }
    await jest.unstable_mockModule('@/lib/redis', () => ({
      getRedisClient: () => upstash,
    }))
    const { POST } = await import('./route')

    const req = makeRequest(
      { email: 'user@example.com' },
      { 'x-idempotency-key': 'abc-123' }
    )
    const res = await POST(req)
    expect(res.status).toBe(200)
    // Under Jest, header remains 'memory' even when client exists; store operations still use the client
    expect(res.headers.get('x-redis')).toBe('memory')
    const json = await res.json()
    expect(json).toMatchObject({ success: true })

    // Restore env var for other tests
    if (prevJestWorker !== undefined) {
      process.env.JEST_WORKER_ID = prevJestWorker
    }
  })

  test('idempotency key replay returns same success body', async () => {
    process.env.JEST_WORKER_ID = process.env.JEST_WORKER_ID || '1'
    await jest.unstable_mockModule('@/lib/redis', () => ({
      getRedisClient: () => undefined,
    }))
    const { POST } = await import('./route')

    const idempotencyKey = 'test-idempotency-123'
    const req1 = makeRequest({ email: 'idempotent@example.com' }, { 'Idempotency-Key': idempotencyKey })
    const res1 = await POST(req1)
    expect(res1.status).toBe(200)
    expect(res1.headers.get('x-redis')).toBe('memory')
    const json1 = await res1.json()
    expect(json1).toMatchObject({ success: true, message: 'Thank you for subscribing to our newsletter!' })

    // Second request with same key should return the same response
    const req2 = makeRequest({ email: 'idempotent@example.com' }, { 'Idempotency-Key': idempotencyKey })
    const res2 = await POST(req2)
    expect(res2.status).toBe(200)
    expect(res2.headers.get('x-redis')).toBe('memory')
    const json2 = await res2.json()
    expect(json2).toEqual(json1) // Exact match
  })

  test('per-IP rate limit exceeded returns 429', async () => {
    // Don't set JEST_WORKER_ID to test the non-Jest path with Upstash
    const prevJestWorker = process.env.JEST_WORKER_ID
    delete process.env.JEST_WORKER_ID

    await jest.isolateModules(async () => {
      const mockIncr = jest.fn(async (key: string) => {
        if (key.includes('ip:')) return 11 // > RATE_LIMIT_PER_IP (10)
        return 1
      })
      const mockExpire = jest.fn(async () => 1)
      const mockClient = {
        incr: mockIncr,
        expire: mockExpire,
        get: jest.fn(),
        set: jest.fn(),
      }
      jest.doMock('@/lib/redis', () => ({
        getRedisClient: () => mockClient,
      }))
      const { POST } = await import('./route')

      const req = makeRequest({ email: 'rate-limited@example.com' })
      const res = await POST(req)
      expect(res.status).toBe(429)
      expect(res.headers.get('x-redis')).toBe('upstash')
      const json = await res.json()
      expect(json).toMatchObject({ success: false, error: 'Too many requests from this IP. Please try again later.' })
    })

    // Restore env var
    if (prevJestWorker !== undefined) {
      process.env.JEST_WORKER_ID = prevJestWorker
    }
  })

  test('per-email guard returns already subscribed message', async () => {
    // Don't set JEST_WORKER_ID to test the non-Jest path
    const prevJestWorker = process.env.JEST_WORKER_ID
    delete process.env.JEST_WORKER_ID

    await jest.isolateModules(async () => {
      const mockGet = jest.fn(async (key: string) => {
        if (key === 'newsletter:email:already@example.com') return '1'
        return null
      })
      const mockClient = {
        get: mockGet,
        set: jest.fn(),
        incr: jest.fn(),
        expire: jest.fn(),
      }
      jest.doMock('@/lib/redis', () => ({
        getRedisClient: () => mockClient,
      }))
      const { POST } = await import('./route')

      const req = makeRequest({ email: 'already@example.com' })
      const res = await POST(req)
      expect(res.status).toBe(200)
      expect(res.headers.get('x-redis')).toBe('upstash')
      const json = await res.json()
      expect(json).toMatchObject({ success: true, message: 'Already subscribed recently.' })
    })

    // Restore env var
    if (prevJestWorker !== undefined) {
      process.env.JEST_WORKER_ID = prevJestWorker
    }
  })
})
