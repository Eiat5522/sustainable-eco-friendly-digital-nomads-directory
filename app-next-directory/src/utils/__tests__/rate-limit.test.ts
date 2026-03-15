/**
 * @jest-environment node
 */

import { afterEach, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';

// Define mocks before importing the module
const mockRedis = jest.fn().mockImplementation(() => ({}));
const mockRatelimitLimit = jest.fn();
const mockRatelimit = jest.fn().mockImplementation(() => ({
  limit: mockRatelimitLimit,
}));
(mockRatelimit as any).slidingWindow = jest.fn();

jest.mock('@upstash/redis', () => ({
  Redis: mockRedis,
}));

jest.mock('@upstash/ratelimit', () => ({
  Ratelimit: mockRatelimit,
}));

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
    // Ensure Redis is not initialized by default during tests
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.DISABLE_UPSTASH_DURING_BUILD;
  });

  beforeEach(() => {
    // Reset the internal redis singleton and clear the store
    clearRedisClient();
    rateLimitStore.clear();
    // Reset mocks
    jest.clearAllMocks();
    // Restore env for each test
    process.env = { ...originalEnv };
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.DISABLE_UPSTASH_DURING_BUILD;

    mockRatelimitLimit.mockReset();
    mockRedis.mockReset();
    mockRatelimit.mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
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
      const result1a = await limiter(request1);
      expect(result1a.success).toBe(true);
      const result1b = await limiter(request1);
      expect(result1b.success).toBe(true);

      // Second IP should have its own limit
      const result2a = await limiter(request2);
      expect(result2a.success).toBe(true);
      expect(result2a.remaining).toBe(1);
    });
  });

  describe('getClientIP headers extraction', () => {
    it('should use x-forwarded-for header for IP', async () => {
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
  });

  describe('rateLimitStore and cleanup', () => {
    it('cleanupRateLimitStore should remove expired entries', () => {
      const now = Date.now();
      rateLimitStore.set('expired', { count: 5, resetTime: now - 1000 });
      rateLimitStore.set('valid', { count: 5, resetTime: now + 1000 });

      cleanupRateLimitStore();

      expect(rateLimitStore.has('expired')).toBe(false);
      expect(rateLimitStore.has('valid')).toBe(true);
    });

    it('should store and retrieve info from rateLimitStore', async () => {
      const limiter = rateLimit({ max: 5, windowMs: 1000 });
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '1.2.3.4' },
      });

      await limiter(request);
      expect(rateLimitStore.has('1.2.3.4')).toBe(true);
      expect(rateLimitStore.get('1.2.3.4')?.count).toBe(1);
    });
  });

  describe('Redis initialization and usage', () => {
    it('should initialize Redis when credentials are provided', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://fake-redis.upstash.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'fake-token';

      const limiter = rateLimit({ max: 10, windowMs: 1000 });
      const request = new Request('http://localhost');
      await limiter(request);

      expect(mockRedis).toHaveBeenCalledWith({
        url: 'https://fake-redis.upstash.io',
        token: 'fake-token',
      });
      expect(mockRatelimit).toHaveBeenCalled();
    });

    it('should use Redis limiter when Redis is available', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://fake-redis.upstash.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'fake-token';

      mockRatelimitLimit.mockResolvedValue({
        success: true,
        limit: 10,
        remaining: 9,
        reset: 123456789,
      });

      const limiter = rateLimit({ max: 10, windowMs: 1000 });
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '8.8.8.8' },
      });

      const result = await limiter(request);

      expect(mockRatelimitLimit).toHaveBeenCalledWith('8.8.8.8');
      expect(result).toEqual({
        success: true,
        limit: 10,
        remaining: 9,
        resetTime: 123456789,
      });
    });

    it('should fall back to in-memory if Redis limiter throws', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://fake-redis.upstash.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'fake-token';

      mockRatelimitLimit.mockRejectedValue(new Error('Redis Down'));

      const limiter = rateLimit({ max: 10, windowMs: 1000 });
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '9.9.9.9' },
      });

      const result = await limiter(request);

      expect(mockRatelimitLimit).toHaveBeenCalled();
      expect(result.success).toBe(true); // Should succeed via in-memory fallback
      expect(rateLimitStore.has('9.9.9.9')).toBe(true);
    });

    it('should not initialize Redis if DISABLE_UPSTASH_DURING_BUILD is set', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://fake-redis.upstash.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'fake-token';
      process.env.DISABLE_UPSTASH_DURING_BUILD = '1';

      const limiter = rateLimit({ max: 10, windowMs: 1000 });
      const request = new Request('http://localhost');
      await limiter(request);

      expect(mockRedis).not.toHaveBeenCalled();
    });

    it('should handle Redis constructor error', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://fake-redis.upstash.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'fake-token';

      mockRedis.mockImplementationOnce(() => {
        throw new Error('Constructor Error');
      });

      const limiter = rateLimit({ max: 10, windowMs: 1000 });
      const request = new Request('http://localhost');
      const result = await limiter(request);

      expect(result.success).toBe(true);
    });
  });

  describe('Predefined limiters', () => {
    it('should have functional predefined limiters', async () => {
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '1.1.1.1' },
      });

      const contactResult = await rateLimiters.contactForm(request);
      expect(contactResult.limit).toBe(5);

      const apiResult = await rateLimiters.apiGeneral(request);
      expect(apiResult.limit).toBe(100);

      const searchResult = await rateLimiters.search(request);
      expect(searchResult.limit).toBe(50);
    });
  });

  describe('Edge cases', () => {
    it('should handle custom key generator', async () => {
      const limiter = rateLimit({
        max: 5,
        windowMs: 1000,
        keyGenerator: req => req.headers.get('x-user-id') || 'anon',
      });

      const req1 = new Request('http://localhost', { headers: { 'x-user-id': 'user1' } });
      const req2 = new Request('http://localhost', { headers: { 'x-user-id': 'user2' } });

      await limiter(req1);
      expect(rateLimitStore.has('user1')).toBe(true);
      expect(rateLimitStore.has('user2')).toBe(false);

      await limiter(req2);
      expect(rateLimitStore.has('user2')).toBe(true);
    });
  });
});
