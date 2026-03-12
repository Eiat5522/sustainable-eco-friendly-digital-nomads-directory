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

      const results = [
        await limiter(request),
        await limiter(request),
        await limiter(request)
      ];

      expect(results[0].success).toBe(true);
      expect(results[0].remaining).toBe(2);
      expect(results[1].success).toBe(true);
      expect(results[1].remaining).toBe(1);
      expect(results[2].success).toBe(true);
      expect(results[2].remaining).toBe(0);
    });

    it('should block requests when limit is exceeded', async () => {
      const { rateLimit, rateLimitStore, clearRedisClient } = rateLimitModule;
      rateLimitStore.clear();
      clearRedisClient();

      const limiter = rateLimit({ max: 2, windowMs: 1000 });
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '127.0.0.1' },
      });

      await limiter(request);
      await limiter(request);

      const result = await limiter(request);
      expect(result.success).toBe(false);
      expect(result.limit).toBe(2);
      expect(result.remaining).toBe(0);
    });

    it('should reset count after window expires', async () => {
      const { rateLimit, rateLimitStore, clearRedisClient } = rateLimitModule;
      rateLimitStore.clear();
      clearRedisClient();

      const limiter = rateLimit({ max: 2, windowMs: 100 });
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '127.0.0.1' },
      });

      await limiter(request);
      await limiter(request);
      expect((await limiter(request)).success).toBe(false);

      rateLimitStore.clear();

      const newResult = await limiter(request);
      expect(newResult.success).toBe(true);
      expect(newResult.remaining).toBe(1);
    });

    it('should track different IPs separately', async () => {
      const { rateLimit, rateLimitStore, clearRedisClient } = rateLimitModule;
      rateLimitStore.clear();
      clearRedisClient();

      const limiter = rateLimit({ max: 2, windowMs: 1000 });
      const request1 = new Request('http://localhost', { headers: { 'x-forwarded-for': '127.0.0.1' } });
      const request2 = new Request('http://localhost', { headers: { 'x-forwarded-for': '127.0.0.2' } });

      await limiter(request1);
      await limiter(request1);
      const result2a = await limiter(request2);
      expect(result2a.success).toBe(true);
      expect(result2a.remaining).toBe(1);
    });

    describe('IP extraction', () => {
      it.each([
        ['x-forwarded-for', '192.168.1.1, 10.0.0.1', '192.168.1.1'],
        ['x-real-ip', '192.168.1.2', '192.168.1.2'],
        ['cf-connecting-ip', '192.168.1.3', '192.168.1.3'],
      ])('should use %s header for IP', async (header, value, expectedIp) => {
        const { rateLimit, rateLimitStore, clearRedisClient } = rateLimitModule;
        rateLimitStore.clear();
        clearRedisClient();

        const limiter = rateLimit({ max: 1, windowMs: 1000 });
        const request = new Request('http://localhost', {
          headers: { [header]: value },
        });

        expect((await limiter(request)).success).toBe(true);
        expect((await limiter(request)).success).toBe(false);
      });

      it('should use "unknown" as fallback if no IP headers present', async () => {
        const { rateLimit, rateLimitStore, clearRedisClient } = rateLimitModule;
        rateLimitStore.clear();
        clearRedisClient();

        const limiter = rateLimit({ max: 1, windowMs: 1000 });
        const request = new Request('http://localhost');

        expect((await limiter(request)).success).toBe(true);
        expect((await limiter(request)).success).toBe(false);
      });
    });

    it('should use custom key generator if provided', async () => {
      const { rateLimit, rateLimitStore, clearRedisClient } = rateLimitModule;
      rateLimitStore.clear();
      clearRedisClient();

      const limiter = rateLimit({
        max: 1,
        windowMs: 1000,
        keyGenerator: req => new URL(req.url).searchParams.get('userId') || 'anonymous',
      });

      const request1 = new Request('http://localhost?userId=user1');
      const request2 = new Request('http://localhost?userId=user2');

      expect((await limiter(request1)).success).toBe(true);
      expect((await limiter(request2)).success).toBe(true);
      expect((await limiter(request1)).success).toBe(false);
    });

    it('should return correct resetTime', async () => {
      const { rateLimit, rateLimitStore, clearRedisClient } = rateLimitModule;
      rateLimitStore.clear();
      clearRedisClient();

      const windowMs = 5000;
      const limiter = rateLimit({ max: 1, windowMs });
      const request = new Request('http://localhost', { headers: { 'x-forwarded-for': '127.0.0.1' } });

      const before = Date.now();
      const result = await limiter(request);
      const after = Date.now();

      expect(result.resetTime).toBeGreaterThanOrEqual(before + windowMs);
      expect(result.resetTime).toBeLessThanOrEqual(after + windowMs);
    });
  });

  describe('Redis-based rate limiting', () => {
    const setupRedis = () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://fake-redis.upstash.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'fake-token';
    };

    it('should initialize Redis when credentials are provided', async () => {
      setupRedis();
      const { rateLimit, clearRedisClient } = rateLimitModule;
      clearRedisClient();
      mockRatelimitLimit.mockResolvedValue({ success: true, limit: 10, remaining: 9, reset: Date.now() + 60000 });

      await rateLimit({ max: 10, windowMs: 60000 })(new Request('http://localhost', { headers: { 'x-forwarded-for': '127.0.0.1' } }));

      expect(Redis).toHaveBeenCalledWith({ url: 'https://fake-redis.upstash.io', token: 'fake-token' });
      expect(Ratelimit).toHaveBeenCalled();
    });

    it('should use Redis-based limiter if available', async () => {
      setupRedis();
      const { rateLimit, clearRedisClient } = rateLimitModule;
      clearRedisClient();
      const resetTime = Date.now() + 60000;
      mockRatelimitLimit.mockResolvedValue({ success: true, limit: 10, remaining: 5, reset: resetTime });

      const result = await rateLimit({ max: 10, windowMs: 60000 })(new Request('http://localhost', { headers: { 'x-forwarded-for': '1.2.3.4' } }));

      expect(result.success).toBe(true);
      expect(result.remaining).toBe(5);
      expect(result.resetTime).toBe(resetTime);
    });

    it('should fall back to in-memory on Redis error', async () => {
      setupRedis();
      const { rateLimit, rateLimitStore, clearRedisClient } = rateLimitModule;
      rateLimitStore.clear();
      clearRedisClient();
      mockRatelimitLimit.mockRejectedValue(new Error('Redis error'));

      const limiter = rateLimit({ max: 2, windowMs: 60000 });
      const request = new Request('http://localhost', { headers: { 'x-forwarded-for': '1.2.3.4' } });

      expect((await limiter(request)).remaining).toBe(1);
      expect((await limiter(request)).remaining).toBe(0);
      expect((await limiter(request)).success).toBe(false);
    });

    it.each([
      ['DISABLE_UPSTASH_DURING_BUILD', '1'],
      ['missing credentials', '']
    ])('should handle %s by falling back to in-memory', async (scenario, value) => {
      if (scenario === 'DISABLE_UPSTASH_DURING_BUILD') {
        process.env.DISABLE_UPSTASH_DURING_BUILD = value;
      } else {
        delete process.env.UPSTASH_REDIS_REST_URL;
        delete process.env.UPSTASH_REDIS_REST_TOKEN;
      }

      const { rateLimit, rateLimitStore, clearRedisClient } = rateLimitModule;
      rateLimitStore.clear();
      clearRedisClient();

      await rateLimit({ max: 10, windowMs: 60000 })(new Request('http://localhost', { headers: { 'x-forwarded-for': '127.0.0.1' } }));

      expect(Redis).not.toHaveBeenCalled();
      expect(rateLimitStore.has('127.0.0.1')).toBe(true);
    });

    it('should handle Redis initialization error gracefully', async () => {
      setupRedis();
      (Redis as unknown as jest.Mock).mockImplementationOnce(() => { throw new Error('Init fail'); });

      const { rateLimit, rateLimitStore, clearRedisClient } = rateLimitModule;
      rateLimitStore.clear();
      clearRedisClient();

      await rateLimit({ max: 10, windowMs: 60000 })(new Request('http://localhost', { headers: { 'x-forwarded-for': '127.0.0.1' } }));

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
      mockRatelimitLimit.mockRejectedValue(new Error('Force in-memory'));

      const request = new Request('http://localhost', { headers: { 'x-forwarded-for': '127.0.0.1' } });

      for (let i = 0; i < 5; i++) {
        expect((await rateLimiters.contactForm(request)).success).toBe(true);
      }
      const result = await rateLimiters.contactForm(request);
      expect(result.success).toBe(false);
      expect(result.limit).toBe(5);
    });

    it.each([
      ['apiGeneral', 100],
      ['search', 50],
    ])('should have %s limiter configured with limit %i', async (limiterName, expectedLimit) => {
      const { rateLimiters } = rateLimitModule;
      const result = await (rateLimiters as any)[limiterName](new Request('http://localhost', { headers: { 'x-forwarded-for': '127.0.0.2' } }));
      expect(result.limit).toBe(expectedLimit);
    });
  });
});
