/**
 * @jest-environment node
 */

import { afterEach, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import {
  cleanupRateLimitStore,
  rateLimit,
  rateLimiters,
  rateLimitStore,
  resetRedisClient,
} from '../rate-limit';

// Mock Redis and Ratelimit
const mockRedis = {
  get: jest.fn(),
  set: jest.fn(),
};

const mockRatelimit = {
  limit: jest.fn(),
};

jest.mock('@upstash/redis', () => ({
  Redis: jest.fn().mockImplementation(() => mockRedis),
}));

jest.mock('@upstash/ratelimit', () => ({
  Ratelimit: jest.fn().mockImplementation(() => mockRatelimit),
}));

// Add static methods to mockRatelimit
(mockRatelimit as any).slidingWindow = jest.fn();

// Re-apply to the class mock as well
const { Ratelimit } = require('@upstash/ratelimit');
Ratelimit.slidingWindow = jest.fn();

// Helper function to reduce code duplication
function createTestRequest(ip: string): Request {
  return new Request('http://localhost', {
    headers: { 'x-forwarded-for': ip },
  });
}

describe('rate-limit', () => {
  const originalEnv = { ...process.env };

  beforeAll(() => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  beforeEach(() => {
    rateLimitStore.clear();
    resetRedisClient();
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    process.env = { ...originalEnv };
  });

  describe('rateLimit - basic functionality', () => {
    it('should allow requests within the limit and block when exceeded', async () => {
      const limiter = rateLimit({ max: 2, windowMs: 1000 });
      const request = createTestRequest('127.0.0.1');

      const r1 = await limiter(request);
      expect(r1.success).toBe(true);
      expect(r1.remaining).toBe(1);

      const r2 = await limiter(request);
      expect(r2.success).toBe(true);
      expect(r2.remaining).toBe(0);

      const r3 = await limiter(request);
      expect(r3.success).toBe(false);
    });

    it('should reset count after window expires', async () => {
      const limiter = rateLimit({ max: 1, windowMs: 100 });
      const request = createTestRequest('127.0.0.1');

      await limiter(request);
      expect((await limiter(request)).success).toBe(false);

      rateLimitStore.clear();
      expect((await limiter(request)).success).toBe(true);
    });

    it('should track different IPs separately', async () => {
      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      expect((await limiter(createTestRequest('1.1.1.1'))).success).toBe(true);
      expect((await limiter(createTestRequest('2.2.2.2'))).success).toBe(true);
      expect((await limiter(createTestRequest('1.1.1.1'))).success).toBe(false);
    });

    it('should use custom key generator', async () => {
      const limiter = rateLimit({
        max: 1,
        windowMs: 1000,
        keyGenerator: req => new URL(req.url).searchParams.get('k') || 'anon',
      });

      expect((await limiter(new Request('http://l?k=a'))).success).toBe(true);
      expect((await limiter(new Request('http://l?k=b'))).success).toBe(true);
      expect((await limiter(new Request('http://l?k=a'))).success).toBe(false);
    });
  });

  describe('predefined rateLimiters', () => {
    const cases = [
      { name: 'contactForm', limiter: rateLimiters.contactForm, max: 5 },
      { name: 'apiGeneral', limiter: rateLimiters.apiGeneral, max: 100 },
      { name: 'search', limiter: rateLimiters.search, max: 50 },
    ];

    it.each(cases)('$name should enforce $max requests limit', async ({ limiter, max }) => {
      const request = createTestRequest(`10.0.0.${max}`);
      for (let i = 0; i < max; i++) {
        expect((await limiter(request)).success).toBe(true);
      }
      expect((await limiter(request)).success).toBe(false);
    });
  });

  describe('Redis initialization scenarios', () => {
    it('should skip Redis when credentials missing', () => {
      delete process.env.UPSTASH_REDIS_REST_URL;
      rateLimit({ max: 1, windowMs: 1000 });
      const { Redis } = require('@upstash/redis');
      expect(Redis).not.toHaveBeenCalled();
    });

    it('should initialize and reuse Redis client', () => {
      process.env.UPSTASH_REDIS_REST_URL = 'http://test';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'token';
      rateLimit({ max: 1, windowMs: 1000 });
      rateLimit({ max: 1, windowMs: 1000 });
      const { Redis } = require('@upstash/redis');
      expect(Redis).toHaveBeenCalledTimes(1);
    });

    it('should skip Redis if DISABLE_UPSTASH_DURING_BUILD is set', () => {
      process.env.UPSTASH_REDIS_REST_URL = 'http://test';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'token';
      process.env.DISABLE_UPSTASH_DURING_BUILD = '1';
      rateLimit({ max: 1, windowMs: 1000 });
      const { Redis } = require('@upstash/redis');
      expect(Redis).not.toHaveBeenCalled();
    });
  });

  describe('Redis-based limiting', () => {
    beforeEach(() => {
      process.env.UPSTASH_REDIS_REST_URL = 'http://test';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'token';
    });

    it('should use Redis limiter and fallback on error', async () => {
      mockRatelimit.limit.mockResolvedValueOnce({ success: true, limit: 5, remaining: 4, reset: 123 });
      const limiter = rateLimit({ max: 5, windowMs: 1000 });
      const result = await limiter(createTestRequest('1.2.3.4'));
      expect(result.remaining).toBe(4);

      mockRatelimit.limit.mockRejectedValueOnce(new Error('fail'));
      const fallbackResult = await limiter(createTestRequest('1.2.3.4'));
      expect(fallbackResult.success).toBe(true); // From in-memory
    });
  });

  describe('Edge cases and cleanup', () => {
    it('should cleanup expired entries', () => {
      rateLimitStore.set('old', { count: 1, resetTime: Date.now() - 1000 });
      rateLimitStore.set('new', { count: 1, resetTime: Date.now() + 1000 });
      cleanupRateLimitStore();
      expect(rateLimitStore.has('old')).toBe(false);
      expect(rateLimitStore.has('new')).toBe(true);
    });

    it('should handle various IP headers correctly via centralized utility', async () => {
      const limiter = rateLimit({ max: 1, windowMs: 1000 });

      const cases = [
        { headers: { 'x-forwarded-for': '1.1.1.1, 2.2.2.2' }, expected: '1.1.1.1' },
        { headers: { 'x-real-ip': '3.3.3.3' }, expected: '3.3.3.3' },
        { headers: { 'cf-connecting-ip': '4.4.4.4' }, expected: '4.4.4.4' },
        { headers: { 'x-forwarded-for': 'invalid', 'x-real-ip': '5.5.5.5' }, expected: '5.5.5.5' },
        { headers: {}, expected: 'unknown' },
      ];

      for (const { headers, expected } of cases) {
        rateLimitStore.clear();
        const req = new Request('http://l', { headers: headers as any });
        await limiter(req);
        expect(rateLimitStore.has(expected)).toBe(true);
      }
    });
  });
});
