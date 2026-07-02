/**
 * @jest-environment node
 */

import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

// Mock Upstash
jest.mock('@upstash/redis', () => {
  return {
    Redis: jest.fn().mockImplementation(() => ({
      // Redis mock methods if needed
    })),
  };
});

jest.mock('@upstash/ratelimit', () => {
  const mockLimit = jest.fn();
  return {
    Ratelimit: Object.assign(
      jest.fn().mockImplementation(() => ({
        limit: mockLimit,
      })),
      {
        slidingWindow: jest.fn().mockReturnValue('slidingWindow'),
      }
    ),
  };
});

// Import after mocks
import {
  rateLimit,
  rateLimiters,
  rateLimitStore,
  clearRedisClient,
  cleanupRateLimitStore,
} from '../rate-limit';

const MockRedis = Redis as unknown as jest.Mock;
const MockRatelimit = Ratelimit as unknown as any;
const mockLimit = (new (MockRatelimit as any)() as any).limit;

describe('rate-limit', () => {
  // Store original env vars
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    // Clear the rate limit store before each test
    rateLimitStore.clear();
    // Reset Redis singleton
    clearRedisClient();
    // Reset env
    process.env = { ...originalEnv };
    // Ensure Redis is not initialized by default
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.DISABLE_UPSTASH_DURING_BUILD;

    // Mock console.log/warn to avoid noise
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
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
      const limiter = rateLimit({ max: 2, windowMs: -100 }); // Expired window
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '127.0.0.1' },
      });

      // First request (creates entry)
      await limiter(request);

      // Second request (should reset and be successful because windowMs is negative, making now > resetTime)
      const result = await limiter(request);
      expect(result.success).toBe(true);
      expect(result.remaining).toBe(1);
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

    it('should use Redis-based limiter when credentials are provided', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://mock-redis.upstash.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'mock-token';

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

      expect(MockRedis).toHaveBeenCalled();
      expect(MockRatelimit).toHaveBeenCalled();
      expect(mockLimit).toHaveBeenCalledWith('1.2.3.4');
      expect(result).toEqual({
        success: true,
        limit: 10,
        remaining: 9,
        resetTime: 123456789,
      });
    });

    it('should fallback to in-memory if Redis call fails', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://mock-redis.upstash.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'mock-token';

      mockLimit.mockRejectedValue(new Error('Redis connection failed'));

      const limiter = rateLimit({ max: 5, windowMs: 60000 });
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '5.6.7.8' },
      });

      const result = await limiter(request);

      expect(result.success).toBe(true);
      expect(result.remaining).toBe(4);
      expect(rateLimitStore.has('5.6.7.8')).toBe(true);
    });

    it('should not initialize Redis if DISABLE_UPSTASH_DURING_BUILD is set', () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://mock-redis.upstash.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'mock-token';
      process.env.DISABLE_UPSTASH_DURING_BUILD = '1';

      rateLimit({ max: 10, windowMs: 60000 });

      expect(MockRedis).not.toHaveBeenCalled();
    });

    it('should handle Redis constructor error gracefully', () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://mock-redis.upstash.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'mock-token';

      MockRedis.mockImplementationOnce(() => {
        throw new Error('Config error');
      });

      const limiter = rateLimit({ max: 10, windowMs: 60000 });
      expect(MockRedis).toHaveBeenCalled();

      // Should still return a function (the in-memory one)
      expect(typeof limiter).toBe('function');
    });
  });

  describe('getClientIP', () => {
    it('should use x-forwarded-for header (first IP)', async () => {
      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '192.168.1.1, 10.0.0.1' },
      });
      await limiter(request);
      expect(rateLimitStore.has('192.168.1.1')).toBe(true);
    });

    it('should skip invalid IPs in x-forwarded-for', async () => {
      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': 'invalid-ip, 192.168.1.1' },
      });
      await limiter(request);
      expect(rateLimitStore.has('192.168.1.1')).toBe(true);
      expect(rateLimitStore.has('invalid-ip')).toBe(false);
    });

    it('should prioritize x-forwarded-for over x-real-ip', async () => {
      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      const request = new Request('http://localhost', {
        headers: {
          'x-forwarded-for': '192.168.1.1',
          'x-real-ip': '10.0.0.1',
        },
      });
      await limiter(request);
      expect(rateLimitStore.has('192.168.1.1')).toBe(true);
      expect(rateLimitStore.has('10.0.0.1')).toBe(false);
    });

    it('should prioritize x-real-ip over cf-connecting-ip', async () => {
      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      const request = new Request('http://localhost', {
        headers: {
          'x-real-ip': '192.168.1.2',
          'cf-connecting-ip': '10.0.0.2',
        },
      });
      await limiter(request);
      expect(rateLimitStore.has('192.168.1.2')).toBe(true);
      expect(rateLimitStore.has('10.0.0.2')).toBe(false);
    });

    it('should use cf-connecting-ip header if others are not present', async () => {
      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      const request = new Request('http://localhost', {
        headers: { 'cf-connecting-ip': '192.168.1.3' },
      });
      await limiter(request);
      expect(rateLimitStore.has('192.168.1.3')).toBe(true);
    });

    it('should use "unknown" as fallback if no IP headers present', async () => {
      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      const request = new Request('http://localhost');
      await limiter(request);
      expect(rateLimitStore.has('unknown')).toBe(true);
    });

    it('should fallback to "unknown" if all IP headers are invalid', async () => {
      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      const request = new Request('http://localhost', {
        headers: {
          'x-forwarded-for': 'invalid-1',
          'x-real-ip': 'invalid-2',
          'cf-connecting-ip': 'invalid-3',
        },
      });
      await limiter(request);
      expect(rateLimitStore.has('unknown')).toBe(true);
    });
  });

  describe('rateLimiters', () => {
    it('should have predefined limiters with correct limits (functional check)', async () => {
      // contactForm: 5 requests
      for (let i = 0; i < 5; i++) {
        const res = await rateLimiters.contactForm(
          new Request('http://localhost', { headers: { 'x-forwarded-for': '127.0.0.1' } })
        );
        expect(res.success).toBe(true);
      }
      const cfBlocked = await rateLimiters.contactForm(
        new Request('http://localhost', { headers: { 'x-forwarded-for': '127.0.0.1' } })
      );
      expect(cfBlocked.success).toBe(false);
      expect(cfBlocked.limit).toBe(5);

      // search: 50 requests
      for (let i = 0; i < 50; i++) {
        const res = await rateLimiters.search(
          new Request('http://localhost', { headers: { 'x-forwarded-for': '127.0.0.2' } })
        );
        expect(res.success).toBe(true);
      }
      const sBlocked = await rateLimiters.search(
        new Request('http://localhost', { headers: { 'x-forwarded-for': '127.0.0.2' } })
      );
      expect(sBlocked.success).toBe(false);
      expect(sBlocked.limit).toBe(50);
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
});
