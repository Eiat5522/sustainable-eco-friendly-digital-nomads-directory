/**
 * @jest-environment node
 */

import { afterEach, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';

// Mock Upstash Redis and Ratelimit before importing the module
jest.mock('@upstash/redis', () => {
  return {
    Redis: jest.fn().mockImplementation(() => ({
      // Mock methods if needed
    })),
  };
});

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

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import {
  cleanupRateLimitStore,
  rateLimit,
  rateLimiters,
  rateLimitStore,
  resetRedisClient,
} from '../rate-limit';

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
    // Reset Redis client state and clear the rate limit store before each test
    resetRedisClient();
    rateLimitStore.clear();
    jest.clearAllMocks();
  });

  afterEach(() => {
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

    it('should use Redis when credentials are provided', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://fake-url.upstash.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'fake-token';

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

    it('should fallback to in-memory if Redis limit fails', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://fake-url.upstash.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'fake-token';

      mockLimit.mockRejectedValue(new Error('Redis connection error'));

      const limiter = rateLimit({ max: 2, windowMs: 60000 });
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '5.6.7.8' },
      });

      const result = await limiter(request);

      expect(result.success).toBe(true);
      expect(result.remaining).toBe(1);
      expect(rateLimitStore.has('5.6.7.8')).toBe(true);
    });

    it('should skip Redis if DISABLE_UPSTASH_DURING_BUILD is set', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://fake-url.upstash.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'fake-token';
      process.env.DISABLE_UPSTASH_DURING_BUILD = '1';

      const limiter = rateLimit({ max: 5, windowMs: 1000 });
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '9.9.9.9' },
      });

      await limiter(request);

      expect(Redis).not.toHaveBeenCalled();
      expect(rateLimitStore.has('9.9.9.9')).toBe(true);
    });

    it('should fallback to in-memory if Redis constructor fails', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://fake-url.upstash.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'fake-token';

      (Redis as unknown as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Constructor error');
      });

      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '11.11.11.11' },
      });

      const result = await limiter(request);
      expect(result.success).toBe(true);
      expect(rateLimitStore.has('11.11.11.11')).toBe(true);
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

  describe('getClientIP', () => {
    it('should use x-forwarded-for header for IP', async () => {
      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '192.168.1.1, 10.0.0.1' },
      });

      const result = await limiter(request);
      expect(result.success).toBe(true);

      const result2 = await limiter(request);
      expect(result2.success).toBe(false);
    });

    it('should handle x-forwarded-for with spaces correctly', async () => {
      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '  192.168.1.1  , 10.0.0.1' },
      });

      const result = await limiter(request);
      expect(result.success).toBe(true);

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
    it('should have contactForm limiter configured correctly', async () => {
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

    it('should have apiGeneral limiter configured correctly', async () => {
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

    it('should have search limiter configured correctly', async () => {
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
});
