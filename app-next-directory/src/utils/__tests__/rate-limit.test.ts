/**
 * @jest-environment node
 */

import { afterEach, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';

// Mock the redis module
jest.mock('@upstash/redis', () => ({
  Redis: jest.fn().mockImplementation(() => ({})),
}));

// Mock Upstash rate limit
const mockRatelimitLimit = jest.fn().mockResolvedValue({
  success: true,
  limit: 10,
  remaining: 9,
  reset: Date.now() + 1000,
});

const mockRatelimitInstance = {
  limit: mockRatelimitLimit,
};

const mockRatelimitConstructor = jest.fn(() => mockRatelimitInstance);
(mockRatelimitConstructor as any).slidingWindow = jest.fn().mockReturnValue({});

jest.mock('@upstash/ratelimit', () => ({
  __esModule: true,
  Ratelimit: (globalThis as any).mockRatelimitConstructor,
}));

(globalThis as any).mockRatelimitConstructor = mockRatelimitConstructor;

import {
  rateLimit,
  rateLimiters,
  rateLimitStore,
  clearRedisClient,
  cleanupRateLimitStore,
} from '../rate-limit';
import { getClientIPFromHeaders } from '../ip-utils';

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
    clearRedisClient();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    process.env = { ...originalEnv };
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.DISABLE_UPSTASH_DURING_BUILD;
  });

  describe('rateLimit', () => {
    it('should allow requests within the limit', async () => {
      const limiter = rateLimit({ max: 3, windowMs: 1000 });
      const request = createTestRequest('127.0.0.1');

      const r1 = await limiter(request);
      expect(r1.success).toBe(true);
      expect(r1.limit).toBe(3);
      expect(r1.remaining).toBe(2);

      const r2 = await limiter(request);
      expect(r2.success).toBe(true);
      expect(r2.remaining).toBe(1);

      const r3 = await limiter(request);
      expect(r3.success).toBe(true);
      expect(r3.remaining).toBe(0);
    });

    it('should block requests when limit is exceeded', async () => {
      const limiter = rateLimit({ max: 2, windowMs: 1000 });
      const request = createTestRequest('127.0.0.1');

      await limiter(request);
      await limiter(request);

      const result = await limiter(request);
      expect(result.success).toBe(false);
      expect(result.limit).toBe(2);
      expect(result.remaining).toBe(0);
    });

    it('should reset count after window expires', async () => {
      const limiter = rateLimit({ max: 2, windowMs: 100 });
      const request = createTestRequest('127.0.0.1');

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
      const req1 = createTestRequest('127.0.0.1');
      const req2 = createTestRequest('127.0.0.2');

      await limiter(req1);
      await limiter(req1);
      expect((await limiter(req1)).success).toBe(false);

      const res2 = await limiter(req2);
      expect(res2.success).toBe(true);
      expect(res2.remaining).toBe(1);
    });

    it('should use custom key generator if provided', async () => {
      const limiter = rateLimit({
        max: 1,
        windowMs: 1000,
        keyGenerator: req => new URL(req.url).searchParams.get('u') || 'anon',
      });

      expect((await limiter(new Request('http://localhost?u=a'))).success).toBe(true);
      expect((await limiter(new Request('http://localhost?u=b'))).success).toBe(true);
      expect((await limiter(new Request('http://localhost?u=a'))).success).toBe(false);
    });

    it('should return correct resetTime', async () => {
      const limiter = rateLimit({ max: 1, windowMs: 5000 });
      const start = Date.now();
      const res = await limiter(createTestRequest('1.1.1.1'));
      const end = Date.now();

      expect(res.resetTime).toBeGreaterThanOrEqual(start + 5000);
      expect(res.resetTime).toBeLessThanOrEqual(end + 5000);
    });
  });

  describe('rateLimiters definitions', () => {
    it('should have correctly configured limiters', async () => {
      const testCases = [
        { l: rateLimiters.contactForm, m: 5 },
        { l: rateLimiters.apiGeneral, m: 100 },
        { l: rateLimiters.search, m: 50 },
      ];

      for (const { l, m } of testCases) {
        expect(l).toBeDefined();
        const req = createTestRequest(`10.0.0.${m}`);
        for (let i = 0; i < m; i++) {
          expect((await l(req)).success).toBe(true);
        }
        expect((await l(req)).success).toBe(false);
      }
    });
  });

  describe('rateLimitStore operations', () => {
    it('should handle manual cleanup', async () => {
      const limiter = rateLimit({ max: 1, windowMs: 50 });
      const req = createTestRequest('192.168.1.1');

      await limiter(req);
      expect(rateLimitStore.size).toBeGreaterThan(0);

      const entry = rateLimitStore.get('192.168.1.1');
      if (entry) {
        rateLimitStore.set('192.168.1.1', { ...entry, resetTime: Date.now() - 1000 });
      }

      cleanupRateLimitStore();
      expect(rateLimitStore.has('192.168.1.1')).toBe(false);
    });
  });

  describe('Redis initialization scenarios', () => {
    const setCreds = () => {
      process.env.UPSTASH_REDIS_REST_URL = 'http://fake';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'token';
    };

    it('should skip Redis when DISABLE_UPSTASH_DURING_BUILD is set', async () => {
      setCreds();
      process.env.DISABLE_UPSTASH_DURING_BUILD = '1';
      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      await limiter(createTestRequest('1.1.1.1'));
      expect(rateLimitStore.has('1.1.1.1')).toBe(true);
    });

    it('should use Redis when credentials are provided', async () => {
      setCreds();
      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      await limiter(createTestRequest('2.2.2.2'));
      expect(rateLimitStore.has('2.2.2.2')).toBe(false);
    });

    it('should fallback to in-memory on Redis init failure', async () => {
      setCreds();
      const { Redis } = require('@upstash/redis');
      (Redis as jest.Mock).mockImplementationOnce(() => { throw new Error('fail'); });
      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      await limiter(createTestRequest('3.3.3.3'));
      expect(rateLimitStore.has('3.3.3.3')).toBe(true);
    });

    it('should fallback to in-memory if Redis execution throws', async () => {
      setCreds();
      mockRatelimitLimit.mockRejectedValueOnce(new Error('exec fail'));
      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      await limiter(createTestRequest('4.4.4.4'));
      expect(rateLimitStore.has('4.4.4.4')).toBe(true);
    });
  });

  describe('getClientIPFromHeaders utility', () => {
    const check = (h: Record<string, string | string[]>, e: string) => {
      expect(getClientIPFromHeaders(new Headers(h as any))).toBe(e);
    };

    it('should extract valid IPs from various headers', () => {
      check({ 'x-forwarded-for': '1.2.3.4' }, '1.2.3.4');
      check({ 'x-forwarded-for': 'invalid, 5.6.7.8, 9.9.9.9' }, '5.6.7.8');
      check({ 'x-real-ip': '10.10.10.10' }, '10.10.10.10');
      check({ 'cf-connecting-ip': '11.11.11.11' }, '11.11.11.11');
      check({}, 'unknown');
    });

    it('should validate IPs and ignore malformed ones', () => {
      check({ 'x-forwarded-for': 'malformed', 'x-real-ip': '20.20.20.20' }, '20.20.20.20');
      check({ 'x-real-ip': 'not-ip', 'cf-connecting-ip': '30.30.30.30' }, '30.30.30.30');
    });

    it('should handle different collection types', () => {
      expect(getClientIPFromHeaders(new Map([['x-real-ip', '1.1.1.1']]))).toBe('1.1.1.1');
      const obj = { 'x-forwarded-for': '2.2.2.2' };
      expect(getClientIPFromHeaders(obj as any)).toBe('2.2.2.2');
    });

    it('should handle edge cases like missing headers or erroring getters', () => {
      expect(getClientIPFromHeaders(undefined)).toBe('unknown');
      const bad = { get: () => { throw new Error(); } };
      expect(getClientIPFromHeaders(bad as any)).toBe('unknown');
    });
  });
});
