/**
 * @jest-environment node
 */

import { afterEach, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';

// Define mocks at the top level so they are available for hoisting
const mockRedisInstance = {
  get: jest.fn(),
  set: jest.fn(),
};

const mockRatelimitLimit = jest.fn();
const mockRatelimitInstance = {
  limit: mockRatelimitLimit,
};

// Mock @upstash/redis
jest.mock('@upstash/redis', () => ({
  Redis: jest.fn(() => mockRedisInstance),
}));

// Mock @upstash/ratelimit
jest.mock('@upstash/ratelimit', () => ({
  Ratelimit: Object.assign(
    jest.fn(() => mockRatelimitInstance),
    {
      slidingWindow: jest.fn((max: number, window: string) => ({ max, window })),
    }
  ),
}));

import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';
import * as rateLimitModule from '../rate-limit';

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
    jest.clearAllMocks();

    // Mock console.log to avoid noise in test output
    jest.spyOn(console, 'log').mockImplementation(() => {});
    // Mock console.warn to avoid noise from Redis initialization
    jest.spyOn(console, 'warn').mockImplementation(() => {});

    // Set default mock implementation for limiter to RETURN REJECTED so we use in-memory
    mockRatelimitLimit.mockRejectedValue(new Error('Redis disabled for in-memory tests'));
  });

  afterEach(() => {
    jest.restoreAllMocks();
    // Restore env vars
    process.env = { ...originalEnv };
  });

  describe('rateLimit (in-memory fallback)', () => {
    it('should allow requests within the limit', async () => {
      const { rateLimit, rateLimitStore, clearRedisClient } = rateLimitModule;
      rateLimitStore.clear();
      clearRedisClient();

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
      const { rateLimit, rateLimitStore, clearRedisClient } = rateLimitModule;
      rateLimitStore.clear();
      clearRedisClient();

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
      const { rateLimit, rateLimitStore, clearRedisClient } = rateLimitModule;
      rateLimitStore.clear();
      clearRedisClient();

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
      const { rateLimit, rateLimitStore, clearRedisClient } = rateLimitModule;
      rateLimitStore.clear();
      clearRedisClient();

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

    describe('IP extraction', () => {
      it('should use x-forwarded-for header for IP', async () => {
        const { rateLimit, rateLimitStore, clearRedisClient } = rateLimitModule;
        rateLimitStore.clear();
        clearRedisClient();

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
        const { rateLimit, rateLimitStore, clearRedisClient } = rateLimitModule;
        rateLimitStore.clear();
        clearRedisClient();

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
        const { rateLimit, rateLimitStore, clearRedisClient } = rateLimitModule;
        rateLimitStore.clear();
        clearRedisClient();

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
        const { rateLimit, rateLimitStore, clearRedisClient } = rateLimitModule;
        rateLimitStore.clear();
        clearRedisClient();

        const limiter = rateLimit({ max: 1, windowMs: 1000 });
        const request = new Request('http://localhost');

        const result = await limiter(request);
        expect(result.success).toBe(true);

        const result2 = await limiter(request);
        expect(result2.success).toBe(false);
      });
    });

    it('should use custom key generator if provided', async () => {
      const { rateLimit, rateLimitStore, clearRedisClient } = rateLimitModule;
      rateLimitStore.clear();
      clearRedisClient();

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
      const { rateLimit, rateLimitStore, clearRedisClient } = rateLimitModule;
      rateLimitStore.clear();
      clearRedisClient();

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

  describe('Redis-based rate limiting', () => {
    it('should initialize Redis when credentials are provided', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://fake-redis.upstash.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'fake-token';

      const { rateLimit, clearRedisClient } = rateLimitModule;
      clearRedisClient();

      mockRatelimitLimit.mockResolvedValue({
        success: true,
        limit: 10,
        remaining: 9,
        reset: Date.now() + 60000,
      });

      const limiter = rateLimit({ max: 10, windowMs: 60000 });
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '127.0.0.1' },
      });

      await limiter(request);

      expect(Redis).toHaveBeenCalledWith({
        url: 'https://fake-redis.upstash.io',
        token: 'fake-token',
      });
      expect(Ratelimit).toHaveBeenCalled();
    });

    it('should use Redis-based limiter if available', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://fake-redis.upstash.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'fake-token';

      const { rateLimit, clearRedisClient } = rateLimitModule;
      clearRedisClient();

      const resetTime = Date.now() + 60000;
      mockRatelimitLimit.mockResolvedValue({
        success: true,
        limit: 10,
        remaining: 5,
        reset: resetTime,
      });

      const limiter = rateLimit({ max: 10, windowMs: 60000 });
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '1.2.3.4' },
      });

      const result = await limiter(request);

      expect(result.success).toBe(true);
      expect(result.remaining).toBe(5);
      expect(result.resetTime).toBe(resetTime);
      expect(mockRatelimitLimit).toHaveBeenCalledWith('1.2.3.4');
    });

    it('should fall back to in-memory on Redis error', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://fake-redis.upstash.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'fake-token';

      const { rateLimit, rateLimitStore, clearRedisClient } = rateLimitModule;
      rateLimitStore.clear();
      clearRedisClient();

      mockRatelimitLimit.mockRejectedValue(new Error('Redis connection error'));

      const limiter = rateLimit({ max: 2, windowMs: 60000 });
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '1.2.3.4' },
      });

      // First call fails Redis and uses in-memory
      const result1 = await limiter(request);
      expect(result1.success).toBe(true);
      expect(result1.remaining).toBe(1);

      // Second call also uses in-memory (and would still fail Redis)
      const result2 = await limiter(request);
      expect(result2.success).toBe(true);
      expect(result2.remaining).toBe(0);

      const result3 = await limiter(request);
      expect(result3.success).toBe(false);
    });

    it('should respect DISABLE_UPSTASH_DURING_BUILD', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://fake-redis.upstash.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'fake-token';
      process.env.DISABLE_UPSTASH_DURING_BUILD = '1';

      const { rateLimit, rateLimitStore, clearRedisClient } = rateLimitModule;
      rateLimitStore.clear();
      clearRedisClient();

      const limiter = rateLimit({ max: 10, windowMs: 60000 });
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '127.0.0.1' },
      });

      await limiter(request);

      expect(Redis).not.toHaveBeenCalled();
      // Should have used in-memory
      expect(rateLimitStore.has('127.0.0.1')).toBe(true);
    });

    it('should handle Redis initialization error gracefully', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://fake-redis.upstash.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'fake-token';

      (Redis as unknown as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Initialization failed');
      });

      const { rateLimit, rateLimitStore, clearRedisClient } = rateLimitModule;
      rateLimitStore.clear();
      clearRedisClient();

      const limiter = rateLimit({ max: 10, windowMs: 60000 });
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '127.0.0.1' },
      });

      await limiter(request);

      // Should have used in-memory fallback
      expect(rateLimitStore.has('127.0.0.1')).toBe(true);
    });

    it('should handle missing credentials gracefully', async () => {
      delete process.env.UPSTASH_REDIS_REST_URL;
      delete process.env.UPSTASH_REDIS_REST_TOKEN;

      const { rateLimit, rateLimitStore, clearRedisClient } = rateLimitModule;
      rateLimitStore.clear();
      clearRedisClient();

      const limiter = rateLimit({ max: 10, windowMs: 60000 });
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '127.0.0.1' },
      });

      await limiter(request);

      expect(Redis).not.toHaveBeenCalled();
      // Should have used in-memory
      expect(rateLimitStore.has('127.0.0.1')).toBe(true);
    });
  });

  describe('cleanupRateLimitStore', () => {
    it('should remove expired entries', () => {
      const { rateLimitStore, cleanupRateLimitStore } = rateLimitModule;
      const now = Date.now();
      rateLimitStore.set('expired', { count: 1, resetTime: now - 1000 });
      rateLimitStore.set('valid', { count: 1, resetTime: now + 1000 });

      cleanupRateLimitStore();

      expect(rateLimitStore.has('expired')).toBe(false);
      expect(rateLimitStore.has('valid')).toBe(true);
    });
  });

  describe('rateLimiters', () => {
    it('should have contactForm limiter configured', async () => {
      const { rateLimiters, rateLimitStore, clearRedisClient } = rateLimitModule;
      rateLimitStore.clear();
      clearRedisClient();

      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '127.0.0.1' },
      });

      // Force in-memory by rejecting Redis
      mockRatelimitLimit.mockRejectedValue(new Error('Force in-memory'));

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

    it('should have apiGeneral limiter configured', async () => {
      const { rateLimiters } = rateLimitModule;
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '127.0.0.2' },
      });

      const result = await rateLimiters.apiGeneral(request);
      // apiGeneral: 100 requests per hour
      // NOTE: Since these are predefined, they might have already tried initializing.
      // We expect them to work either with Redis mock or in-memory.
      // If they use Redis mock, the limit will be what mockRatelimitLimit returns.
      // But they were created at module load time with max: 100.
      expect(result.limit).toBe(100);
    });

    it('should have search limiter configured', async () => {
      const { rateLimiters } = rateLimitModule;
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '127.0.0.3' },
      });

      const result = await rateLimiters.search(request);
      // Search: 50 requests per 10 minutes
      expect(result.limit).toBe(50);
    });
  });
});
