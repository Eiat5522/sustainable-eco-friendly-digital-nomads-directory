/**
 * @jest-environment node
 */

import { afterEach, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';

// Mock @upstash/redis
jest.mock('@upstash/redis', () => {
  return {
    Redis: jest.fn().mockImplementation(() => ({
      // Mock methods if needed
    })),
  };
});

// Mock @upstash/ratelimit
const mockLimit = jest.fn();
jest.mock('@upstash/ratelimit', () => {
  return {
    Ratelimit: Object.assign(
      jest.fn().mockImplementation(() => ({
        limit: mockLimit,
      })),
      {
        slidingWindow: jest.fn().mockReturnValue({}),
      }
    ),
  };
});

import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';
import {
  rateLimit,
  rateLimiters,
  rateLimitStore,
  clearRedisClient,
  cleanupRateLimitStore
} from '../rate-limit';

const MockRedis = Redis as jest.MockedClass<typeof Redis>;
const MockRatelimit = Ratelimit as unknown as jest.MockedClass<typeof Ratelimit> & {
  slidingWindow: jest.Mock;
};

describe('rate-limit', () => {
  // Store original env vars
  const originalEnv = { ...process.env };

  beforeAll(() => {
    // Ensure Redis is not initialized during tests by default
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

    it('should track different IPs separately', async () => {
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

  describe('Redis initialization', () => {
    it('should initialize Redis when credentials are provided', () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://mock-redis.upstash.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'mock-token';

      rateLimit({ max: 10, windowMs: 1000 });

      expect(MockRedis).toHaveBeenCalledWith({
        url: 'https://mock-redis.upstash.io',
        token: 'mock-token',
      });
      expect(MockRatelimit).toHaveBeenCalled();
    });

    it('should NOT initialize Redis when DISABLE_UPSTASH_DURING_BUILD is set', () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://mock-redis.upstash.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'mock-token';
      process.env.DISABLE_UPSTASH_DURING_BUILD = '1';

      rateLimit({ max: 10, windowMs: 1000 });

      expect(MockRedis).not.toHaveBeenCalled();
    });

    it('should NOT initialize Redis when credentials are missing', () => {
      delete process.env.UPSTASH_REDIS_REST_URL;
      delete process.env.UPSTASH_REDIS_REST_TOKEN;

      rateLimit({ max: 10, windowMs: 1000 });

      expect(MockRedis).not.toHaveBeenCalled();
    });

    it('should handle Redis constructor errors', () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://mock-redis.upstash.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'mock-token';

      MockRedis.mockImplementationOnce(() => {
        throw new Error('Redis connection error');
      });

      const limiter = rateLimit({ max: 10, windowMs: 1000 });
      expect(limiter).toBeDefined();
      // Should fall back to in-memory
      expect(MockRatelimit).not.toHaveBeenCalled();
    });
  });

  describe('Redis-based rate limiting', () => {
    beforeEach(() => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://mock-redis.upstash.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'mock-token';

      mockLimit.mockReset();
      (MockRatelimit as any).mockImplementation(() => ({
        limit: mockLimit,
      }));
    });

    it('should use Redis limiter when available', async () => {
      mockLimit.mockResolvedValue({
        success: true,
        limit: 10,
        remaining: 9,
        reset: 123456789,
      });

      const limiter = rateLimit({ max: 10, windowMs: 1000 });
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '1.2.3.4' },
      });

      const result = await limiter(request);

      expect(result.success).toBe(true);
      expect(result.remaining).toBe(9);
      expect(result.resetTime).toBe(123456789);
      expect(mockLimit).toHaveBeenCalledWith('1.2.3.4');
    });

    it('should fall back to in-memory if Redis limiter throws', async () => {
      mockLimit.mockRejectedValue(new Error('Redis error'));

      const limiter = rateLimit({ max: 2, windowMs: 1000 });
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '5.6.7.8' },
      });

      // First call fails in Redis, falls back to memory (count 1)
      const result1 = await limiter(request);
      expect(result1.success).toBe(true);
      expect(result1.remaining).toBe(1);

      // Second call fails in Redis, falls back to memory (count 2)
      const result2 = await limiter(request);
      expect(result2.success).toBe(true);
      expect(result2.remaining).toBe(0);

      // Third call fails in Redis, falls back to memory (blocked)
      const result3 = await limiter(request);
      expect(result3.success).toBe(false);
    });
  });

  describe('rateLimiters', () => {
    it('should have contactForm limiter configured', () => {
      expect(rateLimiters.contactForm).toBeDefined();
    });

    it('contactForm limiter should enforce 5 requests limit (in-memory)', async () => {
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '127.0.0.1' },
      });

      for (let i = 0; i < 5; i++) {
        const result = await rateLimiters.contactForm(request);
        expect(result.success).toBe(true);
      }

      const result = await rateLimiters.contactForm(request);
      expect(result.success).toBe(false);
      expect(result.limit).toBe(5);
    });

    it('apiGeneral limiter should enforce 100 requests limit', async () => {
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '127.0.0.2' },
      });

      for (let i = 0; i < 100; i++) {
        const result = await rateLimiters.apiGeneral(request);
        expect(result.success).toBe(true);
      }

      const result = await rateLimiters.apiGeneral(request);
      expect(result.success).toBe(false);
      expect(result.limit).toBe(100);
    });

    it('search limiter should enforce 50 requests limit', async () => {
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '127.0.0.3' },
      });

      for (let i = 0; i < 50; i++) {
        const result = await rateLimiters.search(request);
        expect(result.success).toBe(true);
      }

      const result = await rateLimiters.search(request);
      expect(result.success).toBe(false);
      expect(result.limit).toBe(50);
    });
  });

  describe('Edge cases', () => {
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
  });

  describe('cleanupRateLimitStore', () => {
    it('should remove expired entries', async () => {
      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': 'expired-ip' },
      });

      await limiter(request);
      expect(rateLimitStore.has('expired-ip')).toBe(true);

      // Manually expire the entry
      const entry = rateLimitStore.get('expired-ip')!;
      entry.resetTime = Date.now() - 1000;

      cleanupRateLimitStore();

      expect(rateLimitStore.has('expired-ip')).toBe(false);
    });

    it('should NOT remove non-expired entries', async () => {
      const limiter = rateLimit({ max: 1, windowMs: 10000 });
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': 'active-ip' },
      });

      await limiter(request);
      expect(rateLimitStore.has('active-ip')).toBe(true);

      cleanupRateLimitStore();

      expect(rateLimitStore.has('active-ip')).toBe(true);
    });
  });
});
