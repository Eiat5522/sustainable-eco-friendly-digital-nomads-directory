/**
 * @jest-environment node
 */

import { afterEach, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { cleanupRateLimitStore, clearRedisClient, rateLimit, rateLimiters, rateLimitStore } from '../rate-limit';

// Mock dependencies
jest.mock('@upstash/redis', () => ({
  Redis: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('@upstash/ratelimit', () => {
  const mockSlidingWindow = jest.fn().mockReturnValue({});
  return {
    Ratelimit: Object.assign(
      jest.fn().mockImplementation(() => ({
        limit: jest.fn(),
      })),
      {
        slidingWindow: mockSlidingWindow,
      }
    ),
  };
});

function createReq(h: Record<string, string> = {}) {
  return new Request('https://example.com', { headers: new Headers(h) });
}

describe('rate-limit', () => {
  const originalEnv = { ...process.env };

  beforeAll(() => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.DISABLE_UPSTASH_DURING_BUILD;
  });

  beforeEach(() => {
    clearRedisClient();
    rateLimitStore.clear();
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('should allow requests and respect window reset', async () => {
    const l = rateLimit({ max: 1, windowMs: 20 });
    const r = createReq({ 'x-forwarded-for': '1.1.1.1' });
    expect((await l(r)).success).toBe(true);
    expect((await l(r)).success).toBe(false);
    await new Promise(res => setTimeout(res, 30));
    expect((await l(r)).success).toBe(true);
  });

  it.each([
    ['x-forwarded-for', '1.2.3.4', '1.2.3.4'],
    ['x-forwarded-for', '1.2.3.4, 5.6.7.8', '1.2.3.4'],
    ['x-real-ip', '2.3.4.5', '2.3.4.5'],
    ['cf-connecting-ip', '3.4.5.6', '3.4.5.6'],
    ['invalid', 'not-an-ip', 'unknown'],
    ['empty-split', ',', 'unknown'],
    ['none', '', 'unknown'],
  ])('should extract IP from %s', async (header, val, exp) => {
    const l = rateLimit({ max: 1, windowMs: 1000 });
    const h = header !== 'none' ? { [header]: val } : {};
    await l(createReq(h));
    expect(rateLimitStore.has(exp)).toBe(true);
  });

  describe('Redis Integration', () => {
    beforeEach(() => {
      process.env.UPSTASH_REDIS_REST_URL = 'http://127.0.0.1';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'mock-token';
    });

    it('should initialize and respect build-time skip', () => {
      rateLimit({ max: 1, windowMs: 1000 });
      expect(Redis).toHaveBeenCalled();
      clearRedisClient();
      process.env.DISABLE_UPSTASH_DURING_BUILD = '1';
      rateLimit({ max: 1, windowMs: 1000 });
      expect(Redis).toHaveBeenCalledTimes(1);
    });

    it('should handle partial Redis credentials', () => {
      process.env.UPSTASH_REDIS_REST_URL = 'http://test';
      delete process.env.UPSTASH_REDIS_REST_TOKEN;
      rateLimit({ max: 10, windowMs: 1000 });
      expect(Redis).not.toHaveBeenCalled();
    });

    it('should fallback on initialization error', async () => {
      (Redis as unknown as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Redis init failed');
      });
      const l = rateLimit({ max: 1, windowMs: 1000 });
      await l(createReq({ 'x-forwarded-for': '9.8.7.6' }));
      expect(rateLimitStore.has('9.8.7.6')).toBe(true);
    });

    it('should fallback on limit error with IP or custom key', async () => {
      const mockLimit = jest.fn().mockRejectedValue(new Error('Redis limit failed'));
      (Ratelimit as unknown as jest.Mock).mockImplementationOnce(() => ({ limit: mockLimit }));

      const l1 = rateLimit({ max: 1, windowMs: 1000 });
      await l1(createReq({ 'x-forwarded-for': '4.4.4.4' }));
      expect(rateLimitStore.has('4.4.4.4')).toBe(true);

      const l2 = rateLimit({ max: 1, windowMs: 1000, keyGenerator: () => 'custom' });
      await l2(createReq());
      expect(rateLimitStore.has('custom')).toBe(true);
    });

    it('should use Redis results when successful', async () => {
      const mockLimit = jest.fn().mockResolvedValue({ success: true, limit: 10, remaining: 5, reset: 123 });
      (Ratelimit as unknown as jest.Mock).mockImplementationOnce(() => ({ limit: mockLimit }));

      const res = await rateLimit({ max: 10, windowMs: 1000 })(createReq());
      expect(res.resetTime).toBe(123);

      // Branch coverage: keyGenerator in Redis path
      (Ratelimit as unknown as jest.Mock).mockImplementationOnce(() => ({ limit: mockLimit }));
      clearRedisClient();
      const l = rateLimit({ max: 10, windowMs: 1000, keyGenerator: () => 'redis-custom' });
      await l(createReq());
      expect(mockLimit).toHaveBeenCalledWith('redis-custom');
    });
  });

  it('should cleanup store and work with predefined limiters', async () => {
    const now = Date.now();
    rateLimitStore.set('old', { count: 1, resetTime: now - 1 });
    cleanupRateLimitStore();
    expect(rateLimitStore.has('old')).toBe(false);

    for (const [name, l] of Object.entries(rateLimiters)) {
      expect((await l(createReq({ 'x-forwarded-for': `1.2.3.${name}` }))).success).toBe(true);
    }
  });

  it('should handle environment-based cleanup interval', async () => {
    const mockSetInterval = jest.spyOn(globalThis, 'setInterval');
    const mockUnref = jest.fn();
    mockSetInterval.mockReturnValue({ unref: mockUnref } as any);

    const oldEnv = process.env.NODE_ENV;
    const oldWorker = process.env.JEST_WORKER_ID;

    process.env.NODE_ENV = 'production';
    delete process.env.JEST_WORKER_ID;

    // Isolate module to re-trigger internal state setup
    jest.resetModules();
    await import('../rate-limit');

    expect(mockSetInterval).toHaveBeenCalled();

    process.env.NODE_ENV = oldEnv;
    process.env.JEST_WORKER_ID = oldWorker;
    mockSetInterval.mockRestore();
  });
});
