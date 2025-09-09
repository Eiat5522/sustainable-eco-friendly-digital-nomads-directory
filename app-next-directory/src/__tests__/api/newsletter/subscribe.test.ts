// Tests for newsletter subscribe endpoint (mirrors repo-root tests)

// Minimal mock for Request with headers/body
function makeRequest(body: any, headers: Record<string,string> = {}) {
  const blob = JSON.stringify(body)
  const req: any = {
    json: async () => JSON.parse(blob),
    headers: {
      get: (k: string) => headers[k] || headers[k.toLowerCase()] || null
    }
  }
  return req as Request
}

describe('POST /api/newsletter/subscribe (app-next-directory copy)', () => {
  beforeEach(() => {
    jest.resetModules()
  })

  test('returns 422 for invalid email', async () => {
    const { POST } = await import('../../../../app/api/newsletter/subscribe/route')
    const req = makeRequest({ email: 'not-an-email' })
    const res = await POST(req)
    const body = await res.json()
    expect(res.status).toBe(422)
    expect(body.success).toBe(false)
  })

  test('short-circuits duplicate email within window', async () => {
    const { POST } = await import('../../../../app/api/newsletter/subscribe/route')
    const req1 = makeRequest({ email: 'dup@example.com' })
    const res1 = await POST(req1)
    const body1 = await res1.json()
    expect(res1.status).toBe(200)
    expect(body1.success).toBe(true)

    const req2 = makeRequest({ email: 'dup@example.com' })
    const res2 = await POST(req2)
    const body2 = await res2.json()
    expect(res2.status).toBe(200)
    expect(body2.success).toBe(true)
    expect(body2.message).toBe('Already subscribed recently.')
  })

  test('idempotency key replays stored response', async () => {
    const { POST } = await import('../../../../app/api/newsletter/subscribe/route')
    const headers = { 'Idempotency-Key': 'abc-123' }
    const req1 = makeRequest({ email: 'idemo@example.com' }, headers)
    const res1 = await POST(req1)
    const body1 = await res1.json()
    expect(res1.status).toBe(200)
    expect(body1.success).toBe(true)
    expect(body1.message).toBe('Thank you for subscribing to our newsletter!')

    // Simulate retry with same idempotency key
    const req2 = makeRequest({ email: 'idemo@example.com' }, headers)
    const res2 = await POST(req2)
    const body2 = await res2.json()
    expect(res2.status).toBe(200)
    expect(body2.success).toBe(true)
    expect(body2.message).toBe('Thank you for subscribing to our newsletter!')
  })

  test('idempotency key works for duplicate email short-circuit', async () => {
    const { POST } = await import('../../../../app/api/newsletter/subscribe/route')
    const email = 'dup-idemo@example.com'
    const idempotencyKey = 'xyz-456'

    // 1. First call to subscribe the email
    const req1 = makeRequest({ email })
    const res1 = await POST(req1)
    expect(res1.status).toBe(200)

    // 2. Second call, which should be a short-circuit, but with an idempotency key
    const req2 = makeRequest({ email }, { 'Idempotency-Key': idempotencyKey })
    const res2 = await POST(req2)
    const body2 = await res2.json()
    expect(res2.status).toBe(200)
    expect(body2.message).toBe('Already subscribed recently.')

    // 3. Third call, with the same idempotency key, should replay the short-circuit response
    const req3 = makeRequest({ email }, { 'Idempotency-Key': idempotencyKey })
    const res3 = await POST(req3)
    const body3 = await res3.json()
    expect(res3.status).toBe(200)
    expect(body3.message).toBe('Already subscribed recently.')
  })
})
