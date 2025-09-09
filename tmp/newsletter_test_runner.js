(async () => {
  try {
    const mod = await import('../app-next-directory/app/api/newsletter/subscribe/route.js')
    const { POST } = mod

    function makeRequest(body, headers = {}) {
      const lower = Object.fromEntries(
        Object.entries(headers).map(([k, v]) => [String(k).toLowerCase(), String(v)])
      )
      return {
        json: async () => body,
        headers: {
          get: (k) => lower[String(k).toLowerCase()] ?? null
        }
      }
    }

    console.log('Test: invalid email')
    const r1 = await POST(makeRequest({ email: 'nope' }))
    console.log('status:', r1.status)
    console.log('body:', await r1.json())

    console.log('\nTest: duplicate email short-circuit')
    const r2 = await POST(makeRequest({ email: 'dup@example.com' }))
    console.log('first status:', r2.status, 'body:', await r2.json())
    const r3 = await POST(makeRequest({ email: 'dup@example.com' }))
    console.log('second status:', r3.status, 'body:', await r3.json())

    console.log('\nTest: idempotency replay')
    const headers = { 'Idempotency-Key': 'abc-123' }
    const r4 = await POST(makeRequest({ email: 'idemo@example.com' }, headers))
    console.log('first idemp status:', r4.status, 'body:', await r4.json())
    const r5 = await POST(makeRequest({ email: 'idemo@example.com' }, headers))
    console.log('second idemp status:', r5.status, 'body:', await r5.json())
  } catch (e) {
    console.error('Runner error', e)
  }
})()
