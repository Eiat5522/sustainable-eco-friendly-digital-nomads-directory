/**
 * @jest-environment node
 */

import { afterEach, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import {
  rateLimit,
  rateLimiters,
  rateLimitStore,
  resetRedisClient,
  cleanupRateLimitStore,
} from '../rate-limit';
import { structuredLogger } from '@/lib/logger';

// Mock structuredLogger
jest.mock('@/lib/logger', () => ({
  structuredLogger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock Upstash Redis and Ratelimit
jest.mock('@upstash/redis', () => {
  return {
    Redis: jest.fn().mockImplementation(() => ({
      // Redis instance mock
    })),
  };
});

jest.mock('@upstash/ratelimit', () => {
  const mockLimit = jest.fn();
  return {
    Ratelimit: jest.fn().mockImplementation(() => ({
      limit: mockLimit,
    })),
    // Static methods
  };
});

// Set up static method mock for Ratelimit
(Ratelimit as any).slidingWindow = jest.fn();

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
    resetRedisClient();
    // Mock console.log to avoid noise in test output
    jest.spyOn(console, 'log').mockImplementation(() => {});
    // Mock console.warn to avoid noise from Redis initialization
    jest.spyOn(console, 'warn').mockImplementation(() => {});

    // Reset mocks
    jest.clearAllMocks();
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

    it('should use Redis when available', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://fake-redis.upstash.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'fake-token';

      const limiter = rateLimit({ max: 5, windowMs: 1000 });
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '1.2.3.4' },
      });

      // Execute once to initialize
      await limiter(request);

      // Mock the limit result
      const mockRatelimitInstance = (Ratelimit as any).mock.results[0].value;
      mockRatelimitInstance.limit.mockResolvedValueOnce({
        success: true,
        limit: 5,
        remaining: 4,
        reset: 123456789,
      });

      const result = await limiter(request);

      expect(Redis).toHaveBeenCalled();
      expect(Ratelimit).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.limit).toBe(5);
      expect(result.remaining).toBe(4);
      expect(result.resetTime).toBe(123456789);
    });

    it('should fallback to in-memory on Redis error', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://fake-redis.upstash.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'fake-token';

      const limiter = rateLimit({ max: 5, windowMs: 1000 });
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '5.6.7.8' },
      });

      // Execute once to initialize
      await limiter(request);

      // Mock Redis failure
      const mockRatelimitInstance = (Ratelimit as any).mock.results[0].value;
      mockRatelimitInstance.limit.mockRejectedValueOnce(new Error('Redis is down'));

      // The previous call incremented in-memory to 1.
      // This call will fail Redis and increment in-memory to 2.
      // So remaining will be 5 - 2 = 3.
      const result = await limiter(request);

      // Should still succeed using in-memory fallback
      expect(result.success).toBe(true);
      expect(result.limit).toBe(5);
      expect(result.remaining).toBe(3);
    });

    it('should skip Redis if DISABLE_UPSTASH_DURING_BUILD is set', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://fake-redis.upstash.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'fake-token';
      process.env.DISABLE_UPSTASH_DURING_BUILD = '1';

      const limiter = rateLimit({ max: 5, windowMs: 1000 });
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '9.10.11.12' },
      });

      await limiter(request);

      expect(Redis).not.toHaveBeenCalled();
    });

    it('should reset count after window expires (in-memory)', async () => {
      const limiter = rateLimit({ max: 2, windowMs: 100 });
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '127.0.0.1' },
      });

      await limiter(request);
      await limiter(request);
      expect((await limiter(request)).success).toBe(false);

      // Simulate expiration
      const entry = rateLimitStore.get('127.0.0.1');
      if (entry) {
        entry.resetTime = Date.now() - 1000;
      }

      // Should allow requests again
      const result = await limiter(request);
      expect(result.success).toBe(true);
      expect(result.remaining).toBe(1);
    });

    it('should track different IPs separately (in-memory)', async () => {
      const limiter = rateLimit({ max: 2, windowMs: 1000 });

      const request1 = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '127.0.0.1' },
      });
      const request2 = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '127.0.0.2' },
      });

      await limiter(request1);
      await limiter(request1);

      const result2 = await limiter(request2);
      expect(result2.success).toBe(true);
      expect(result2.remaining).toBe(1);
    });

    it('should use various IP headers (in-memory)', async () => {
      const limiter = rateLimit({ max: 1, windowMs: 1000 });

      // x-forwarded-for
      const req1 = new Request('http://localhost', { headers: { 'x-forwarded-for': '1.1.1.1, 2.2.2.2' } });
      await limiter(req1);
      expect(rateLimitStore.has('1.1.1.1')).toBe(true);
      rateLimitStore.clear();

      // x-real-ip
      const req2 = new Request('http://localhost', { headers: { 'x-real-ip': '3.3.3.3' } });
      await limiter(req2);
      expect(rateLimitStore.has('3.3.3.3')).toBe(true);
      rateLimitStore.clear();

      // cf-connecting-ip
      const req3 = new Request('http://localhost', { headers: { 'cf-connecting-ip': '4.4.4.4' } });
      await limiter(req3);
      expect(rateLimitStore.has('4.4.4.4')).toBe(true);
      rateLimitStore.clear();

      // unknown
      const req4 = new Request('http://localhost');
      await limiter(req4);
      expect(rateLimitStore.has('unknown')).toBe(true);
    });

    it('should use custom key generator (in-memory)', async () => {
      const limiter = rateLimit({
        max: 1,
        windowMs: 1000,
        keyGenerator: req => new URL(req.url).searchParams.get('key') || 'none',
      });

      await limiter(new Request('http://localhost?key=abc'));
      expect(rateLimitStore.has('abc')).toBe(true);
    });

    it('should handle Redis constructor error', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://fake-redis.upstash.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'fake-token';

      (Redis as unknown as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Constructor failed');
      });

      const limiter = rateLimit({ max: 5, windowMs: 1000 });
      const request = new Request('http://localhost');

      await limiter(request);

      expect(structuredLogger.error).toHaveBeenCalledWith(
        '[rate-limit] Failed to create Redis client',
        expect.any(Error),
        { component: 'rate-limit' }
      );
    });
  });

  describe('rateLimiters', () => {
    it('should have configured limiters', () => {
      expect(rateLimiters.contactForm).toBeDefined();
      expect(rateLimiters.apiGeneral).toBeDefined();
      expect(rateLimiters.search).toBeDefined();
    });
  });

  describe('Utility functions', () => {
    it('cleanupRateLimitStore should remove expired entries', () => {
      rateLimitStore.set('expired', { count: 1, resetTime: Date.now() - 1000 });
      rateLimitStore.set('valid', { count: 1, resetTime: Date.now() + 1000 });

      cleanupRateLimitStore();

      expect(rateLimitStore.has('expired')).toBe(false);
      expect(rateLimitStore.has('valid')).toBe(true);
    });

    it('resetRedisClient should clear the singleton', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://fake-redis.upstash.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'fake-token';

      const limiter = rateLimit({ max: 5, windowMs: 1000 });
      await limiter(new Request('http://localhost'));

      expect(Redis).toHaveBeenCalledTimes(1);

      resetRedisClient();
      await limiter(new Request('http://localhost'));

      expect(Redis).toHaveBeenCalledTimes(2);
    });
  });
});
