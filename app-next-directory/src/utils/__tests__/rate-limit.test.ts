/**
 * @jest-environment node
 */

import { afterEach, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';

// Mock the redis module
jest.mock('@upstash/redis', () => ({
  Redis: jest.fn().mockImplementation(() => ({
    // Mock Redis instance methods if needed
  })),
}));

// Mock Upstash rate limit
const mockRatelimitLimit = jest.fn().mockResolvedValue({
  success: true,
  limit: 10,
  remaining: 9,
  reset: Date.now() + 1000,
});

const mockRatelimitInstance = {
  limit: mockRatelimitLimit,
};

const mockRatelimitConstructor = jest.fn(() => mockRatelimitInstance);
(mockRatelimitConstructor as any).slidingWindow = jest.fn().mockReturnValue({});

jest.mock('@upstash/ratelimit', () => ({
  __esModule: true,
  Ratelimit: (global as any).mockRatelimitConstructor,
}));

(global as any).mockRatelimitConstructor = mockRatelimitConstructor;

import {
  rateLimit,
  rateLimiters,
  rateLimitStore,
  clearRedisClient,
  cleanupRateLimitStore,
  getClientIP,
} from '../rate-limit';

// Helper function to reduce code duplication
function createTestRequest(ip: string): Request {
  return new Request('http://localhost', {
    headers: { 'x-forwarded-for': ip },
  });
}

describe('rate-limit', () => {
  // Store original env vars
  const originalEnv = { ...process.env };

  beforeAll(() => {
    // Ensure Redis is not initialized during tests
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  beforeEach(() => {
    // Clear the rate limit store before each test
    rateLimitStore.clear();
    // Reset Redis client singleton
    clearRedisClient();
    // Mock console.log to avoid noise in test output
    jest.spyOn(console, 'log').mockImplementation(() => {});
    // Mock console.warn to avoid noise from Redis initialization
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    // Restore env vars
    process.env = { ...originalEnv };
    // Clear Redis credentials from env in case they were set
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.DISABLE_UPSTASH_DURING_BUILD;
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

    it('should handle multiple requests at the exact limit', async () => {
      const limiter = rateLimit({ max: 5, windowMs: 1000 });
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '127.0.0.1' },
      });

      // Make exactly max requests
      for (let i = 0; i < 5; i++) {
        const result = await limiter(request);
        expect(result.success).toBe(true);
      }

      // Next one should fail
      const result = await limiter(request);
      expect(result.success).toBe(false);
      expect(result.remaining).toBe(0);
    });
  });

  describe('rateLimiters', () => {
    it('should have contactForm limiter configured', () => {
      expect(rateLimiters.contactForm).toBeDefined();
      expect(typeof rateLimiters.contactForm).toBe('function');
    });

    it('should have apiGeneral limiter configured', () => {
      expect(rateLimiters.apiGeneral).toBeDefined();
      expect(typeof rateLimiters.apiGeneral).toBe('function');
    });

    it('should have search limiter configured', () => {
      expect(rateLimiters.search).toBeDefined();
      expect(typeof rateLimiters.search).toBe('function');
    });

    it('contactForm limiter should enforce 5 requests limit', async () => {
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '127.0.0.1' },
      });

      // Make 5 requests (should all succeed)
      for (let i = 0; i < 5; i++) {
        const result = await rateLimiters.contactForm(request);
        expect(result.success).toBe(true);
      }

      // 6th request should fail
      const result = await rateLimiters.contactForm(request);
      expect(result.success).toBe(false);
      expect(result.limit).toBe(5);
    });

    it('apiGeneral limiter should enforce 100 requests limit', async () => {
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '127.0.0.2' },
      });

      // Make 100 requests (should all succeed)
      for (let i = 0; i < 100; i++) {
        const result = await rateLimiters.apiGeneral(request);
        expect(result.success).toBe(true);
      }

      // 101st request should fail
      const result = await rateLimiters.apiGeneral(request);
      expect(result.success).toBe(false);
      expect(result.limit).toBe(100);
    });

    it('search limiter should enforce 50 requests limit', async () => {
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '127.0.0.3' },
      });

      // Make 50 requests (should all succeed)
      for (let i = 0; i < 50; i++) {
        const result = await rateLimiters.search(request);
        expect(result.success).toBe(true);
      }

      // 51st request should fail
      const result = await rateLimiters.search(request);
      expect(result.success).toBe(false);
      expect(result.limit).toBe(50);
    });
  });

  describe('rateLimitStore', () => {
    it('should be a Map', () => {
      expect(rateLimitStore instanceof Map).toBe(true);
    });

    it('should store rate limit information', async () => {
      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '127.0.0.1' },
      });

      await limiter(request);

      expect(rateLimitStore.size).toBeGreaterThan(0);
    });

    it('should allow manual clearing', async () => {
      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '127.0.0.1' },
      });

      await limiter(request);
      expect(rateLimitStore.size).toBeGreaterThan(0);

      rateLimitStore.clear();
      expect(rateLimitStore.size).toBe(0);
    });

    it('should cleanup expired entries using cleanupRateLimitStore', async () => {
      const limiter = rateLimit({ max: 1, windowMs: 50 }); // 50ms window
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '192.168.1.100' },
      });

      // Add an entry to the store
      await limiter(request);
      expect(rateLimitStore.size).toBeGreaterThan(0);

      // Manually trigger cleanup by setting expired resetTime
      const entries = Array.from(rateLimitStore.entries());
      if (entries.length > 0) {
        const [key, info] = entries[0];
        rateLimitStore.set(key, { ...info, resetTime: Date.now() - 1000 });

        // Now the entry is expired (resetTime is in the past)
        cleanupRateLimitStore();

        // Should be removed
        expect(rateLimitStore.has(key)).toBe(false);
      }
    });
  });

  describe('Redis initialization', () => {
    it('should not initialize Redis when credentials are missing', () => {
      // Credentials are already removed in beforeAll
      const limiter = rateLimit({ max: 1, windowMs: 1000 });

      // Should create an in-memory limiter
      expect(limiter).toBeDefined();
    });

    it('should skip Redis when DISABLE_UPSTASH_DURING_BUILD is set', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://fake-url.upstash.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'fake-token';
      process.env.DISABLE_UPSTASH_DURING_BUILD = '1';

      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      const request = createTestRequest('1.1.1.1');

      // Should use in-memory and succeed
      const result = await limiter(request);
      expect(result.success).toBe(true);
      expect(rateLimitStore.has('1.1.1.1')).toBe(true);
    });

    it('should initialize Redis when credentials are provided', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://fake-url.upstash.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'fake-token';

      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      const request = createTestRequest('2.2.2.2');

      const result = await limiter(request);
      expect(result.success).toBe(true);
      // It shouldn't use in-memory store
      expect(rateLimitStore.has('2.2.2.2')).toBe(false);
    });

    it('should fallback to in-memory if Redis initialization fails', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://fake-url.upstash.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'fake-token';

      const { Redis } = require('@upstash/redis');
      (Redis as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Redis init failed');
      });

      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      const request = createTestRequest('3.3.3.3');

      const result = await limiter(request);
      expect(result.success).toBe(true);
      // Should have fallen back to in-memory
      expect(rateLimitStore.has('3.3.3.3')).toBe(true);
    });

    it('should fallback to in-memory if limiter.limit throws', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://fake-url.upstash.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'fake-token';

      const { Ratelimit } = require('@upstash/ratelimit');
      (Ratelimit as jest.Mock).mockImplementationOnce(() => ({
        limit: jest.fn().mockRejectedValue(new Error('Redis limit failed')),
      }));

      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      const request = createTestRequest('4.4.4.4');

      const result = await limiter(request);
      expect(result.success).toBe(true);
      expect(rateLimitStore.has('4.4.4.4')).toBe(true);
    });
  });

  describe('Edge cases', () => {
    it('should handle requests with empty headers', async () => {
      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      const request = new Request('http://localhost');

      const result = await limiter(request);
      expect(result.success).toBe(true);
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

    it('should handle empty x-forwarded-for value', async () => {
      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '' },
      });

      // Should fall back to x-real-ip, cf-connecting-ip, or 'unknown'
      const result = await limiter(request);
      expect(result.success).toBe(true);
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

    it('should handle zero remaining correctly', async () => {
      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '192.168.50.50' },
      });

      const result1 = await limiter(request);
      expect(result1.remaining).toBe(0);

      const result2 = await limiter(request);
      expect(result2.success).toBe(false);
      expect(result2.remaining).toBe(0);
    });

    it('should return correct resetTime for each request', async () => {
      const windowMs = 2000;
      const limiter = rateLimit({ max: 3, windowMs });
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '192.168.100.100' },
      });

      const before = Date.now();
      const result1 = await limiter(request);
      const result2 = await limiter(request);
      const after = Date.now();

      // Both should have the same resetTime
      expect(result1.resetTime).toBe(result2.resetTime);
      expect(result1.resetTime).toBeGreaterThanOrEqual(before + windowMs);
      expect(result1.resetTime).toBeLessThanOrEqual(after + windowMs);
    });

    it('getClientIP should handle missing headers', () => {
      const request = new Request('http://localhost');
      expect(getClientIP(request)).toBe('unknown');
    });

    it('getClientIP should handle x-forwarded-for', () => {
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '1.2.3.4' },
      });
      expect(getClientIP(request)).toBe('1.2.3.4');
    });

    it('getClientIP should handle x-real-ip', () => {
      const request = new Request('http://localhost', {
        headers: { 'x-real-ip': '5.6.7.8' },
      });
      expect(getClientIP(request)).toBe('5.6.7.8');
    });

    it('getClientIP should handle cf-connecting-ip', () => {
      const request = new Request('http://localhost', {
        headers: { 'cf-connecting-ip': '9.10.11.12' },
      });
      expect(getClientIP(request)).toBe('9.10.11.12');
    });
  });
});
