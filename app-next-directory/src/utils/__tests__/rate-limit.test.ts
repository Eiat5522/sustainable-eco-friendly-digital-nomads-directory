// rate-limit.test.ts
import { rateLimit, rateLimiters, rateLimitStore } from '../rate-limit';

function mockRequest(headers: Record<string, string> = {}) {
  return {
    headers: {
      get: (key: string) => headers[key.toLowerCase()] || undefined,
    },
  } as unknown as Request;
}

describe('rateLimit', () => {
  let intervalId: NodeJS.Timeout;
  beforeEach(() => {
    // Clear the in-memory store before each test
    const store = (global as any).rateLimitStore;
    console.log('Before test, store size:', rateLimitStore.size);
    if (store && typeof store.clear === 'function') store.clear();
  });

  it('allows requests under the limit', () => {
    const limiter = rateLimit({ max: 2, windowMs: 1000 });
    const req = mockRequest({ 'x-forwarded-for': '1.2.3.4' });
    expect(limiter(req).success).toBe(true);
    expect(limiter(req).success).toBe(true);
  });

  it('blocks requests over the limit', () => {
    const limiter = rateLimit({ max: 1, windowMs: 1000 });
    const req = mockRequest({ 'x-forwarded-for': '5.6.7.8' });
    limiter(req);
    const result = limiter(req);
    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('resets after window expires', () => {
    jest.useFakeTimers();
    const limiter = rateLimit({ max: 1, windowMs: 100 });
    const req = mockRequest({ 'x-forwarded-for': '9.9.9.9' });
    limiter(req);
    jest.advanceTimersByTime(200);
    const result = limiter(req);
    expect(result.success).toBe(true);
    jest.useRealTimers();
  });

  it('uses custom keyGenerator', () => {
    const limiter = rateLimit({
      max: 1,
      windowMs: 1000,
      keyGenerator: () => 'custom-key',
    });
    const req = mockRequest();
    limiter(req);
    const result = limiter(req);
    expect(result.success).toBe(false);
  });

  it('returns "unknown" if no IP headers', () => {
    const limiter = rateLimit({ max: 1, windowMs: 1000 });
    const req = mockRequest();
    const result = limiter(req);
    expect(result.success).toBe(true);
  });
});

describe('rateLimiters predefined', () => {
  it('contactForm limiter works', () => {
    const req = mockRequest({ 'x-forwarded-for': '10.0.0.1' });
    for (let i = 0; i < 5; i++) {
      expect(rateLimiters.contactForm(req).success).toBe(true);
    }
    expect(rateLimiters.contactForm(req).success).toBe(false);
  });
});