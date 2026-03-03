/**
 * @jest-environment node
 */

import { afterEach, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';

// Define the mocks before anything else to ensure they are used by the imported module
const mockLimit = jest.fn();
const mockSlidingWindow = jest.fn().mockReturnValue('slidingWindow');

jest.mock('@upstash/redis', () => ({
  Redis: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('@upstash/ratelimit', () => ({
  Ratelimit: Object.assign(
    jest.fn().mockImplementation(() => ({
      limit: mockLimit,
    })),
    {
      slidingWindow: mockSlidingWindow,
    }
  ),
}));

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import {
  cleanupRateLimitStore,
  clearRedisClient,
  rateLimit,
  rateLimiters,
  rateLimitStore,
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
    // Ensure Redis is not initialized during tests by default
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  beforeEach(() => {
    // Clear the rate limit store before each test
    rateLimitStore.clear();
    // Reset Redis singleton state
    clearRedisClient();
    // Mock console.log to avoid noise in test output
    jest.spyOn(console, 'log').mockImplementation(() => {});
    // Mock console.warn to avoid noise from Redis initialization
    jest.spyOn(console, 'warn').mockImplementation(() => {});

    // Reset mocks
    jest.clearAllMocks();
    mockLimit.mockReset();
    mockSlidingWindow.mockClear();
    mockSlidingWindow.mockReturnValue('slidingWindow');
  });

  afterEach(() => {
    jest.restoreAllMocks();
    // Restore env vars
    process.env = { ...originalEnv };
  });

  describe('rateLimit - In-Memory Fallback', () => {
    it('should allow requests within the limit', async () => {
      const limiter = rateLimit({ max: 3, windowMs: 1000 });
      const request = createTestRequest('127.0.0.1');

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
      const request = createTestRequest('127.0.0.1');

      await limiter(request); // First request
      await limiter(request); // Second request

      const result = await limiter(request); // Third request should be blocked
      expect(result.success).toBe(false);
      expect(result.limit).toBe(2);
      expect(result.remaining).toBe(0);
    });

    it('should reset count after window expires', async () => {
      const limiter = rateLimit({ max: 2, windowMs: 100 }); // 100ms window
      const request = createTestRequest('127.0.0.1');

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

      const request1 = createTestRequest('127.0.0.1');
      const request2 = createTestRequest('127.0.0.2');

      // First IP
      await limiter(request1);
      await limiter(request1);
      const result1c = await limiter(request1);
      expect(result1c.success).toBe(false);

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

    it('should return correct resetTime', async () => {
      const windowMs = 5000;
      const limiter = rateLimit({ max: 1, windowMs });
      const request = createTestRequest('127.0.0.1');

      const before = Date.now();
      const result = await limiter(request);
      const after = Date.now();

      expect(result.resetTime).toBeGreaterThanOrEqual(before + windowMs);
      expect(result.resetTime).toBeLessThanOrEqual(after + windowMs);
    });

    it('should handle multiple requests at the exact limit', async () => {
      const limiter = rateLimit({ max: 5, windowMs: 1000 });
      const request = createTestRequest('127.0.0.1');

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

  describe('rateLimit - Redis-based', () => {
    it('should use Redis-based rate limiting if available', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://fake-redis.upstash.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'fake-token';

      const mockLimitResult = {
        success: true,
        limit: 10,
        remaining: 9,
        reset: 123456789,
      };

      mockLimit.mockResolvedValue(mockLimitResult);

      const limiter = rateLimit({ max: 10, windowMs: 60000 });
      const request = createTestRequest('8.8.8.8');

      const result = await limiter(request);

      expect(Redis).toHaveBeenCalled();
      expect(Ratelimit).toHaveBeenCalled();
      expect(mockLimit).toHaveBeenCalledWith('8.8.8.8');
      expect(result).toEqual({
        success: true,
        limit: 10,
        remaining: 9,
        resetTime: 123456789,
      });
    });

    it('should fallback to In-Memory if Redis call fails', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://fake-redis.upstash.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'fake-token';

      mockLimit.mockRejectedValue(new Error('Redis Down'));

      const limiter = rateLimit({ max: 5, windowMs: 60000 });
      const request = createTestRequest('9.9.9.9');

      const result = await limiter(request);

      expect(result.success).toBe(true);
      expect(result.remaining).toBe(4);
      expect(rateLimitStore.has('9.9.9.9')).toBe(true);
    });

    it('should use custom key generator with Redis', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://fake-redis.upstash.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'fake-token';

      mockLimit.mockResolvedValue({
        success: true,
        limit: 10,
        remaining: 5,
        reset: 1000,
      });

      const limiter = rateLimit({
        max: 10,
        windowMs: 60000,
        keyGenerator: () => 'custom-key',
      });
      const request = createTestRequest('1.1.1.1');

      await limiter(request);

      expect(mockLimit).toHaveBeenCalledWith('custom-key');
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
      const request = createTestRequest('127.0.0.1');

      for (let i = 0; i < 5; i++) {
        const result = await rateLimiters.contactForm(request);
        expect(result.success).toBe(true);
      }

      const result = await rateLimiters.contactForm(request);
      expect(result.success).toBe(false);
      expect(result.limit).toBe(5);
    });

    it('apiGeneral limiter should enforce 100 requests limit', async () => {
      const request = createTestRequest('127.0.0.2');

      for (let i = 0; i < 100; i++) {
        const result = await rateLimiters.apiGeneral(request);
        expect(result.success).toBe(true);
      }

      const result = await rateLimiters.apiGeneral(request);
      expect(result.success).toBe(false);
      expect(result.limit).toBe(100);
    });

    it('search limiter should enforce 50 requests limit', async () => {
      const request = createTestRequest('127.0.0.3');

      for (let i = 0; i < 50; i++) {
        const result = await rateLimiters.search(request);
        expect(result.success).toBe(true);
      }

      const result = await rateLimiters.search(request);
      expect(result.success).toBe(false);
      expect(result.limit).toBe(50);
    });
  });

  describe('rateLimitStore and cleanup', () => {
    it('should be a Map', () => {
      expect(rateLimitStore instanceof Map).toBe(true);
    });

    it('should allow manual clearing', async () => {
      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      const request = createTestRequest('127.0.0.1');

      await limiter(request);
      expect(rateLimitStore.size).toBeGreaterThan(0);

      rateLimitStore.clear();
      expect(rateLimitStore.size).toBe(0);
    });

    it('should cleanup expired entries via cleanupRateLimitStore', () => {
      const now = Date.now();
      jest.spyOn(Date, 'now').mockReturnValue(now);

      rateLimitStore.set('expired', { count: 1, resetTime: now - 1000 });
      rateLimitStore.set('valid', { count: 1, resetTime: now + 1000 });

      expect(rateLimitStore.size).toBe(2);

      cleanupRateLimitStore();

      expect(rateLimitStore.has('expired')).toBe(false);
      expect(rateLimitStore.has('valid')).toBe(true);
      expect(rateLimitStore.size).toBe(1);
    });
  });

  describe('Redis initialization', () => {
    it('should not initialize Redis when credentials are missing', () => {
      clearRedisClient();
      delete process.env.UPSTASH_REDIS_REST_URL;
      delete process.env.UPSTASH_REDIS_REST_TOKEN;

      rateLimit({ max: 1, windowMs: 1000 });

      expect(Redis).not.toHaveBeenCalled();
    });

    it('should not initialize Redis when DISABLE_UPSTASH_DURING_BUILD is set', () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://fake.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'fake';
      process.env.DISABLE_UPSTASH_DURING_BUILD = '1';

      rateLimit({ max: 1, windowMs: 1000 });

      expect(Redis).not.toHaveBeenCalled();
    });

    it('should handle Redis constructor errors gracefully', () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://fake.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'fake';

      (Redis as unknown as jest.Mock).mockImplementation(() => {
        throw new Error('Constructor Error');
      });

      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      expect(limiter).toBeDefined();
      // Should fall back to in-memory silently
    });
  });

  describe('Edge cases and IP extraction', () => {
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

      // Same x-forwarded-for but different x-real-ip should still be blocked
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

      // Same x-real-ip but different cf-connecting-ip should still be blocked
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
      const request = createTestRequest('192.168.50.50');

      const result1 = await limiter(request);
      expect(result1.remaining).toBe(0);

      const result2 = await limiter(request);
      expect(result2.success).toBe(false);
      expect(result2.remaining).toBe(0);
    });

    it('should return correct resetTime for each request', async () => {
      const windowMs = 2000;
      const limiter = rateLimit({ max: 3, windowMs });
      const request = createTestRequest('192.168.100.100');

      const result1 = await limiter(request);
      const result2 = await limiter(request);

      // Both should have the same resetTime
      expect(result1.resetTime).toBe(result2.resetTime);
    });

    it('should handle cf-connecting-ip if others are not present', async () => {
      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      const request = new Request('http://localhost', {
        headers: { 'cf-connecting-ip': '1.2.3.4' },
      });

      const result = await limiter(request);
      expect(result.success).toBe(true);

      const result2 = await limiter(request);
      expect(result2.success).toBe(false);
    });

    it('should skip invalid IPs in headers', async () => {
      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      const request = new Request('http://localhost', {
        headers: {
          'x-forwarded-for': 'invalid-ip, 127.0.0.1',
          'x-real-ip': 'not-an-ip',
          'cf-connecting-ip': 'also-invalid'
        },
      });

      const result = await limiter(request);
      expect(result.success).toBe(true);
      // It should have fallen back to 'unknown' or skip 'invalid-ip' and found nothing else valid
    });
  });
});
