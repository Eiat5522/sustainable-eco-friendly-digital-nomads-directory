/**
 * @jest-environment node
 */

import { afterEach, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';

// Define mocks for Redis
const mockRedis = jest.fn();
const mockRatelimit = jest.fn() as any;
mockRatelimit.slidingWindow = jest.fn();

jest.mock('@upstash/redis', () => ({
  Redis: mockRedis,
}));

jest.mock('@upstash/ratelimit', () => ({
  Ratelimit: mockRatelimit,
}));

import {
  rateLimit,
  rateLimiters,
  rateLimitStore,
  cleanupRateLimitStore,
  clearRedisClient,
  clearRateLimitStore,
} from '../rate-limit';

describe('rate-limit', () => {
  // Store original env vars
  const originalEnv = { ...process.env };

  beforeAll(() => {
    // Ensure Redis is not initialized during standard tests
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  beforeEach(() => {
    // Clear the rate limit store before each test
    clearRateLimitStore();
    clearRedisClient();
    jest.clearAllMocks();
    // Mock console.log to avoid noise in test output
    jest.spyOn(console, 'log').mockImplementation(() => {});
    // Mock console.warn to avoid noise from Redis initialization
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    // Restore env vars
    process.env = { ...originalEnv };
  });

  describe('rateLimit', () => {
    it('should allow requests within the limit', async () => {
      const limiter = rateLimit({ max: 3, windowMs: 1000 });
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '127.0.0.1' },
      });

      const result1 = await limiter(request);
      expect(result1.success).toBe(true);
      expect(result1.limit).toBe(3);
      expect(result1.remaining).toBe(2);

      const result2 = await limiter(request);
      expect(result2.success).toBe(true);
      expect(result2.remaining).toBe(1);

      const result3 = await limiter(request);
      expect(result3.success).toBe(true);
      expect(result3.remaining).toBe(0);
    });

    it('should block requests when limit is exceeded', async () => {
      const limiter = rateLimit({ max: 2, windowMs: 1000 });
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '127.0.0.1' },
      });

      await limiter(request); // First request
      await limiter(request); // Second request

      const result = await limiter(request); // Third request should be blocked
      expect(result.success).toBe(false);
      expect(result.limit).toBe(2);
      expect(result.remaining).toBe(0);
    });

    it('should reset count after window expires', async () => {
      const limiter = rateLimit({ max: 2, windowMs: 100 }); // 100ms window
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '127.0.0.1' },
      });

      // Use up the limit
      const result1 = await limiter(request);
      expect(result1.success).toBe(true);
      const result2 = await limiter(request);
      expect(result2.success).toBe(true);

      const blockedResult = await limiter(request);
      expect(blockedResult.success).toBe(false);

      // Manually clear the store to simulate window expiration
      clearRateLimitStore();

      // Should allow requests again after manual reset
      const newResult = await limiter(request);
      expect(newResult.success).toBe(true);
      expect(newResult.remaining).toBe(1);
    });

    it('should track different IPs separately', async () => {
      const limiter = rateLimit({ max: 2, windowMs: 1000 });

      const request1 = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '127.0.0.1' },
      });
      const request2 = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '127.0.0.2' },
      });

      // First IP
      const result1a = await limiter(request1);
      expect(result1a.success).toBe(true);
      const result1b = await limiter(request1);
      expect(result1b.success).toBe(true);

      // Second IP should have its own limit
      const result2a = await limiter(request2);
      expect(result2a.success).toBe(true);
      expect(result2a.remaining).toBe(1);
    });

    it('should use x-forwarded-for header for IP', async () => {
      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '192.168.1.1, 10.0.0.1' },
      });

      const result = await limiter(request);
      expect(result.success).toBe(true);

      // Should use the first IP in the list
      const result2 = await limiter(request);
      expect(result2.success).toBe(false);
    });

    it('should use x-real-ip header if x-forwarded-for is not present', async () => {
      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      const request = new Request('http://localhost', {
        headers: { 'x-real-ip': '192.168.1.1' },
      });

      const result = await limiter(request);
      expect(result.success).toBe(true);

      const result2 = await limiter(request);
      expect(result2.success).toBe(false);
    });

    it('should use cf-connecting-ip header if others are not present', async () => {
      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      const request = new Request('http://localhost', {
        headers: { 'cf-connecting-ip': '192.168.1.1' },
      });

      const result = await limiter(request);
      expect(result.success).toBe(true);

      const result2 = await limiter(request);
      expect(result2.success).toBe(false);
    });

    it('should use "unknown" as fallback if no IP headers present', async () => {
      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      const request = new Request('http://localhost');

      const result = await limiter(request);
      expect(result.success).toBe(true);

      const result2 = await limiter(request);
      expect(result2.success).toBe(false);
    });

    it('should use custom key generator if provided', async () => {
      const limiter = rateLimit({
        max: 1,
        windowMs: 1000,
        keyGenerator: req => {
          const url = new URL(req.url);
          return url.searchParams.get('userId') || 'anonymous';
        },
      });

      const request1 = new Request('http://localhost?userId=user1');
      const request2 = new Request('http://localhost?userId=user2');

      // Different keys should have separate limits
      const result1a = await limiter(request1);
      expect(result1a.success).toBe(true);

      const result2a = await limiter(request2);
      expect(result2a.success).toBe(true);

      // Same key should be limited
      const result1b = await limiter(request1);
      expect(result1b.success).toBe(false);
    });

    it('should return correct resetTime', async () => {
      const windowMs = 5000;
      const limiter = rateLimit({ max: 1, windowMs });
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '127.0.0.1' },
      });

      const before = Date.now();
      const result = await limiter(request);
      const after = Date.now();

      expect(result.resetTime).toBeGreaterThanOrEqual(before + windowMs);
      expect(result.resetTime).toBeLessThanOrEqual(after + windowMs);
    });

    it('should handle multiple requests at the exact limit', async () => {
      const limiter = rateLimit({ max: 5, windowMs: 1000 });
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '127.0.0.1' },
      });

      // Make exactly max requests
      for (let i = 0; i < 5; i++) {
        const result = await limiter(request);
        expect(result.success).toBe(true);
      }

      // Next one should fail
      const result = await limiter(request);
      expect(result.success).toBe(false);
      expect(result.remaining).toBe(0);
    });
  });

  describe('rateLimiters', () => {
    it('should have contactForm limiter configured', () => {
      expect(rateLimiters.contactForm).toBeDefined();
      expect(typeof rateLimiters.contactForm).toBe('function');
    });

    it('should have apiGeneral limiter configured', () => {
      expect(rateLimiters.apiGeneral).toBeDefined();
      expect(typeof rateLimiters.apiGeneral).toBe('function');
    });

    it('should have search limiter configured', () => {
      expect(rateLimiters.search).toBeDefined();
      expect(typeof rateLimiters.search).toBe('function');
    });

    it('contactForm limiter should enforce 5 requests limit', async () => {
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '127.0.0.1' },
      });

      // Make 5 requests (should all succeed)
      for (let i = 0; i < 5; i++) {
        const result = await rateLimiters.contactForm(request);
        expect(result.success).toBe(true);
      }

      // 6th request should fail
      const result = await rateLimiters.contactForm(request);
      expect(result.success).toBe(false);
      expect(result.limit).toBe(5);
    });

    it('apiGeneral limiter should enforce 100 requests limit', async () => {
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '127.0.0.2' },
      });

      // Make 100 requests (should all succeed)
      for (let i = 0; i < 100; i++) {
        const result = await rateLimiters.apiGeneral(request);
        expect(result.success).toBe(true);
      }

      // 101st request should fail
      const result = await rateLimiters.apiGeneral(request);
      expect(result.success).toBe(false);
      expect(result.limit).toBe(100);
    });

    it('search limiter should enforce 50 requests limit', async () => {
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '127.0.0.3' },
      });

      // Make 50 requests (should all succeed)
      for (let i = 0; i < 50; i++) {
        const result = await rateLimiters.search(request);
        expect(result.success).toBe(true);
      }

      // 51st request should fail
      const result = await rateLimiters.search(request);
      expect(result.success).toBe(false);
      expect(result.limit).toBe(50);
    });
  });

  describe('rateLimitStore', () => {
    it('should be a Map', () => {
      expect(rateLimitStore instanceof Map).toBe(true);
    });

    it('should store rate limit information', async () => {
      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '127.0.0.1' },
      });

      await limiter(request);

      expect(rateLimitStore.size).toBeGreaterThan(0);
    });

    it('should allow manual clearing', async () => {
      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '127.0.0.1' },
      });

      await limiter(request);
      expect(rateLimitStore.size).toBeGreaterThan(0);

      clearRateLimitStore();
      expect(rateLimitStore.size).toBe(0);
    });

    it('should cleanup expired entries via cleanupRateLimitStore', async () => {
      const limiter = rateLimit({ max: 1, windowMs: 50 });
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '192.168.1.100' },
      });

      await limiter(request);
      expect(rateLimitStore.size).toBeGreaterThan(0);

      const entries = Array.from(rateLimitStore.entries());
      if (entries.length > 0) {
        const [key, info] = entries[0]!;
        rateLimitStore.set(key, { ...info, resetTime: Date.now() - 1000 });

        cleanupRateLimitStore();

        expect(rateLimitStore.has(key)).toBe(false);
      }
    });
  });

  describe('Redis-based rate limiting', () => {
    beforeEach(() => {
      process.env.UPSTASH_REDIS_REST_URL = 'http://test.redis';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';
    });

    it('should initialize Redis and use Ratelimit', async () => {
      const mockLimit = jest.fn().mockImplementation(() =>
        Promise.resolve({
          success: true,
          limit: 10,
          remaining: 9,
          reset: 123456789,
        })
      );
      mockRatelimit.mockImplementation(() => ({
        limit: mockLimit,
      }));

      const limiter = rateLimit({ max: 10, windowMs: 1000 });
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '127.0.0.1' },
      });

      const result = await limiter(request);

      expect(mockRedis).toHaveBeenCalled();
      expect(mockRatelimit).toHaveBeenCalled();
      expect(mockLimit).toHaveBeenCalledWith('127.0.0.1');
      expect(result).toEqual({
        success: true,
        limit: 10,
        remaining: 9,
        resetTime: 123456789,
      });
    });

    it('should fallback to in-memory if Ratelimit.limit fails', async () => {
      const mockLimit = jest.fn().mockImplementation(() => Promise.reject(new Error('Redis error')));
      mockRatelimit.mockImplementation(() => ({
        limit: mockLimit,
      }));

      const limiter = rateLimit({ max: 5, windowMs: 1000 });
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '1.2.3.4' },
      });

      const result = await limiter(request);

      expect(result.success).toBe(true);
      expect(result.limit).toBe(5);
      expect(result.remaining).toBe(4);
      expect(rateLimitStore.has('1.2.3.4')).toBe(true);
    });

    it('should skip Redis if DISABLE_UPSTASH_DURING_BUILD is set', async () => {
      process.env.DISABLE_UPSTASH_DURING_BUILD = '1';

      const limiter = rateLimit({ max: 10, windowMs: 1000 });
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '127.0.0.1' },
      });

      await limiter(request);

      expect(mockRedis).not.toHaveBeenCalled();
      expect(rateLimitStore.has('127.0.0.1')).toBe(true);
    });

    it('should handle Redis constructor failure', async () => {
      mockRedis.mockImplementation(() => {
        throw new Error('Redis constructor failed');
      });

      const limiter = rateLimit({ max: 10, windowMs: 1000 });
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '127.0.0.1' },
      });

      await limiter(request);

      expect(rateLimitStore.has('127.0.0.1')).toBe(true);
    });
  });

  describe('Edge cases', () => {
    it('should handle requests with empty headers', async () => {
      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      const request = new Request('http://localhost');

      const result = await limiter(request);
      expect(result.success).toBe(true);
    });

    it('should handle x-forwarded-for with multiple IPs correctly', async () => {
      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '  192.168.1.1  , 10.0.0.1, 172.16.0.1' },
      });

      const result = await limiter(request);
      expect(result.success).toBe(true);

      // Should use first IP (trimmed)
      const result2 = await limiter(request);
      expect(result2.success).toBe(false);
    });

    it('should handle empty x-forwarded-for value', async () => {
      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '' },
      });

      // Should fall back to x-real-ip, cf-connecting-ip, or 'unknown'
      const result = await limiter(request);
      expect(result.success).toBe(true);
    });

    it('should prioritize x-forwarded-for over x-real-ip', async () => {
      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      const request1 = new Request('http://localhost', {
        headers: {
          'x-forwarded-for': '192.168.1.1',
          'x-real-ip': '10.0.0.1',
        },
      });

      await limiter(request1);

      // Different x-real-ip should still be blocked (same x-forwarded-for)
      const request2 = new Request('http://localhost', {
        headers: {
          'x-forwarded-for': '192.168.1.1',
          'x-real-ip': '10.0.0.2',
        },
      });

      const result = await limiter(request2);
      expect(result.success).toBe(false);
    });

    it('should prioritize x-real-ip over cf-connecting-ip', async () => {
      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      const request1 = new Request('http://localhost', {
        headers: {
          'x-real-ip': '192.168.1.1',
          'cf-connecting-ip': '10.0.0.1',
        },
      });

      await limiter(request1);

      // Different cf-connecting-ip should still be blocked (same x-real-ip)
      const request2 = new Request('http://localhost', {
        headers: {
          'x-real-ip': '192.168.1.1',
          'cf-connecting-ip': '10.0.0.2',
        },
      });

      const result = await limiter(request2);
      expect(result.success).toBe(false);
    });

    it('should handle zero remaining correctly', async () => {
      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '192.168.50.50' },
      });

      const result1 = await limiter(request);
      expect(result1.remaining).toBe(0);

      const result2 = await limiter(request);
      expect(result2.success).toBe(false);
      expect(result2.remaining).toBe(0);
    });

    it('should return correct resetTime for each request', async () => {
      const windowMs = 2000;
      const limiter = rateLimit({ max: 3, windowMs });
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '192.168.100.100' },
      });

      const before = Date.now();
      const result1 = await limiter(request);
      const result2 = await limiter(request);
      const after = Date.now();

      // Both should have the same resetTime
      expect(result1.resetTime).toBe(result2.resetTime);
      expect(result1.resetTime).toBeGreaterThanOrEqual(before + windowMs);
      expect(result1.resetTime).toBeLessThanOrEqual(after + windowMs);
    });
  });
});
