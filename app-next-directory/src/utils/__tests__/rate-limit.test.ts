/**
 * @jest-environment node
 */

import { afterEach, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';

// Mock Upstash Redis and Ratelimit before anything else
const mockLimit = jest.fn();
jest.mock('@upstash/redis', () => {
  return {
    Redis: jest.fn().mockImplementation(() => ({
      // Mock methods as needed
    })),
  };
});

jest.mock('@upstash/ratelimit', () => {
  return {
    Ratelimit: Object.assign(
      jest.fn().mockImplementation(() => ({
        limit: mockLimit,
      })),
      {
        slidingWindow: jest.fn().mockReturnValue('slidingWindowLimiter'),
      }
    ),
  };
});

// Import Ratelimit and Redis for testing expectations
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Now import the code under test
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
    // Reset the internal Redis client singleton
    clearRedisClient();
    // Mock console.log to avoid noise in test output
    jest.spyOn(console, 'log').mockImplementation(() => {});
    // Mock console.warn to avoid noise from Redis initialization
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    // Clear all mocks
    jest.clearAllMocks();
    mockLimit.mockReset();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    // Restore env vars
    process.env = { ...originalEnv };
  });

  describe('rateLimit', () => {
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

      const request1 = createTestRequest('127.0.0.1');
      const request2 = createTestRequest('127.0.0.2');

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

    it('should use x-forwarded-for header for IP (validated)', async () => {
      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      const request = createTestRequest('192.168.1.1, 10.0.0.1');

      const result = await limiter(request);
      expect(result.success).toBe(true);

      // Should use the first IP in the list
      const result2 = await limiter(request);
      expect(result2.success).toBe(false);
    });

    it('should fall back to unknown if IP is invalid', async () => {
      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      const request = createTestRequest('not-an-ip');

      // Should fall back to 'unknown'
      const result = await limiter(request);
      expect(result.success).toBe(true);

      const request2 = new Request('http://localhost'); // also falls back to 'unknown'
      const result2 = await limiter(request2);
      expect(result2.success).toBe(false);
    });

    it('should use x-real-ip header if x-forwarded-for is not present or invalid', async () => {
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
  });

  describe('Redis path', () => {
    beforeEach(() => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://fake-redis.upstash.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'fake-token';
    });

    it('should initialize Redis and call its limiter', async () => {
      mockLimit.mockResolvedValue({
        success: true,
        limit: 10,
        remaining: 9,
        reset: 123456789,
      });

      const limiter = rateLimit({ max: 10, windowMs: 1000 });
      const request = createTestRequest('1.1.1.1');
      const result = await limiter(request);

      expect(Redis).toHaveBeenCalled();
      expect(Ratelimit).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.remaining).toBe(9);
      expect(result.resetTime).toBe(123456789);
    });

    it('should fallback to in-memory if Redis limiter fails', async () => {
      mockLimit.mockRejectedValue(new Error('Redis error'));

      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      const request = createTestRequest('2.2.2.2');

      // First call fails Redis but succeeds in-memory
      const result1 = await limiter(request);
      expect(result1.success).toBe(true);

      // Second call fails Redis and fails in-memory (exceeded)
      const result2 = await limiter(request);
      expect(result2.success).toBe(false);
    });

    it('should not initialize Redis if DISABLE_UPSTASH_DURING_BUILD is set', () => {
      process.env.DISABLE_UPSTASH_DURING_BUILD = '1';
      const limiter = rateLimit({ max: 10, windowMs: 1000 });

      expect(Redis).not.toHaveBeenCalled();
    });

    it('should handle Redis constructor error', async () => {
      (Redis as any).mockImplementationOnce(() => {
        throw new Error('Constructor failed');
      });

      const limiter = rateLimit({ max: 10, windowMs: 1000 });
      const request = createTestRequest('3.3.3.3');
      const result = await limiter(request);

      expect(result.success).toBe(true); // Should fall back to in-memory
    });
  });

  describe('cleanupRateLimitStore', () => {
    it('should remove expired entries', () => {
      const now = Date.now();
      rateLimitStore.set('expired', { count: 5, resetTime: now - 1000 });
      rateLimitStore.set('valid', { count: 5, resetTime: now + 1000 });

      cleanupRateLimitStore();

      expect(rateLimitStore.has('expired')).toBe(false);
      expect(rateLimitStore.has('valid')).toBe(true);
    });
  });

  describe('rateLimiters', () => {
    it('should have contactForm limiter configured correctly', async () => {
      const request = createTestRequest('10.10.10.10');
      // Max 5
      for (let i = 0; i < 5; i++) {
        expect((await rateLimiters.contactForm(request)).success).toBe(true);
      }
      expect((await rateLimiters.contactForm(request)).success).toBe(false);
    });
  });
});
