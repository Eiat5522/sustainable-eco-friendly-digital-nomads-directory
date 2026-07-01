/**
 * @jest-environment node
 */

import { afterEach, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import {
  rateLimit,
  rateLimiters,
  rateLimitStore,
  resetRedisClient,
  cleanupRateLimitStore
} from '../rate-limit';

jest.unmock('../rate-limit');

// Mock Upstash Redis
const mockIncr = jest.fn<() => Promise<number>>();
const mockGet = jest.fn<() => Promise<any>>();
const mockSet = jest.fn<() => Promise<string>>();

jest.mock('@upstash/redis', () => {
  return {
    Redis: jest.fn().mockImplementation(() => ({
      incr: mockIncr,
      get: mockGet,
      set: mockSet,
    })),
  };
});

// Mock Upstash Ratelimit
const mockLimit = jest.fn<() => Promise<any>>();
const mockSlidingWindow = jest.fn<() => any>();

jest.mock('@upstash/ratelimit', () => {
  return {
    Ratelimit: jest.fn().mockImplementation(() => ({
      limit: mockLimit,
    })),
  };
});

// Accessing static methods on mocked class
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

(Ratelimit as any).slidingWindow = mockSlidingWindow;

describe('rate-limit', () => {
  // Store original env vars
  const originalEnv = { ...process.env };

  beforeAll(() => {
    // Ensure Redis is not initialized during tests initially
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.DISABLE_UPSTASH_DURING_BUILD;
  });

  beforeEach(() => {
    // Reset internal state of the module
    resetRedisClient();
    rateLimitStore.clear();

    // Clear all mocks
    jest.clearAllMocks();

    // Default mock implementations for Redis/Ratelimit tests
    mockLimit.mockResolvedValue({
      success: true,
      limit: 10,
      remaining: 9,
      reset: Date.now() + 60000,
    });
  });

  afterEach(() => {
    // Restore env vars
    process.env = { ...originalEnv };
  });

  describe('rateLimit - In-memory', () => {
    it('should allow requests within the limit', async () => {
      // Ensure Redis is NOT initialized
      delete process.env.UPSTASH_REDIS_REST_URL;
      delete process.env.UPSTASH_REDIS_REST_TOKEN;
      resetRedisClient();

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
      delete process.env.UPSTASH_REDIS_REST_URL;
      delete process.env.UPSTASH_REDIS_REST_TOKEN;
      resetRedisClient();

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
      delete process.env.UPSTASH_REDIS_REST_URL;
      delete process.env.UPSTASH_REDIS_REST_TOKEN;
      resetRedisClient();

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
      delete process.env.UPSTASH_REDIS_REST_URL;
      delete process.env.UPSTASH_REDIS_REST_TOKEN;
      resetRedisClient();

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

    it('should use custom key generator with in-memory fallback', async () => {
      delete process.env.UPSTASH_REDIS_REST_URL;
      delete process.env.UPSTASH_REDIS_REST_TOKEN;
      resetRedisClient();

      const limiter = rateLimit({
        max: 1,
        windowMs: 1000,
        keyGenerator: () => 'in-memory-custom-key',
      });
      const request = new Request('http://localhost');

      await limiter(request);
      expect(rateLimitStore.has('in-memory-custom-key')).toBe(true);
    });
  });

  describe('getClientIP', () => {
    it.each([
      ['x-forwarded-for', '192.168.1.1, 10.0.0.1', '192.168.1.1'],
      ['x-real-ip', '192.168.1.1', '192.168.1.1'],
      ['cf-connecting-ip', '192.168.1.1', '192.168.1.1'],
    ])('should use %s header for IP', async (headerName, headerValue, expectedIp) => {
      delete process.env.UPSTASH_REDIS_REST_URL;
      delete process.env.UPSTASH_REDIS_REST_TOKEN;
      resetRedisClient();

      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      const request = new Request('http://localhost', {
        headers: { [headerName]: headerValue },
      });

      const result = await limiter(request);
      expect(result.success).toBe(true);

      // Check that it's limited based on the expected IP
      expect(rateLimitStore.has(expectedIp)).toBe(true);
    });

    it('should use "unknown" as fallback if no IP headers present', async () => {
      delete process.env.UPSTASH_REDIS_REST_URL;
      delete process.env.UPSTASH_REDIS_REST_TOKEN;
      resetRedisClient();

      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      const request = new Request('http://localhost');

      await limiter(request);
      expect(rateLimitStore.has('unknown')).toBe(true);
    });

    it('should use "unknown" if IP header is invalid', async () => {
      delete process.env.UPSTASH_REDIS_REST_URL;
      delete process.env.UPSTASH_REDIS_REST_TOKEN;
      resetRedisClient();

      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': 'invalid-ip' },
      });

      await limiter(request);
      expect(rateLimitStore.has('unknown')).toBe(true);
    });

    it('should use request.ip if present and valid', async () => {
      delete process.env.UPSTASH_REDIS_REST_URL;
      delete process.env.UPSTASH_REDIS_REST_TOKEN;
      resetRedisClient();

      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      const request = new Request('http://localhost') as Request & { ip: string };
      request.ip = '10.10.10.10';

      await limiter(request);
      expect(rateLimitStore.has('10.10.10.10')).toBe(true);
    });
  });

  describe('Redis-based rate limiting', () => {
    beforeEach(() => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://fake-redis.upstash.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'fake-token';
      resetRedisClient();
    });

    it('should initialize Redis and use Ratelimit', async () => {
      const limiter = rateLimit({ max: 10, windowMs: 60000 });
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '1.2.3.4' },
      });

      mockLimit.mockResolvedValue({
        success: true,
        limit: 10,
        remaining: 9,
        reset: 123456789,
      });

      const result = await limiter(request);

      expect(Redis).toHaveBeenCalledWith({
        url: 'https://fake-redis.upstash.io',
        token: 'fake-token',
      });
      expect(Ratelimit).toHaveBeenCalled();
      expect(mockLimit).toHaveBeenCalledWith('1.2.3.4');
      expect(result).toEqual({
        success: true,
        limit: 10,
        remaining: 9,
        resetTime: 123456789,
      });
    });

    it('should use custom key generator with Redis', async () => {
      const limiter = rateLimit({
        max: 10,
        windowMs: 60000,
        keyGenerator: () => 'custom-key',
      });
      const request = new Request('http://localhost');

      await limiter(request);

      expect(mockLimit).toHaveBeenCalledWith('custom-key');
    });

    it('should fallback to in-memory when Redis limit throws', async () => {
      mockLimit.mockRejectedValue(new Error('Redis connection error'));

      const limiter = rateLimit({ max: 2, windowMs: 60000 });
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '5.6.7.8' },
      });

      // First call (Redis fails, should use in-memory and succeed)
      const result1 = await limiter(request);
      expect(result1.success).toBe(true);
      expect(result1.remaining).toBe(1);

      // Second call
      const result2 = await limiter(request);
      expect(result2.success).toBe(true);
      expect(result2.remaining).toBe(0);

      // Third call
      const result3 = await limiter(request);
      expect(result3.success).toBe(false);
    });

    it('should skip Redis initialization if DISABLE_UPSTASH_DURING_BUILD is set', async () => {
      process.env.DISABLE_UPSTASH_DURING_BUILD = '1';
      resetRedisClient(); // Ensure we try to re-initialize

      const limiter = rateLimit({ max: 10, windowMs: 60000 });
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '1.1.1.1' },
      });

      await limiter(request);

      expect(Redis).not.toHaveBeenCalled();
      // Should work via in-memory
      expect(rateLimitStore.has('1.1.1.1')).toBe(true);
    });

    it('should handle Redis instantiation errors', async () => {
      (Redis as unknown as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Instantiation failed');
      });

      const limiter = rateLimit({ max: 10, windowMs: 60000 });
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '2.2.2.2' },
      });

      const result = await limiter(request);
      expect(result.success).toBe(true);
      expect(Redis).toHaveBeenCalled();
      // Should have fallen back to in-memory
      expect(rateLimitStore.has('2.2.2.2')).toBe(true);
    });

    it('should use custom key generator in catch block fallback', async () => {
      mockLimit.mockRejectedValue(new Error('Redis error'));

      const limiter = rateLimit({
        max: 1,
        windowMs: 1000,
        keyGenerator: () => 'catch-custom-key',
      });
      const request = new Request('http://localhost');

      await limiter(request);
      expect(rateLimitStore.has('catch-custom-key')).toBe(true);
    });
  });

  describe('Cleanup Logic', () => {
    it('should remove expired entries from the store', () => {
      const now = Date.now();
      rateLimitStore.set('expired', { count: 1, resetTime: now - 1000 });
      rateLimitStore.set('valid', { count: 1, resetTime: now + 1000 });

      cleanupRateLimitStore();

      expect(rateLimitStore.has('expired')).toBe(false);
      expect(rateLimitStore.has('valid')).toBe(true);
    });
  });

  describe('Predefined rate limiters', () => {
    it.each([
      ['contactForm'],
      ['apiGeneral'],
      ['search'],
    ])('should have %s limiter configured', (limiterName) => {
      expect((rateLimiters as any)[limiterName]).toBeDefined();
    });
  });
});
