/**
 * @jest-environment node
 */

import { afterEach, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';

// Define mocks before importing the module
const mockLimit = jest.fn();
const mockRatelimit = jest.fn().mockImplementation(() => ({
  limit: mockLimit,
}));
(mockRatelimit as any).slidingWindow = jest.fn().mockReturnValue('slidingWindow');

const mockRedis = jest.fn();

// We MUST mock before any imports of the module under test
jest.mock('@upstash/ratelimit', () => ({
  Ratelimit: mockRatelimit,
}));

jest.mock('@upstash/redis', () => ({
  Redis: mockRedis,
}));

// Bypass the global mock from jest.setup.ts
jest.unmock('../rate-limit');

// Use require to ensure we get the fresh module with applied mocks
const {
  rateLimit,
  rateLimiters,
  rateLimitStore,
  cleanupRateLimitStore,
  clearRedisClient,
  clearRateLimiters,
} = require('../rate-limit');

describe('rate-limit', () => {
  const originalEnv = { ...process.env };

  beforeAll(() => {
  });

  beforeEach(() => {
    rateLimitStore.clear();
    if (typeof clearRedisClient === 'function') {
      clearRedisClient();
    }
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.DISABLE_UPSTASH_DURING_BUILD;

    mockRatelimit.mockClear();
    mockRedis.mockClear();
    mockLimit.mockReset();
    if (typeof clearRateLimiters === 'function') {
      clearRateLimiters();
    }
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe('rateLimit - In-memory', () => {
    it('should allow requests within the limit', async () => {
      const limiter = rateLimit({ max: 3, windowMs: 1000 });
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '127.0.0.1' },
      });

      const result1 = await limiter(request);
      expect(result1.success).toBe(true);
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

      await limiter(request);
      await limiter(request);

      const result = await limiter(request);
      expect(result.success).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should reset count after window expires (via cleanup)', async () => {
      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '127.0.0.1' },
      });

      await limiter(request);
      expect((await limiter(request)).success).toBe(false);

      // Simulate expiration
      const entry = rateLimitStore.get('127.0.0.1');
      if (entry) {
        entry.resetTime = Date.now() - 1000;
      }

      cleanupRateLimitStore();
      expect(rateLimitStore.has('127.0.0.1')).toBe(false);

      const result = await limiter(request);
      expect(result.success).toBe(true);
    });
  });

  describe('Redis initialization', () => {
    it('should initialize Redis when credentials are provided', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://fake-url.com';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'fake-token';

      clearRedisClient();
      rateLimit({ max: 10, windowMs: 1000 });

      expect(mockRedis).toHaveBeenCalledWith({
        url: 'https://fake-url.com',
        token: 'fake-token',
      });
      expect(mockRatelimit).toHaveBeenCalled();
    });

    it('should not initialize Redis if credentials are missing', async () => {
      clearRedisClient();
      rateLimit({ max: 10, windowMs: 1000 });
      expect(mockRedis).not.toHaveBeenCalled();
    });

    it('should skip Redis if DISABLE_UPSTASH_DURING_BUILD is set', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://fake-url.com';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'fake-token';
      process.env.DISABLE_UPSTASH_DURING_BUILD = '1';

      clearRedisClient();
      rateLimit({ max: 10, windowMs: 1000 });
      expect(mockRedis).not.toHaveBeenCalled();
    });

    it('should handle Redis constructor errors', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://fake-url.com';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'fake-token';
      mockRedis.mockImplementationOnce(() => {
        throw new Error('Redis error');
      });

      clearRedisClient();
      const limiter = rateLimit({ max: 10, windowMs: 1000 });
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '127.0.0.1' },
      });

      const result = await limiter(request);
      expect(result.success).toBe(true); // Falls back to in-memory
      expect(mockRedis).toHaveBeenCalled();
    });
  });

  describe('Redis Rate Limiting', () => {
    it('should use Redis-based limiter when available', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://fake-url.com';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'fake-token';

      mockLimit.mockResolvedValue({
        success: true,
        limit: 10,
        remaining: 9,
        reset: 123456789,
      });

      clearRedisClient();
      const limiter = rateLimit({ max: 10, windowMs: 1000 });
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '1.2.3.4' },
      });

      const result = await limiter(request);
      expect(result.success).toBe(true);
      expect(result.remaining).toBe(9);
      expect(result.resetTime).toBe(123456789);
      expect(mockLimit).toHaveBeenCalledWith('1.2.3.4');
    });

    it('should fall back to in-memory when Redis limit check fails', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://fake-url.com';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'fake-token';

      mockLimit.mockRejectedValue(new Error('Redis limit error'));

      clearRedisClient();
      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '1.1.1.1' },
      });

      // First call fails Redis, uses in-memory (success)
      const result1 = await limiter(request);
      expect(result1.success).toBe(true);

      // Second call fails Redis, uses in-memory (fails because limit was 1)
      const result2 = await limiter(request);
      expect(result2.success).toBe(false);
    });

    it('should fall back to in-memory with custom key generator when Redis limit check fails', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://fake-url.com';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'fake-token';

      mockLimit.mockRejectedValue(new Error('Redis limit error'));
      const keyGenerator = jest.fn().mockReturnValue('custom-key-error');

      clearRedisClient();
      const limiter = rateLimit({ max: 1, windowMs: 1000, keyGenerator });
      const request = new Request('http://localhost');

      const result = await limiter(request);
      expect(result.success).toBe(true);
      expect(rateLimitStore.has('custom-key-error')).toBe(true);
      expect(keyGenerator).toHaveBeenCalled();
    });
  });

  describe('getClientIP', () => {
    it('should validate x-forwarded-for IP', async () => {
      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': 'not-an-ip, 1.1.1.1' },
      });

      await limiter(request);
      expect(rateLimitStore.has('unknown')).toBe(true);
    });

    it('should use valid x-forwarded-for IP', async () => {
      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '2.2.2.2, 1.1.1.1' },
      });

      await limiter(request);
      expect(rateLimitStore.has('2.2.2.2')).toBe(true);
    });

    it('should validate and use x-real-ip', async () => {
      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      const request = new Request('http://localhost', {
        headers: { 'x-real-ip': '3.3.3.3' },
      });

      await limiter(request);
      expect(rateLimitStore.has('3.3.3.3')).toBe(true);
    });

    it('should validate and use cf-connecting-ip', async () => {
      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      const request = new Request('http://localhost', {
        headers: { 'cf-connecting-ip': '4.4.4.4' },
      });

      await limiter(request);
      expect(rateLimitStore.has('4.4.4.4')).toBe(true);
    });

    it('should fall back to unknown for invalid IPs in all headers', async () => {
      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      const request = new Request('http://localhost', {
        headers: {
          'x-forwarded-for': 'invalid',
          'x-real-ip': 'invalid',
          'cf-connecting-ip': 'invalid',
        },
      });

      await limiter(request);
      expect(rateLimitStore.has('unknown')).toBe(true);
    });
  });

  describe('rateLimiters reset', () => {
    it('should re-initialize limiters on clearRateLimiters', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://fake-url.com';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'fake-token';

      clearRedisClient();
      mockRatelimit.mockClear();

      clearRateLimiters();
      expect(mockRatelimit).toHaveBeenCalled();
    });
  });

  describe('custom key generator', () => {
    it('should use provided key generator', async () => {
      const keyGenerator = jest.fn().mockReturnValue('custom-key');
      const limiter = rateLimit({ max: 5, windowMs: 1000, keyGenerator });
      const request = new Request('http://localhost');

      await limiter(request);
      expect(keyGenerator).toHaveBeenCalledWith(request);
      expect(rateLimitStore.has('custom-key')).toBe(true);
    });
  });

  describe('Edge cases from original tests', () => {
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
      expect((await limiter(request1)).success).toBe(false);

      // Second IP should have its own limit
      const result2a = await limiter(request2);
      expect(result2a.success).toBe(true);
      expect(result2a.remaining).toBe(1);
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
  });
});
