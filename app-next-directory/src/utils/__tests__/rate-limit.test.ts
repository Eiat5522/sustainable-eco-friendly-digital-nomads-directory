/**
 * @jest-environment node
 */

import { afterEach, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { cleanupRateLimitStore, clearRedisClient, rateLimit, rateLimiters, rateLimitStore } from '../rate-limit';

// Mock Upstash Redis and Ratelimit
jest.mock('@upstash/redis', () => {
  return {
    Redis: jest.fn().mockImplementation(() => ({
      // Add any necessary Redis methods here
    })),
  };
});

jest.mock('@upstash/ratelimit', () => {
  const mockLimit = jest.fn();
  const mockRatelimit = jest.fn().mockImplementation(() => ({
    limit: mockLimit,
  }));
  (mockRatelimit as any).slidingWindow = jest.fn().mockReturnValue('sliding-window');

  return {
    Ratelimit: mockRatelimit,
    mockLimit, // Export for easy access in tests
  };
});

const { mockLimit } = jest.requireMock('@upstash/ratelimit') as any;
const { Redis } = jest.requireMock('@upstash/redis') as any;
const { Ratelimit } = jest.requireMock('@upstash/ratelimit') as any;

describe('rate-limit', () => {
  // Store original env vars
  const originalEnv = { ...process.env };

  beforeAll(() => {
    // Ensure Redis is not initialized by default
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.DISABLE_UPSTASH_DURING_BUILD;
  });

  beforeEach(() => {
    // Clear the rate limit store before each test
    rateLimitStore.clear();
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
    it('should allow requests within the limit (in-memory)', async () => {
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

    it('should block requests when limit is exceeded (in-memory)', async () => {
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

    it('should reset count after window expires (in-memory)', async () => {
      const limiter = rateLimit({ max: 2, windowMs: 100 }); // 100ms window
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '127.0.0.1' },
      });

      // Use up the limit
      await limiter(request);
      await limiter(request);

      const blockedResult = await limiter(request);
      expect(blockedResult.success).toBe(false);

      // Manually clear the store to simulate window expiration
      rateLimitStore.clear();

      // Should allow requests again after manual reset
      const newResult = await limiter(request);
      expect(newResult.success).toBe(true);
      expect(newResult.remaining).toBe(1);
    });

    it('should track different IPs separately (in-memory)', async () => {
      const limiter = rateLimit({ max: 2, windowMs: 1000 });

      const request1 = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '127.0.0.1' },
      });
      const request2 = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '127.0.0.2' },
      });

      // First IP
      await limiter(request1);
      await limiter(request1);

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
  });

  describe('Redis path', () => {
    beforeEach(() => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://fake-redis.upstash.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'fake-token';
    });

    it('should use Redis limiter when credentials are provided', async () => {
      mockLimit.mockResolvedValue({
        success: true,
        limit: 10,
        remaining: 9,
        reset: 123456789,
      });

      const limiter = rateLimit({ max: 10, windowMs: 60000 });
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '1.2.3.4' },
      });

      const result = await limiter(request);

      expect(Redis).toHaveBeenCalled();
      expect(Ratelimit).toHaveBeenCalled();
      expect(mockLimit).toHaveBeenCalledWith('1.2.3.4');
      expect(result).toEqual({
        success: true,
        limit: 10,
        remaining: 9,
        resetTime: 123456789,
      });
    });

    it('should use custom key generator with Redis limiter', async () => {
      mockLimit.mockResolvedValue({
        success: true,
        limit: 5,
        remaining: 4,
        reset: 999,
      });

      const limiter = rateLimit({
        max: 5,
        windowMs: 10000,
        keyGenerator: () => 'custom-redis-key',
      });
      const request = new Request('http://localhost');

      await limiter(request);
      expect(mockLimit).toHaveBeenCalledWith('custom-redis-key');
    });

    it('should fallback to in-memory if Redis limiter throws', async () => {
      mockLimit.mockRejectedValue(new Error('Redis Down'));

      const limiter = rateLimit({ max: 2, windowMs: 1000 });
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '1.1.1.1' },
      });

      const result = await limiter(request);
      expect(result.success).toBe(true);
      expect(result.remaining).toBe(1);

      // Verify it used in-memory store
      expect(rateLimitStore.has('1.1.1.1')).toBe(true);
    });

    it('should skip Redis if DISABLE_UPSTASH_DURING_BUILD is set', async () => {
      process.env.DISABLE_UPSTASH_DURING_BUILD = '1';

      const limiter = rateLimit({ max: 5, windowMs: 1000 });
      const request = new Request('http://localhost');

      await limiter(request);

      expect(Redis).not.toHaveBeenCalled();
      expect(rateLimitStore.has('unknown')).toBe(true);
    });

    it('should handle Redis initialization failure', () => {
      Redis.mockImplementationOnce(() => {
        throw new Error('Init Failed');
      });

      const limiter = rateLimit({ max: 5, windowMs: 1000 });
      expect(limiter).toBeDefined();
      // Should not throw, but fallback to in-memory later
    });
  });

  describe('cleanupRateLimitStore', () => {
    it('should remove expired entries', () => {
      const now = Date.now();
      rateLimitStore.set('expired', { count: 1, resetTime: now - 1000 });
      rateLimitStore.set('valid', { count: 1, resetTime: now + 1000 });

      cleanupRateLimitStore();

      expect(rateLimitStore.has('expired')).toBe(false);
      expect(rateLimitStore.has('valid')).toBe(true);
    });
  });

  describe('rateLimiters', () => {
    it('should have predefined limiters', () => {
      expect(rateLimiters.contactForm).toBeDefined();
      expect(rateLimiters.apiGeneral).toBeDefined();
      expect(rateLimiters.search).toBeDefined();
    });

    it('contactForm should limit correctly', async () => {
      const request = new Request('http://localhost', { headers: { 'x-real-ip': 'contact-ip' } });
      for (let i = 0; i < 5; i++) {
        const res = await rateLimiters.contactForm(request);
        expect(res.success).toBe(true);
      }
      const res = await rateLimiters.contactForm(request);
      expect(res.success).toBe(false);
    });

    it('apiGeneral should limit correctly', async () => {
      const request = new Request('http://localhost', { headers: { 'x-real-ip': 'api-ip' } });
      for (let i = 0; i < 100; i++) {
        const res = await rateLimiters.apiGeneral(request);
        expect(res.success).toBe(true);
      }
      const res = await rateLimiters.apiGeneral(request);
      expect(res.success).toBe(false);
    });

    it('search should limit correctly', async () => {
      const request = new Request('http://localhost', { headers: { 'x-real-ip': 'search-ip' } });
      for (let i = 0; i < 50; i++) {
        const res = await rateLimiters.search(request);
        expect(res.success).toBe(true);
      }
      const res = await rateLimiters.search(request);
      expect(res.success).toBe(false);
    });
  });

  describe('Edge cases and regressions', () => {
    it('should handle invalid IP addresses', async () => {
      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': 'invalid-ip' },
      });

      // Should fall back to 'unknown'
      const result = await limiter(request);
      expect(result.success).toBe(true);

      const request2 = new Request('http://localhost');
      const result2 = await limiter(request2);
      expect(result2.success).toBe(false); // same 'unknown' key
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
  });
});
