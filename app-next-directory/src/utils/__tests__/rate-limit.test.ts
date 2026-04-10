/**
 * @jest-environment node
 */

import { afterEach, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';

// Mock Upstash
const mockLimit = jest.fn();
const mockRatelimitInstance = {
  limit: mockLimit,
};

jest.mock('@upstash/ratelimit', () => {
  return {
    Ratelimit: jest.fn().mockImplementation(() => mockRatelimitInstance),
  };
});

(require('@upstash/ratelimit').Ratelimit as any).slidingWindow = jest.fn();

jest.mock('@upstash/redis', () => {
  return {
    Redis: jest.fn().mockImplementation(() => ({})),
  };
});

// Import after mocking
import {
  rateLimit,
  rateLimiters,
  rateLimitStore,
  cleanupRateLimitStore,
  resetRedisClient,
  clearRateLimiters,
} from '../rate-limit';

describe('rate-limit', () => {
  // Store original env vars
  const originalEnv = { ...process.env };

  beforeAll(() => {
    // Ensure Redis is not initialized during tests by default
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  beforeEach(() => {
    // Clear the rate limit store before each test
    clearRateLimiters();
    resetRedisClient();
    mockLimit.mockReset();
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
      clearRateLimiters();

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
  });

  describe('Redis initialization', () => {
    it('should not initialize Redis and use in-memory fallback when credentials are missing', async () => {
      resetRedisClient();
      delete process.env.UPSTASH_REDIS_REST_URL;
      delete process.env.UPSTASH_REDIS_REST_TOKEN;

      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      expect(limiter).toBeDefined();

      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '9.9.9.9' },
      });

      const result = await limiter(request);
      expect(result.success).toBe(true);
      expect(rateLimitStore.has('9.9.9.9')).toBe(true);

      const { Redis } = require('@upstash/redis');
      expect(Redis).not.toHaveBeenCalled();
    });

    it('should skip Redis initialization if DISABLE_UPSTASH_DURING_BUILD is set', () => {
      resetRedisClient();
      process.env.UPSTASH_REDIS_REST_URL = 'https://fake.redis.com';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'fake-token';
      process.env.DISABLE_UPSTASH_DURING_BUILD = '1';

      rateLimit({ max: 1, windowMs: 1000 });

      const { Redis } = require('@upstash/redis');
      expect(Redis).not.toHaveBeenCalled();
    });

    it('should initialize Redis when credentials are provided', async () => {
      resetRedisClient();
      process.env.UPSTASH_REDIS_REST_URL = 'https://fake.redis.com';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'fake-token';

      mockLimit.mockResolvedValue({
        success: true,
        limit: 10,
        remaining: 9,
        reset: Date.now() + 1000,
      });

      const limiter = rateLimit({ max: 10, windowMs: 1000 });
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '1.2.3.4' },
      });

      const result = await limiter(request);

      const { Redis } = require('@upstash/redis');
      const { Ratelimit } = require('@upstash/ratelimit');

      expect(Redis).toHaveBeenCalled();
      expect(Ratelimit).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(mockLimit).toHaveBeenCalledWith('1.2.3.4');
    });

    it('should fallback to in-memory if Redis call fails', async () => {
      resetRedisClient();
      process.env.UPSTASH_REDIS_REST_URL = 'https://fake.redis.com';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'fake-token';

      mockLimit.mockRejectedValue(new Error('Redis connection failed'));

      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '1.2.3.4' },
      });

      // First call fails Redis, uses in-memory (success)
      const result1 = await limiter(request);
      expect(result1.success).toBe(true);

      // Second call fails Redis, uses in-memory (fails due to max: 1)
      const result2 = await limiter(request);
      expect(result2.success).toBe(false);
      expect(mockLimit).toHaveBeenCalledTimes(2);
    });

    it('should handle Redis initialization error', () => {
      resetRedisClient();
      process.env.UPSTASH_REDIS_REST_URL = 'https://fake.redis.com';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'fake-token';

      const { Redis } = require('@upstash/redis');
      Redis.mockImplementationOnce(() => {
        throw new Error('Initialization error');
      });

      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      expect(limiter).toBeDefined();
    });
  });

  describe('cleanupRateLimitStore', () => {
    it('should remove expired entries', async () => {
      const limiter = rateLimit({ max: 1, windowMs: -1000 }); // Expired immediately
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '1.2.3.4' },
      });

      await limiter(request);
      expect(rateLimitStore.has('1.2.3.4')).toBe(true);

      cleanupRateLimitStore();
      expect(rateLimitStore.has('1.2.3.4')).toBe(false);
    });

    it('should keep non-expired entries', async () => {
      const limiter = rateLimit({ max: 1, windowMs: 10000 });
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '5.6.7.8' },
      });

      await limiter(request);
      expect(rateLimitStore.has('5.6.7.8')).toBe(true);

      cleanupRateLimitStore();
      expect(rateLimitStore.has('5.6.7.8')).toBe(true);
    });
  });

  describe('rateLimiters', () => {
    it('should have contactForm limiter configured', () => {
      expect(rateLimiters.contactForm).toBeDefined();
    });

    it('should have apiGeneral limiter configured', () => {
      expect(rateLimiters.apiGeneral).toBeDefined();
    });

    it('should have search limiter configured', () => {
      expect(rateLimiters.search).toBeDefined();
    });
  });
});
