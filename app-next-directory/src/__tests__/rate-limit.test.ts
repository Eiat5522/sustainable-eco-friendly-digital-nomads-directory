// Jest test for rate-limit.ts

import rateLimit, { rateLimitStore, rateLimiters } from '../utils/rate-limit';

describe('rateLimit', () => {
  beforeEach(() => {
    rateLimitStore.clear();
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  function mockRequest(headers: Record<string, string> = {}) {
    // Ensure all keys are lowercased for lookup
    const lowerHeaders = Object.fromEntries(
      Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v])
    );
    return {
      headers: {
        get: (key: string) => lowerHeaders[key.toLowerCase()] || null,
      },
    } as any;
  }

  it('uses x-forwarded-for header', () => {
    const limiter = rateLimit({ max: 1, windowMs: 1000 });
    const req = mockRequest({ 'x-forwarded-for': '1.2.3.4' });
    const result = limiter(req);
    expect(result.success).toBe(true);
    // Second call should fail due to limit
    const result2 = limiter(req);
    expect(result2.success).toBe(false);
  });

  it('uses x-real-ip header', () => {
    const limiter = rateLimit({ max: 1, windowMs: 1000 });
    const req = mockRequest({ 'x-real-ip': '5.6.7.8' });
    const result = limiter(req);
    expect(result.success).toBe(true);
    const result2 = limiter(req);
    expect(result2.success).toBe(false);
  });

  it('uses cf-connecting-ip header', () => {
    const limiter = rateLimit({ max: 1, windowMs: 1000 });
    const req = mockRequest({ 'cf-connecting-ip': '9.10.11.12' });
    const result = limiter(req);
    expect(result.success).toBe(true);
    const result2 = limiter(req);
    expect(result2.success).toBe(false);
  });

  it('falls back to unknown IP', () => {
    const limiter = rateLimit({ max: 1, windowMs: 1000 });
    const req = mockRequest();
    const result = limiter(req);
    expect(result.success).toBe(true);
    const result2 = limiter(req);
    expect(result2.success).toBe(false);
  });

  it('respects custom keyGenerator', () => {
    const limiter = rateLimit({
      max: 1,
      windowMs: 1000,
      keyGenerator: () => 'custom-key',
    });
    const result = limiter(mockRequest());
    expect(result.success).toBe(true);
    const result2 = limiter(mockRequest());
    expect(result2.success).toBe(false);
  });

  it('returns success until limit is hit', () => {
    const limiter = rateLimit({ max: 2, windowMs: 1000 });
    const req = mockRequest({ 'x-forwarded-for': '1.2.3.4' });
    limiter(req);
    limiter(req);
    const result = limiter(req);
    expect(result.success).toBe(false); // Should fail on third call
  });

  it('resets after window', () => {
    const limiter = rateLimit({ max: 1, windowMs: 1000 });
    const req = mockRequest({ 'x-forwarded-for': '1.2.3.4' });
    const result = limiter(req);
    expect(result.success).toBe(true);
    jest.advanceTimersByTime(1001);
    const result2 = limiter(req);
    expect(result2.success).toBe(true);
  });

  it('predefined rateLimiters work', () => {
    expect(rateLimiters.contactForm).toBeDefined();
    expect(rateLimiters.apiGeneral).toBeDefined();
    expect(rateLimiters.search).toBeDefined();
  });

  it('cleans up expired entries', () => {
    const limiter = rateLimit({ max: 1, windowMs: 1 });
    const req = mockRequest({ 'x-forwarded-for': '1.2.3.4' });
    const result = limiter(req);
    expect(result.success).toBe(true);
    jest.advanceTimersByTime(10 * 60 * 1000 + 1);
    // After cleanup, should allow again
    const result2 = limiter(req);
    expect(result2.success).toBe(true);
  });
});