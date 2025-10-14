import { POST, testControl } from './route';

// Minimal mock for Request with headers/body
function makeRequest(body: any, headers: Record<string, string> = {}) {
  const blob = JSON.stringify(body);
  const req: any = {
    json: async () => JSON.parse(blob),
    headers: {
      get: (k: string) => headers[k] || headers[k.toLowerCase()] || null,
    },
  };
  return req as Request;
}

describe('POST /api/newsletter/subscribe', () => {
  beforeEach(() => {
    // Reset the override functions before each test
    testControl.memoryGetOverride = undefined;
    testControl.memoryIncrOverride = undefined;
    // It's better to clear the map rather than resetting modules
    jest.requireActual('./route')._clearMemoryStore();
  });

  test('returns 422 for invalid email', async () => {
    const req = makeRequest({ email: 'not-an-email' });
    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(422);
    expect(body.success).toBe(false);
  });

  test('rate limits by IP after threshold', async () => {
    const headers = { 'x-forwarded-for': '1.2.3.4' };
    for (let i = 0; i < 11; i++) {
      const req = makeRequest({ email: `test${i}@example.com` }, headers);
      const res = await POST(req);
      const body = await res.json();
      if (i < 10) {
        expect(res.status).not.toBe(429);
      } else {
        expect(res.status).toBe(429);
        expect(body.success).toBe(false);
      }
    }
  });

  test('short-circuits duplicate email within window', async () => {
    const req1 = makeRequest({ email: 'dup@example.com' });
    const res1 = await POST(req1);
    const body1 = await res1.json();
    expect(res1.status).toBe(200);
    expect(body1.success).toBe(true);

    const req2 = makeRequest({ email: 'dup@example.com' });
    const res2 = await POST(req2);
    const body2 = await res2.json();
    expect(res2.status).toBe(200);
    expect(body2.success).toBe(true);
    expect(body2.message).toBe('Already subscribed recently.');
  });

  test('idempotency key replay returns same success body', async () => {
    const { POST, _clearMemoryStore } = await import('./route');
    _clearMemoryStore(); // start with a clean slate

    const headers = { 'Idempotency-Key': 'abc-123' };
    const req1 = makeRequest({ email: 'idemo@example.com' }, headers);
    const res1 = await POST(req1);
    const json1 = await res1.json();

    expect(res1.status).toBe(200);
    expect(json1.message).toBe('Thank you for subscribing to our newsletter!');

    const req2 = makeRequest({ email: 'idemo@example.com' }, headers);
    const res2 = await POST(req2);
    const json2 = await res2.json();

    expect(res2.status).toBe(200);
    expect(json2).toEqual(json1); // Exact match
  });
});
