/**
 * @jest-environment node
 */

import { afterEach, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Mock Upstash Redis and Ratelimit before importing rate-limit
jest.mock('@upstash/redis', () => ({
  Redis: jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    set: jest.fn(),
  })),
}));

const mockSlidingWindow = jest.fn();
jest.mock('@upstash/ratelimit', () => ({
  Ratelimit: jest.fn().mockImplementation(() => ({
    limit: jest.fn(),
  })),
}));

// Add slidingWindow to Ratelimit mock
(Ratelimit as any).slidingWindow = mockSlidingWindow;

import {
  cleanupRateLimitStore,
  clearRedisClient,
  rateLimit,
  rateLimiters,
  rateLimitStore,
} from '../rate-limit';

describe('rate-limit', () => {
  // Store original env vars
  const originalEnv = { ...process.env };

  beforeAll(() => {
    // Ensure Redis is not initialized by default
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

      // Manually set resetTime in the past to simulate window expiration
      const key = '127.0.0.1';
      const info = rateLimitStore.get(key);
      if (info) {
        rateLimitStore.set(key, { ...info, resetTime: Date.now() - 1000 });
      }

      // Should allow requests again after expiration
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

    it('should use Redis when credentials are provided', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://fake-redis.upstash.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'fake-token';

      const mockLimit = jest.fn().mockResolvedValue({
        success: true,
        limit: 10,
        remaining: 9,
        reset: 123456789,
      });

      (Ratelimit as unknown as jest.Mock).mockImplementation(() => ({
        limit: mockLimit,
      }));

      const limiter = rateLimit({ max: 10, windowMs: 1000 });
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '127.0.0.1' },
      });

      const result = await limiter(request);

      expect(Redis).toHaveBeenCalled();
      expect(Ratelimit).toHaveBeenCalled();
      expect(mockLimit).toHaveBeenCalledWith('127.0.0.1');
      expect(result.success).toBe(true);
      expect(result.limit).toBe(10);
      expect(result.remaining).toBe(9);
      expect(result.resetTime).toBe(123456789);
    });

    it('should fallback to in-memory when Redis initialization fails', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://fake-redis.upstash.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'fake-token';

      (Redis as unknown as jest.Mock).mockImplementation(() => {
        throw new Error('Redis connection failed');
      });

      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '127.0.0.1' },
      });

      const result = await limiter(request);
      expect(result.success).toBe(true);
      expect(rateLimitStore.has('127.0.0.1')).toBe(true);
    });

    it('should fallback to in-memory when Redis limit call fails', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://fake-redis.upstash.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'fake-token';

      const mockLimit = jest.fn().mockRejectedValue(new Error('Redis limit error'));

      (Ratelimit as unknown as jest.Mock).mockImplementation(() => ({
        limit: mockLimit,
      }));

      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '127.0.0.1' },
      });

      const result = await limiter(request);
      expect(result.success).toBe(true);
      expect(rateLimitStore.has('127.0.0.1')).toBe(true);
    });

    it('should respect DISABLE_UPSTASH_DURING_BUILD environment variable', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://fake-redis.upstash.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'fake-token';
      process.env.DISABLE_UPSTASH_DURING_BUILD = '1';

      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '127.0.0.1' },
      });

      await limiter(request);

      expect(Redis).not.toHaveBeenCalled();
      expect(rateLimitStore.has('127.0.0.1')).toBe(true);
    });
  });

  describe('cleanupRateLimitStore', () => {
    it('should remove expired entries', () => {
      const now = Date.now();
      rateLimitStore.set('key1', { count: 1, resetTime: now - 1000 }); // Expired
      rateLimitStore.set('key2', { count: 1, resetTime: now + 1000 }); // Not expired

      cleanupRateLimitStore();

      expect(rateLimitStore.has('key1')).toBe(false);
      expect(rateLimitStore.has('key2')).toBe(true);
    });
  });

  describe('rateLimiters', () => {
    it('should have contactForm, apiGeneral, and search limiters configured', () => {
      expect(rateLimiters.contactForm).toBeDefined();
      expect(rateLimiters.apiGeneral).toBeDefined();
      expect(rateLimiters.search).toBeDefined();
    });
  });
});
