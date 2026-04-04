/**
 * @jest-environment node
 */

import { afterEach, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';

// Mock Upstash Redis and Ratelimit
const mockLimit = jest.fn();
const mockSlidingWindow = jest.fn();

// We need a way to track calls to the Ratelimit constructor
const mockRatelimitConstructor = jest.fn();

class MockRatelimit {
  static slidingWindow = mockSlidingWindow;
  limit = mockLimit;
  constructor(...args: any[]) {
    mockRatelimitConstructor(...args);
  }
}

jest.mock('@upstash/redis', () => {
  return {
    Redis: jest.fn().mockImplementation(() => ({
      // Mock methods if needed
    })),
  };
});

jest.mock('@upstash/ratelimit', () => {
  return {
    Ratelimit: MockRatelimit,
  };
});

// Important: Import after mocking
import {
  rateLimit,
  rateLimiters,
  rateLimitStore,
  cleanupRateLimitStore,
  resetRedisClient
} from '../rate-limit';
import { Redis } from '@upstash/redis';

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
    // Reset Redis client to uninitialized state
    resetRedisClient();
    // Clear all mocks
    jest.clearAllMocks();
    mockRatelimitConstructor.mockClear();

    // Mock console.log/warn to avoid noise
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});

    // Setup default mock return values
    mockSlidingWindow.mockReturnValue({});
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

  describe('rateLimiters', () => {
    it('should have predefined limiters configured', () => {
      expect(rateLimiters.contactForm).toBeDefined();
      expect(rateLimiters.apiGeneral).toBeDefined();
      expect(rateLimiters.search).toBeDefined();
    });

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

  describe('cleanupRateLimitStore', () => {
    it('should cleanup expired entries', async () => {
      const limiter = rateLimit({ max: 1, windowMs: -1000 }); // Negative windowMs means already expired
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '192.168.1.100' },
      });

      await limiter(request);
      expect(rateLimitStore.size).toBeGreaterThan(0);

      cleanupRateLimitStore();
      expect(rateLimitStore.size).toBe(0);
    });

    it('should not cleanup non-expired entries', async () => {
      const limiter = rateLimit({ max: 1, windowMs: 10000 });
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '192.168.1.101' },
      });

      await limiter(request);
      expect(rateLimitStore.size).toBe(1);

      cleanupRateLimitStore();
      expect(rateLimitStore.size).toBe(1);
    });
  });

  describe('Redis initialization and usage', () => {
    it('should initialize Redis when credentials are provided', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://mock-redis.upstash.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'mock-token';

      const limiter = rateLimit({ max: 5, windowMs: 60000 });
      expect(Redis).toHaveBeenCalled();
      expect(mockRatelimitConstructor).toHaveBeenCalled();

      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '1.2.3.4' },
      });

      mockLimit.mockResolvedValue({
        success: true,
        limit: 5,
        remaining: 4,
        reset: 123456789,
      });

      const result = await limiter(request);
      expect(result.success).toBe(true);
      expect(result.remaining).toBe(4);
      expect(result.resetTime).toBe(123456789);
      expect(mockLimit).toHaveBeenCalledWith('1.2.3.4');
    });

    it('should skip Redis when DISABLE_UPSTASH_DURING_BUILD is set', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://mock-redis.upstash.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'mock-token';
      process.env.DISABLE_UPSTASH_DURING_BUILD = '1';

      const limiter = rateLimit({ max: 5, windowMs: 60000 });
      expect(Redis).not.toHaveBeenCalled();

      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '1.2.3.4' },
      });
      const result = await limiter(request);
      expect(result.success).toBe(true);
    });

    it('should fallback to in-memory when Redis limit call fails', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://mock-redis.upstash.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'mock-token';

      const limiter = rateLimit({ max: 1, windowMs: 60000 });
      mockLimit.mockRejectedValue(new Error('Redis connection failed'));

      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '5.6.7.8' },
      });

      // Should fall back to in-memory and succeed
      const result = await limiter(request);
      expect(result.success).toBe(true);
      expect(rateLimitStore.has('5.6.7.8')).toBe(true);
    });

    it('should handle Redis constructor error gracefully', () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://mock-redis.upstash.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'mock-token';

      (Redis as jest.MockedClass<typeof Redis>).mockImplementationOnce(() => {
        throw new Error('Constructor failed');
      });

      const limiter = rateLimit({ max: 5, windowMs: 60000 });
      expect(limiter).toBeDefined();

      // Should not throw and return a function (the in-memory fallback)
      expect(typeof limiter).toBe('function');
    });
  });

  describe('Edge cases and IP extraction', () => {
    it('should handle x-forwarded-for with spaces and multiple IPs', async () => {
      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '  192.168.1.1  , 10.0.0.1 ' },
      });

      await limiter(request);
      expect(rateLimitStore.has('192.168.1.1')).toBe(true);
    });

    it('should return unknown when no IP headers and no custom generator', async () => {
      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      const request = new Request('http://localhost');

      await limiter(request);
      expect(rateLimitStore.has('unknown')).toBe(true);
    });

    it('should use custom key generator correctly', async () => {
      const limiter = rateLimit({
        max: 1,
        windowMs: 1000,
        keyGenerator: () => 'fixed-key'
      });
      const request = new Request('http://localhost');
      await limiter(request);
      expect(rateLimitStore.has('fixed-key')).toBe(true);
    });

    it('should handle invalid IPs by falling back to unknown', async () => {
      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': 'not-an-ip' },
      });

      await limiter(request);
      expect(rateLimitStore.has('unknown')).toBe(true);
    });
  });
});
