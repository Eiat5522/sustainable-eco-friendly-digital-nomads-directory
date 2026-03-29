/**
 * @jest-environment node
 */

import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import {
  cleanupRateLimitStore,
  clearRedisClient,
  rateLimit,
  rateLimiters,
  rateLimitStore,
} from '../rate-limit';

// Mock Upstash Redis and Ratelimit
jest.mock('@upstash/redis');
jest.mock('@upstash/ratelimit');

describe('rate-limit', () => {
  // Store original env vars
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Clear the rate limit store before each test
    rateLimitStore.clear();
    // Reset Redis client singleton
    clearRedisClient();

    // Ensure Redis is not initialized during tests by default
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.DISABLE_UPSTASH_DURING_BUILD;

    // Mock console.log to avoid noise in test output
    jest.spyOn(console, 'log').mockImplementation(() => {});
    // Mock console.warn to avoid noise from Redis initialization
    jest.spyOn(console, 'warn').mockImplementation(() => {});

    // Default mock implementation for Ratelimit
    (Ratelimit as any).slidingWindow = jest.fn();
    (Ratelimit as unknown as jest.Mock).mockImplementation(() => ({
      limit: jest.fn().mockResolvedValue({
        success: true,
        limit: 10,
        remaining: 9,
        reset: Date.now() + 1000,
      }),
    }));
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
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

    it('should use Redis when credentials are provided', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://fake-redis.upstash.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'fake-token';

      const limiter = rateLimit({ max: 5, windowMs: 1000 });
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '1.1.1.1' },
      });

      const result = await limiter(request);

      expect(Redis).toHaveBeenCalled();
      expect(Ratelimit).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it('should use cached Redis client on subsequent calls', () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://fake-redis.upstash.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'fake-token';

      rateLimit({ max: 1, windowMs: 1000 }); // first call initializes
      expect(Redis).toHaveBeenCalledTimes(1);

      rateLimit({ max: 1, windowMs: 1000 }); // second call should use cache
      expect(Redis).toHaveBeenCalledTimes(1);
    });

    it('should fallback to in-memory when Redis initialization fails', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://fake-redis.upstash.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'fake-token';

      (Redis as unknown as jest.Mock).mockImplementation(() => {
        throw new Error('Redis connection failed');
      });

      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '2.2.2.2' },
      });

      const result1 = await limiter(request);
      expect(result1.success).toBe(true);

      const result2 = await limiter(request);
      expect(result2.success).toBe(false); // In-memory fallback working
    });

    it('should fallback to in-memory when Redis limit call throws', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://fake-redis.upstash.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'fake-token';

      (Ratelimit as unknown as jest.Mock).mockImplementation(() => ({
        limit: jest.fn().mockRejectedValue(new Error('Redis call failed')),
      }));

      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '3.3.3.3' },
      });

      const result1 = await limiter(request);
      expect(result1.success).toBe(true);

      const result2 = await limiter(request);
      expect(result2.success).toBe(false); // In-memory fallback working
    });

    it('should skip Redis when DISABLE_UPSTASH_DURING_BUILD is set', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://fake-redis.upstash.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'fake-token';
      process.env.DISABLE_UPSTASH_DURING_BUILD = '1';

      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '4.4.4.4' },
      });

      await limiter(request);

      expect(Redis).not.toHaveBeenCalled();
    });

    test.each([
      ['URL only', { UPSTASH_REDIS_REST_URL: 'https://fake' }],
      ['TOKEN only', { UPSTASH_REDIS_REST_TOKEN: 'fake' }],
    ])('should fallback when %s is provided', (_msg, env) => {
      Object.assign(process.env, env);
      rateLimit({ max: 1, windowMs: 1000 });
      expect(Redis).not.toHaveBeenCalled();
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

      const result1a = await limiter(request1);
      expect(result1a.success).toBe(true);

      const result2a = await limiter(request2);
      expect(result2a.success).toBe(true);

      const result1b = await limiter(request1);
      expect(result1b.success).toBe(false);
    });
  });

  describe('cleanupRateLimitStore', () => {
    test.each([
      ['cleanup expired', -1000, 0],
      ['not cleanup non-expired', 10000, 1]
    ])('should %s entries', async (_msg, windowMs, expectedSize) => {
      const limiter = rateLimit({ max: 1, windowMs });
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '127.0.0.1' },
      });

      await limiter(request);
      expect(rateLimitStore.size).toBe(1);

      cleanupRateLimitStore();
      expect(rateLimitStore.size).toBe(expectedSize);
    });
  });

  describe('getClientIP', () => {
    test.each([
      ['x-forwarded-for', { 'x-forwarded-for': '192.168.1.1, 10.0.0.1' }, '192.168.1.1'],
      ['x-forwarded-for trimmed', { 'x-forwarded-for': '  192.168.1.1  , 10.0.0.1' }, '192.168.1.1'],
      ['x-real-ip', { 'x-real-ip': '1.2.3.4' }, '1.2.3.4'],
      ['cf-connecting-ip', { 'cf-connecting-ip': '172.16.0.1' }, '172.16.0.1'],
      ['invalid x-forwarded-for', { 'x-forwarded-for': 'invalid, 10.0.0.1' }, 'unknown'],
      ['empty x-forwarded-for', { 'x-forwarded-for': '', 'x-real-ip': '1.2.3.4' }, '1.2.3.4'],
    ])('should handle %s correctly', async (_name, headers, expected) => {
      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      const request = new Request('http://localhost', { headers });
      await limiter(request);
      if (expected !== 'unknown') {
        expect(rateLimitStore.has(expected)).toBe(true);
      } else {
        expect(rateLimitStore.has('unknown')).toBe(true);
      }
    });
  });

  describe('rateLimiters', () => {
    it('contactForm limiter should enforce 5 requests limit', async () => {
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

    it('should have all predefined limiters working', async () => {
      const req = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '127.0.0.1' },
      });
      const results = await Promise.all([
        rateLimiters.contactForm(req),
        rateLimiters.apiGeneral(req),
        rateLimiters.search(req)
      ]);
      results.forEach(res => expect(res).toBeDefined());
    });
  });
});
