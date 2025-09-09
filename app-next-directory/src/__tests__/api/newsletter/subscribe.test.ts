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

    // Simulate retry with same idempotency key
    const req2 = makeRequest({ email: 'idemo@example.com' }, headers)
    const res2 = await POST(req2)
    const body2 = await res2.json()
    expect(res2.status).toBe(200)
    expect(body2.success).toBe(true)
  })
})
