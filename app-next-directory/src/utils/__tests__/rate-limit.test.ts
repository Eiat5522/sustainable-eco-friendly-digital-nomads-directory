/**
 * @jest-environment node
 */

import { afterEach, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { cleanupRateLimitStore, clearRedisClient, rateLimit, rateLimiters, rateLimitStore } from '../rate-limit';

// Mock Upstash Redis
jest.mock('@upstash/redis', () => {
  return {
    Redis: jest.fn().mockImplementation(() => ({
      // Mock methods as needed
    })),
  };
});

// Mock Upstash Ratelimit
jest.mock('@upstash/ratelimit', () => {
  const slidingWindow = jest.fn().mockReturnValue('sliding-window');
  const RatelimitMock = jest.fn().mockImplementation(() => ({
    limit: jest.fn(),
  }));

  // Attach slidingWindow to the constructor mock
  (RatelimitMock as any).slidingWindow = slidingWindow;

  return {
    Ratelimit: RatelimitMock,
    slidingWindow,
  };
});

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
    // Ensure credentials are gone before clearing client to trigger fresh init attempt
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.DISABLE_UPSTASH_DURING_BUILD;
    clearRedisClient();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    // Restore env vars
    process.env = { ...originalEnv };
  });

  describe('rateLimit', () => {
    it.each([
      ['within limit', 3, 1000, true, 3, 2],
      ['exceeded limit', 2, 1000, false, 2, 0],
    ])('should handle %s (in-memory)', async (_, max, windowMs, expectedSuccess, expectedLimit, expectedRemaining) => {
      const limiter = rateLimit({ max, windowMs });
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '127.0.0.1' },
      });

      if (!expectedSuccess) {
        await limiter(request);
        await limiter(request);
      }

      const result = await limiter(request);
      expect(result.success).toBe(expectedSuccess);
      expect(result.limit).toBe(expectedLimit);
      expect(result.remaining).toBe(expectedRemaining);
    });

    it('should reset count after window expires (in-memory)', async () => {
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
      const limiter = rateLimit({ max: 2, windowMs: 1000 });
      const request1 = new Request('http://localhost', { headers: { 'x-forwarded-for': '127.0.0.1' } });
      const request2 = new Request('http://localhost', { headers: { 'x-forwarded-for': '127.0.0.2' } });

      await limiter(request1);
      await limiter(request1);

      const result2a = await limiter(request2);
      expect(result2a.success).toBe(true);
      expect(result2a.remaining).toBe(1);
    });

    it.each([
      ['x-forwarded-for', { 'x-forwarded-for': '192.168.1.1, 10.0.0.1' }, '192.168.1.1'],
      ['x-real-ip', { 'x-real-ip': '192.168.1.1' }, '192.168.1.1'],
      ['cf-connecting-ip', { 'cf-connecting-ip': '192.168.1.1' }, '192.168.1.1'],
      ['unknown fallback', {}, 'unknown'],
      ['invalid IP fallback', { 'x-forwarded-for': 'invalid-ip' }, 'unknown'],
    ])('should use %s header for IP', async (_, headers, expectedIp) => {
      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      const request = new Request('http://localhost', { headers });

      await limiter(request);
      expect(rateLimitStore.has(expectedIp)).toBe(true);
    });

    it('should use custom key generator if provided', async () => {
      const limiter = rateLimit({
        max: 1,
        windowMs: 1000,
        keyGenerator: req => new URL(req.url).searchParams.get('userId') || 'anonymous',
      });

      expect((await limiter(new Request('http://localhost?userId=user1'))).success).toBe(true);
      expect((await limiter(new Request('http://localhost?userId=user2'))).success).toBe(true);
      expect((await limiter(new Request('http://localhost?userId=user1'))).success).toBe(false);
    });

    it('should return correct resetTime', async () => {
      const windowMs = 5000;
      const limiter = rateLimit({ max: 1, windowMs });
      const request = new Request('http://localhost', { headers: { 'x-forwarded-for': '127.0.0.1' } });

      const before = Date.now();
      const result = await limiter(request);
      const after = Date.now();

      expect(result.resetTime).toBeGreaterThanOrEqual(before + windowMs);
      expect(result.resetTime).toBeLessThanOrEqual(after + windowMs);
    });

    it('should use Redis when credentials are provided', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://fake-url.com';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'fake-token';
      clearRedisClient();

      const mockLimit = jest.fn().mockResolvedValue({ success: true, limit: 5, remaining: 4, reset: 123456789 } as any);
      (Ratelimit as unknown as jest.Mock).mockImplementation(() => ({ limit: mockLimit }));

      const limiter = rateLimit({ max: 5, windowMs: 1000 });
      const result = await limiter(new Request('http://localhost', { headers: { 'x-forwarded-for': '1.2.3.4' } }));

      expect(Redis).toHaveBeenCalledWith({ url: 'https://fake-url.com', token: 'fake-token' });
      expect(result).toEqual({ success: true, limit: 5, remaining: 4, resetTime: 123456789 });
    });

    it('should fallback to in-memory if Redis throws an error', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://fake-url.com';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'fake-token';
      clearRedisClient();

      const mockLimit = jest.fn().mockRejectedValue(new Error('Redis is down'));
      (Ratelimit as unknown as jest.Mock).mockImplementation(() => ({ limit: mockLimit }));

      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      const request = new Request('http://localhost', { headers: { 'x-forwarded-for': '5.6.7.8' } });

      expect((await limiter(request)).success).toBe(true);
      expect((await limiter(request)).success).toBe(false);
    });

    it.each([
      ['DISABLE_UPSTASH_DURING_BUILD', { DISABLE_UPSTASH_DURING_BUILD: '1' }],
      ['missing credentials', {}],
    ])('should skip Redis if %s', async (_, env) => {
      Object.assign(process.env, env);
      clearRedisClient();
      const limiter = rateLimit({ max: 5, windowMs: 1000 });
      await limiter(new Request('http://localhost'));
      expect(Redis).not.toHaveBeenCalled();
    });

    it('should handle Redis constructor throwing error', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://fake-url.com';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'fake-token';
      clearRedisClient();
      (Redis as unknown as jest.Mock).mockImplementationOnce(() => { throw new Error('Bad Redis config'); });

      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      const request = new Request('http://localhost', { headers: { 'x-forwarded-for': '9.9.9.9' } });

      expect((await limiter(request)).success).toBe(true);
      expect((await limiter(request)).success).toBe(false);
    });
  });

  describe('rateLimiters', () => {
    it.each(['contactForm', 'apiGeneral', 'search'])('should have %s limiter configured', (key) => {
      expect(rateLimiters[key as keyof typeof rateLimiters]).toBeDefined();
    });
  });

  describe('cleanupRateLimitStore', () => {
    it('should cleanup expired entries', async () => {
      rateLimitStore.set('expired-key', { count: 5, resetTime: Date.now() - 1000 });
      rateLimitStore.set('active-key', { count: 1, resetTime: Date.now() + 10000 });

      cleanupRateLimitStore();

      expect(rateLimitStore.has('expired-key')).toBe(false);
      expect(rateLimitStore.has('active-key')).toBe(true);
    });
  });

  describe('getClientIP edge cases', () => {
    it('should handle x-forwarded-for with spaces and multiple IPs', async () => {
       const limiter = rateLimit({ max: 1, windowMs: 1000 });
       await limiter(new Request('http://localhost', { headers: { 'x-forwarded-for': '  1.2.3.4  , 5.6.7.8' } }));
       expect(rateLimitStore.has('1.2.3.4')).toBe(true);
    });

    it('should handle x-forwarded-for with empty first entry', async () => {
       const limiter = rateLimit({ max: 1, windowMs: 1000 });
       await limiter(new Request('http://localhost', { headers: { 'x-forwarded-for': ', 5.6.7.8' } }));
       expect(rateLimitStore.has('unknown')).toBe(true);
    });
  });
});
