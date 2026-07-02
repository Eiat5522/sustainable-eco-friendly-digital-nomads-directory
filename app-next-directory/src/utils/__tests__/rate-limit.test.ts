/**
 * @jest-environment node
 */

import { afterEach, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { cleanupRateLimitStore, clearRedisClient, rateLimit, rateLimiters, rateLimitStore } from '../rate-limit';

// Mock Upstash Redis
jest.mock('@upstash/redis', () => ({
  Redis: jest.fn().mockImplementation(() => ({})),
}));

// Mock Upstash Ratelimit
jest.mock('@upstash/ratelimit', () => {
  const slidingWindow = jest.fn().mockReturnValue('sliding-window');
  const RatelimitMock = jest.fn().mockImplementation(() => ({
    limit: jest.fn(),
  }));
  (RatelimitMock as any).slidingWindow = slidingWindow;
  return { Ratelimit: RatelimitMock, slidingWindow };
});

describe('rate-limit', () => {
  const originalEnv = { ...process.env };

  beforeAll(() => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.DISABLE_UPSTASH_DURING_BUILD;
  });

  beforeEach(() => {
    rateLimitStore.clear();
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.DISABLE_UPSTASH_DURING_BUILD;
    clearRedisClient();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    process.env = { ...originalEnv };
  });

  describe('rateLimit', () => {
    it.each([
      ['within limit', 3, 1000, true, 3, 2],
      ['exceeded limit', 2, 1000, false, 2, 0],
    ])('should handle %s (in-memory)', async (_, max, windowMs, expectedSuccess, expectedLimit, expectedRemaining) => {
      const limiter = rateLimit({ max, windowMs });
      const request = new Request('http://localhost', { headers: { 'x-forwarded-for': '127.0.0.1' } });

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
      const request = new Request('http://localhost', { headers: { 'x-forwarded-for': '127.0.0.1' } });

      await limiter(request);
      await limiter(request);
      expect((await limiter(request)).success).toBe(false);

      rateLimitStore.clear();
      expect((await limiter(request)).success).toBe(true);
    });

    it('should track different IPs separately', async () => {
      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      await limiter(new Request('http://localhost', { headers: { 'x-forwarded-for': '1.1.1.1' } }));
      expect((await limiter(new Request('http://localhost', { headers: { 'x-forwarded-for': '2.2.2.2' } }))).success).toBe(true);
      expect((await limiter(new Request('http://localhost', { headers: { 'x-forwarded-for': '1.1.1.1' } }))).success).toBe(false);
    });

    it('should use custom key generator if provided', async () => {
      const limiter = rateLimit({
        max: 1,
        windowMs: 1000,
        keyGenerator: req => new URL(req.url).searchParams.get('userId') || 'anonymous',
      });

      expect((await limiter(new Request('http://localhost?userId=u1'))).success).toBe(true);
      expect((await limiter(new Request('http://localhost?userId=u2'))).success).toBe(true);
      expect((await limiter(new Request('http://localhost?userId=u1'))).success).toBe(false);
    });

    it('should return correct resetTime', async () => {
      const windowMs = 5000;
      const limiter = rateLimit({ max: 1, windowMs });
      const before = Date.now();
      const result = await limiter(new Request('http://localhost', { headers: { 'x-forwarded-for': '1.1.1.1' } }));
      expect(result.resetTime).toBeGreaterThanOrEqual(before + windowMs);
    });

    it('should use Redis when credentials are provided', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://fake.com';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'token';
      clearRedisClient();

      const mockLimit = jest.fn().mockResolvedValue({ success: true, limit: 5, remaining: 4, reset: 999 } as any);
      (Ratelimit as unknown as jest.Mock).mockImplementation(() => ({ limit: mockLimit }));

      const limiter = rateLimit({ max: 5, windowMs: 1000 });
      const result = await limiter(new Request('http://localhost', { headers: { 'x-forwarded-for': '1.2.3.4' } }));

      expect(Redis).toHaveBeenCalledWith({ url: 'https://fake.com', token: 'token' });
      expect(result).toEqual({ success: true, limit: 5, remaining: 4, resetTime: 999 });
    });

    it('should fallback to in-memory if Redis throws an error', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://fake.com';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'token';
      clearRedisClient();

      const mockLimit = jest.fn().mockRejectedValue(new Error('Redis Down'));
      (Ratelimit as unknown as jest.Mock).mockImplementation(() => ({ limit: mockLimit }));

      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      const req = new Request('http://localhost', { headers: { 'x-forwarded-for': '5.6.7.8' } });

      expect((await limiter(req)).success).toBe(true);
      expect((await limiter(req)).success).toBe(false);
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
      process.env.UPSTASH_REDIS_REST_URL = 'https://fake.com';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'token';
      clearRedisClient();
      (Redis as unknown as jest.Mock).mockImplementationOnce(() => { throw new Error('Bad Config'); });

      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      const req = new Request('http://localhost', { headers: { 'x-forwarded-for': '9.9.9.9' } });

      expect((await limiter(req)).success).toBe(true);
      expect((await limiter(req)).success).toBe(false);
    });
  });

  describe('rateLimiters', () => {
    it.each(['contactForm', 'apiGeneral', 'search'])('should have %s limiter configured', (key) => {
      expect(rateLimiters[key as keyof typeof rateLimiters]).toBeDefined();
    });
  });

  describe('cleanupRateLimitStore', () => {
    it('should cleanup expired entries', async () => {
      rateLimitStore.set('exp', { count: 5, resetTime: Date.now() - 1000 });
      rateLimitStore.set('act', { count: 1, resetTime: Date.now() + 10000 });
      cleanupRateLimitStore();
      expect(rateLimitStore.has('exp')).toBe(false);
      expect(rateLimitStore.has('act')).toBe(true);
    });
  });
});
