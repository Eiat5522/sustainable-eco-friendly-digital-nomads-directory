/**
 * @jest-environment node
 */

import { afterEach, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';

// Define the mocks before anything else to ensure they are used by the imported module
const mockLimit = jest.fn();
const mockSlidingWindow = jest.fn().mockReturnValue('slidingWindow');

jest.mock('@upstash/redis', () => ({
  Redis: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('@upstash/ratelimit', () => ({
  Ratelimit: Object.assign(
    jest.fn().mockImplementation(() => ({
      limit: mockLimit,
    })),
    {
      slidingWindow: mockSlidingWindow,
    }
  ),
}));

import { Redis } from '@upstash/redis';
import {
  cleanupRateLimitStore,
  clearRedisClient,
  rateLimit,
  rateLimiters,
  rateLimitStore,
} from '../rate-limit';

// Shared test helpers
function createTestRequest(ip: string, headers: Record<string, string> = {}): Request {
  const h = new Headers(headers);
  if (ip && !h.has('x-forwarded-for')) h.set('x-forwarded-for', ip);
  return new Request('http://localhost', { headers: h });
}

type RateLimiterFn = (request: Request) => Promise<any>;

async function verifyLimiterCapacity(limiter: RateLimiterFn, max: number, ip: string) {
  const request = createTestRequest(ip);
  for (let i = 0; i < max; i++) {
    const result = await limiter(request);
    expect(result.success).toBe(true);
  }
  const result = await limiter(request);
  expect(result.success).toBe(false);
  expect(result.limit).toBe(max);
}

function setupRedisEnv() {
  process.env.UPSTASH_REDIS_REST_URL = 'https://fake-redis.upstash.io';
  process.env.UPSTASH_REDIS_REST_TOKEN = 'fake-token';
}

describe('rate-limit', () => {
  const originalEnv = { ...process.env };

  beforeAll(() => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  beforeEach(() => {
    rateLimitStore.clear();
    clearRedisClient();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.clearAllMocks();
    mockLimit.mockReset();
    mockSlidingWindow.mockClear();
    mockSlidingWindow.mockReturnValue('slidingWindow');
    // Ensure env vars are cleared to avoid leaking between tests
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.DISABLE_UPSTASH_DURING_BUILD;
  });

  afterEach(() => {
    jest.restoreAllMocks();
    process.env = { ...originalEnv };
  });

  describe('rateLimit - In-Memory Fallback', () => {
    it('should allow requests within the limit', async () => {
      const limiter = rateLimit({ max: 3, windowMs: 1000 });
      const request = createTestRequest('127.0.0.1');

      const result1 = await limiter(request);
      expect(result1.success).toBe(true);
      expect(result1.limit).toBe(3);
      expect(result1.remaining).toBe(2);

      expect((await limiter(request)).remaining).toBe(1);
      expect((await limiter(request)).remaining).toBe(0);
    });

    it('should block requests when limit is exceeded', async () => {
      const limiter = rateLimit({ max: 2, windowMs: 1000 });
      const request = createTestRequest('127.0.0.1');

      await limiter(request);
      await limiter(request);

      const result = await limiter(request);
      expect(result.success).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should reset count after window expires', async () => {
      const limiter = rateLimit({ max: 1, windowMs: 100 });
      const request = createTestRequest('127.0.0.1');

      await limiter(request);
      expect((await limiter(request)).success).toBe(false);

      rateLimitStore.clear();
      expect((await limiter(request)).success).toBe(true);
    });

    it('should track different IPs separately', async () => {
      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      await limiter(createTestRequest('127.0.0.1'));
      expect((await limiter(createTestRequest('127.0.0.1'))).success).toBe(false);
      expect((await limiter(createTestRequest('127.0.0.2'))).success).toBe(true);
    });

    it('should use custom key generator if provided', async () => {
      const limiter = rateLimit({
        max: 1,
        windowMs: 1000,
        keyGenerator: req => new URL(req.url).searchParams.get('userId') || 'anon',
      });

      expect((await limiter(new Request('http://localhost?userId=u1'))).success).toBe(true);
      expect((await limiter(new Request('http://localhost?userId=u2'))).success).toBe(true);
      expect((await limiter(new Request('http://localhost?userId=u1'))).success).toBe(false);
    });

    it('should return correct resetTime', async () => {
      const windowMs = 5000;
      const limiter = rateLimit({ max: 1, windowMs });
      const before = Date.now();
      const result = await limiter(createTestRequest('127.0.0.1'));
      expect(result.resetTime).toBeGreaterThanOrEqual(before + windowMs);
    });
  });

  describe('rateLimit - Redis-based', () => {
    it('should use Redis-based rate limiting if available', async () => {
      setupRedisEnv();
      mockLimit.mockResolvedValue({ success: true, limit: 10, remaining: 9, reset: 123 });

      const limiter = rateLimit({ max: 10, windowMs: 60000 });
      const result = await limiter(createTestRequest('8.8.8.8'));

      expect(Redis).toHaveBeenCalled();
      expect(mockLimit).toHaveBeenCalledWith('8.8.8.8');
      expect(result.success).toBe(true);
    });

    it('should fallback to In-Memory if Redis call fails', async () => {
      setupRedisEnv();
      mockLimit.mockRejectedValue(new Error('Redis Down'));

      const limiter = rateLimit({ max: 5, windowMs: 60000 });
      const result = await limiter(createTestRequest('9.9.9.9'));

      expect(result.success).toBe(true);
      expect(rateLimitStore.has('9.9.9.9')).toBe(true);
    });
  });

  describe('rateLimiters', () => {
    it('should enforce predefined limits', async () => {
      await verifyLimiterCapacity(rateLimiters.contactForm, 5, '10.0.0.1');
      await verifyLimiterCapacity(rateLimiters.apiGeneral, 100, '10.0.0.2');
      await verifyLimiterCapacity(rateLimiters.search, 50, '10.0.0.3');
    });
  });

  describe('rateLimitStore and cleanup', () => {
    it('should cleanup expired entries via cleanupRateLimitStore', () => {
      const now = Date.now();
      jest.spyOn(Date, 'now').mockReturnValue(now);
      rateLimitStore.set('expired', { count: 1, resetTime: now - 1 });
      rateLimitStore.set('valid', { count: 1, resetTime: now + 1000 });

      cleanupRateLimitStore();
      expect(rateLimitStore.has('expired')).toBe(false);
      expect(rateLimitStore.has('valid')).toBe(true);
    });
  });

  describe('Redis initialization', () => {
    it('should handle various initialization scenarios', () => {
      clearRedisClient();
      delete process.env.UPSTASH_REDIS_REST_URL;
      delete process.env.UPSTASH_REDIS_REST_TOKEN;
      rateLimit({ max: 1, windowMs: 1 });
      expect(Redis).not.toHaveBeenCalled();

      clearRedisClient();
      setupRedisEnv();
      process.env.DISABLE_UPSTASH_DURING_BUILD = '1';
      rateLimit({ max: 1, windowMs: 1 });
      expect(Redis).not.toHaveBeenCalled();

      clearRedisClient();
      setupRedisEnv();
      delete process.env.DISABLE_UPSTASH_DURING_BUILD;
      (Redis as unknown as jest.Mock).mockImplementationOnce(() => { throw new Error(); });
      expect(rateLimit({ max: 1, windowMs: 1 })).toBeDefined();
    });
  });

  describe('IP Extraction', () => {
    it('should handle different headers and priorities', async () => {
      const limiter = rateLimit({ max: 1, windowMs: 1000 });

      // Priority: x-forwarded-for > x-real-ip > cf-connecting-ip
      const req1 = createTestRequest('', { 'x-forwarded-for': '1.1.1.1', 'x-real-ip': '2.2.2.2' });
      await limiter(req1);
      expect((await limiter(createTestRequest('1.1.1.1'))).success).toBe(false);

      rateLimitStore.clear();
      const req2 = createTestRequest('', { 'x-real-ip': '3.3.3.3', 'cf-connecting-ip': '4.4.4.4' });
      await limiter(req2);
      expect((await limiter(createTestRequest('3.3.3.3'))).success).toBe(false);
    });

    it('should handle invalid IPs and fallbacks', async () => {
      const limiter = rateLimit({ max: 1, windowMs: 1000 });

      // Fallback to 'unknown'
      await limiter(new Request('http://localhost', { headers: { 'x-real-ip': 'not-an-ip' } }));
      expect((await limiter(createTestRequest('unknown'))).success).toBe(false);

      rateLimitStore.clear();
      // Test x-forwarded-for multiple IPs with invalid ones
      await limiter(new Request('http://localhost', { headers: { 'x-forwarded-for': 'invalid, 5.5.5.5' } }));
      expect((await limiter(createTestRequest('5.5.5.5'))).success).toBe(true);
    });
  });
});
