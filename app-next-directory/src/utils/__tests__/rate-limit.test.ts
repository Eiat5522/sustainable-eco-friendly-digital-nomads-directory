/**
 * @jest-environment node
 */

import { afterEach, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { cleanupRateLimitStore, clearRedisClient, rateLimit, rateLimiters, rateLimitStore } from '../rate-limit';

// Mock Upstash Redis
jest.mock('@upstash/redis', () => {
  return {
    Redis: jest.fn().mockImplementation(() => ({
      // Mock methods as needed
    })),
  };
});

// Mock Upstash Ratelimit
jest.mock('@upstash/ratelimit', () => {
  const slidingWindow = jest.fn().mockReturnValue('sliding-window');
  const RatelimitMock = jest.fn().mockImplementation(() => ({
    limit: jest.fn(),
  }));

  // Attach slidingWindow to the constructor mock
  (RatelimitMock as any).slidingWindow = slidingWindow;

  return {
    Ratelimit: RatelimitMock,
    slidingWindow,
  };
});

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
      const result1 = await limiter(request);
      expect(result1.success).toBe(true);
      const result2 = await limiter(request);
      expect(result2.success).toBe(true);

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

    it('should use Redis when credentials are provided', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://fake-url.com';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'fake-token';

      const mockLimitResult = {
        success: true,
        limit: 5,
        remaining: 4,
        reset: 123456789,
      };

      const mockLimit = jest.fn().mockResolvedValue(mockLimitResult as any);
      (Ratelimit as unknown as jest.Mock).mockImplementation(() => ({
        limit: mockLimit,
      }));

      const limiter = rateLimit({ max: 5, windowMs: 1000 });
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '1.2.3.4' },
      });

      const result = await limiter(request);

      expect(Redis).toHaveBeenCalledWith({
        url: 'https://fake-url.com',
        token: 'fake-token',
      });
      expect(Ratelimit).toHaveBeenCalled();
      expect(mockLimit).toHaveBeenCalledWith('1.2.3.4');
      expect(result).toEqual({
        success: true,
        limit: 5,
        remaining: 4,
        resetTime: 123456789,
      });
    });

    it('should fallback to in-memory if Redis throws an error', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://fake-url.com';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'fake-token';

      const mockLimit = jest.fn().mockRejectedValue(new Error('Redis is down'));
      (Ratelimit as unknown as jest.Mock).mockImplementation(() => ({
        limit: mockLimit,
      }));

      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '5.6.7.8' },
      });

      // First call (successful in-memory because it's first)
      const result = await limiter(request);
      expect(result.success).toBe(true);

      // Second call (blocked in-memory)
      const result2 = await limiter(request);
      expect(result2.success).toBe(false);
    });

    it('should skip Redis if DISABLE_UPSTASH_DURING_BUILD is set to "1"', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://fake-url.com';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'fake-token';
      process.env.DISABLE_UPSTASH_DURING_BUILD = '1';

      const limiter = rateLimit({ max: 5, windowMs: 1000 });
      const request = new Request('http://localhost');

      await limiter(request);

      expect(Redis).not.toHaveBeenCalled();
    });

    it('should skip Redis if credentials are missing', async () => {
      delete process.env.UPSTASH_REDIS_REST_URL;
      delete process.env.UPSTASH_REDIS_REST_TOKEN;

      const limiter = rateLimit({ max: 5, windowMs: 1000 });
      const request = new Request('http://localhost');

      await limiter(request);

      expect(Redis).not.toHaveBeenCalled();
    });

    it('should handle Redis constructor throwing error', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://fake-url.com';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'fake-token';

      (Redis as unknown as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Bad Redis config');
      });

      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '9.9.9.9' },
      });

      const result = await limiter(request);
      expect(result.success).toBe(true); // Should fallback to in-memory

      const result2 = await limiter(request);
      expect(result2.success).toBe(false); // Second request blocked in-memory
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

  describe('cleanupRateLimitStore', () => {
    it('should cleanup expired entries', async () => {
      const key = 'expired-key';
      rateLimitStore.set(key, { count: 5, resetTime: Date.now() - 1000 });
      rateLimitStore.set('active-key', { count: 1, resetTime: Date.now() + 10000 });

      cleanupRateLimitStore();

      expect(rateLimitStore.has(key)).toBe(false);
      expect(rateLimitStore.has('active-key')).toBe(true);
    });
  });

  describe('getClientIP edge cases', () => {
    it('should handle x-forwarded-for with spaces and multiple IPs', async () => {
       const limiter = rateLimit({ max: 1, windowMs: 1000 });
       const request = new Request('http://localhost', {
         headers: { 'x-forwarded-for': '  1.2.3.4  , 5.6.7.8' },
       });

       await limiter(request);
       expect(rateLimitStore.has('1.2.3.4')).toBe(true);
    });

    it('should handle x-forwarded-for with empty first entry', async () => {
       const limiter = rateLimit({ max: 1, windowMs: 1000 });
       const request = new Request('http://localhost', {
         headers: { 'x-forwarded-for': ', 5.6.7.8' },
       });

       await limiter(request);
       // Split of ', 5.6.7.8' gives ['', ' 5.6.7.8']. first is '', which is falsy.
       // Falls back to other headers or unknown.
       expect(rateLimitStore.has('unknown')).toBe(true);
    });
  });
});
