/**
 * @jest-environment node
 */

import { afterEach, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';

// Mock Upstash Redis and Ratelimit before importing the module under test
jest.mock('@upstash/redis', () => {
  return {
    Redis: jest.fn().mockImplementation(() => ({
      // Mock methods if needed
    })),
  };
});

jest.mock('@upstash/ratelimit', () => {
  const mockRatelimit = jest.fn().mockImplementation(() => ({
    limit: jest.fn().mockResolvedValue({
      success: true,
      limit: 10,
      remaining: 9,
      reset: Date.now() + 1000,
    }),
  }));

  // Add static methods to the mock
  (mockRatelimit as any).slidingWindow = jest.fn().mockReturnValue('sliding-window-limiter');

  return {
    Ratelimit: mockRatelimit,
  };
});

import {
  rateLimit,
  rateLimiters,
  rateLimitStore,
  resetRedisClient,
  cleanupRateLimitStore,
  clearRateLimiters
} from '../rate-limit';

// Access the mocked classes
const { Redis } = require('@upstash/redis');
const { Ratelimit } = require('@upstash/ratelimit');

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
    // Reset Redis client state
    resetRedisClient();
    // Re-initialize predefined limiters to use current (cleared) state
    clearRateLimiters();
    // Clear mocks
    jest.clearAllMocks();

    // Restore default env for each test
    process.env = { ...originalEnv };
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.DISABLE_UPSTASH_DURING_BUILD;
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
  });

  describe('Redis initialization', () => {
    it('should initialize Redis when credentials are provided', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://fake-url.com';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'fake-token';

      // We need to call the returned function to trigger initializeRedis
      const limiter = rateLimit({ max: 10, windowMs: 1000 });
      await limiter(new Request('http://localhost'));

      expect(Redis).toHaveBeenCalledWith({
        url: 'https://fake-url.com',
        token: 'fake-token',
      });
    });

    it('should NOT initialize Redis when DISABLE_UPSTASH_DURING_BUILD is set', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://fake-url.com';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'fake-token';
      process.env.DISABLE_UPSTASH_DURING_BUILD = '1';

      const limiter = rateLimit({ max: 10, windowMs: 1000 });
      await limiter(new Request('http://localhost'));

      expect(Redis).not.toHaveBeenCalled();
    });

    it('should handle Redis initialization error gracefully', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://fake-url.com';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'fake-token';

      (Redis as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Redis init failed');
      });

      const limiter = rateLimit({ max: 10, windowMs: 1000 });
      const request = new Request('http://localhost');

      // Should fall back to in-memory
      const result = await limiter(request);
      expect(result.success).toBe(true);
      expect(Redis).toHaveBeenCalled();
    });

    it('should handle missing URL or Token', async () => {
       process.env.UPSTASH_REDIS_REST_URL = 'https://fake-url.com';
       // Token missing
       const limiter = rateLimit({ max: 10, windowMs: 1000 });
       await limiter(new Request('http://localhost'));
       expect(Redis).not.toHaveBeenCalled();
    });
  });

  describe('Redis-based rate limiting', () => {
    beforeEach(() => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://fake-url.com';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'fake-token';
    });

    it('should use Redis-based limiter when available', async () => {
      const limiter = rateLimit({ max: 10, windowMs: 1000 });
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '1.2.3.4' },
      });

      const result = await limiter(request);

      expect(Ratelimit).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.remaining).toBe(9);
    });

    it('should fall back to in-memory if Redis limiter throws', async () => {
      // Setup limiter to throw once
      const mockLimit = jest.fn()
        .mockRejectedValueOnce(new Error('Redis limit failed'))
        .mockResolvedValue({
          success: true,
          limit: 10,
          remaining: 9,
          reset: Date.now() + 1000,
        });

      (Ratelimit as jest.Mock).mockImplementation(() => ({
        limit: mockLimit,
      }));

      const limiter = rateLimit({ max: 5, windowMs: 1000 });
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '5.6.7.8' },
      });

      // This call should fail on Redis and fall back to in-memory
      const result = await limiter(request);

      expect(mockLimit).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.limit).toBe(5); // In-memory limit
      expect(result.remaining).toBe(4); // In-memory remaining
    });
  });

  describe('getClientIP', () => {
    it('should use x-forwarded-for header', async () => {
      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '192.168.1.1, 10.0.0.1' },
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
    });

    it('should use cf-connecting-ip header if others are not present', async () => {
      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      const request = new Request('http://localhost', {
        headers: { 'cf-connecting-ip': '192.168.1.1' },
      });

      const result = await limiter(request);
      expect(result.success).toBe(true);
    });

    it('should use "unknown" as fallback if IP headers are missing or invalid', async () => {
      const limiter = rateLimit({ max: 1, windowMs: 1000 });

      // Missing headers
      const request1 = new Request('http://localhost');
      const result1 = await limiter(request1);
      expect(result1.success).toBe(true);

      // Invalid IP in x-forwarded-for
      const request2 = new Request('http://localhost', {
        headers: { 'x-forwarded-for': 'invalid-ip' }
      });
      const result2 = await limiter(request2);
      expect(result2.success).toBe(false); // Same key "unknown"
    });

    it('should handle invalid IPs by falling back', async () => {
       const limiter = rateLimit({ max: 1, windowMs: 1000 });

       // Invalid x-forwarded-for, valid x-real-ip
       const request = new Request('http://localhost', {
         headers: {
           'x-forwarded-for': 'not-an-ip',
           'x-real-ip': '10.0.0.1'
         }
       });

       await limiter(request);
       // Should have used 10.0.0.1

       const request2 = new Request('http://localhost', {
         headers: { 'x-forwarded-for': '10.0.0.1' }
       });
       expect((await limiter(request2)).success).toBe(false);
    });
  });

  describe('rateLimiters', () => {
    it('should have contactForm, apiGeneral, and search limiters with correct limits', async () => {
      expect(rateLimiters.contactForm).toBeDefined();
      expect(rateLimiters.apiGeneral).toBeDefined();
      expect(rateLimiters.search).toBeDefined();

      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '127.0.0.1' },
      });

      // Verify contactForm limit (5)
      rateLimitStore.clear();
      for (let i = 0; i < 5; i++) {
        expect((await rateLimiters.contactForm(request)).success).toBe(true);
      }
      expect((await rateLimiters.contactForm(request)).success).toBe(false);

      // Verify apiGeneral limit (100)
      rateLimitStore.clear();
      for (let i = 0; i < 100; i++) {
        expect((await rateLimiters.apiGeneral(request)).success).toBe(true);
      }
      expect((await rateLimiters.apiGeneral(request)).success).toBe(false);

      // Verify search limit (50)
      rateLimitStore.clear();
      for (let i = 0; i < 50; i++) {
        expect((await rateLimiters.search(request)).success).toBe(true);
      }
      expect((await rateLimiters.search(request)).success).toBe(false);
    });
  });

  describe('cleanupRateLimitStore', () => {
    it('should remove expired entries', async () => {
      const limiter = rateLimit({ max: 1, windowMs: 50 });
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '1.1.1.1' },
      });

      await limiter(request);
      expect(rateLimitStore.size).toBe(1);

      // Manually expire the entry
      const entry = rateLimitStore.get('1.1.1.1');
      if (entry) {
        entry.resetTime = Date.now() - 1000;
      }

      cleanupRateLimitStore();
      expect(rateLimitStore.size).toBe(0);
    });

    it('should NOT remove non-expired entries', async () => {
      const limiter = rateLimit({ max: 1, windowMs: 10000 });
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '2.2.2.2' },
      });

      await limiter(request);
      expect(rateLimitStore.size).toBe(1);

      cleanupRateLimitStore();
      expect(rateLimitStore.size).toBe(1);
    });
  });
});
