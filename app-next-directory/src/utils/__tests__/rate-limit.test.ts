/**
 * @jest-environment node
 */

import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import {
  rateLimit,
  rateLimiters,
  rateLimitStore,
  clearRedisClient,
  cleanupRateLimitStore
} from '../rate-limit';
import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

// Mock Upstash
jest.mock('@upstash/redis');
jest.mock('@upstash/ratelimit');

describe('rate-limit', () => {
  // Store original env vars
  const originalEnv = { ...process.env };

  const createReq = (headers: Record<string, string> = {}) =>
    new Request('http://localhost', { headers });

  beforeEach(() => {
    rateLimitStore.clear();
    clearRedisClient();
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.DISABLE_UPSTASH_DURING_BUILD;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('In-memory Rate Limiting (Fallback)', () => {
    it('should handle request limit lifecycle', async () => {
      const limiter = rateLimit({ max: 2, windowMs: 1000 });
      const req = createReq({ 'x-forwarded-for': '1.1.1.1' });

      expect((await limiter(req)).remaining).toBe(1);
      expect((await limiter(req)).remaining).toBe(0);
      expect((await limiter(req)).success).toBe(false);
    });

    it('should use custom key generator', async () => {
      const limiter = rateLimit({
        max: 1,
        windowMs: 1000,
        keyGenerator: req => new URL(req.url).searchParams.get('id') || 'anon',
      });

      expect((await limiter(new Request('http://a?id=1'))).success).toBe(true);
      expect((await limiter(new Request('http://a?id=2'))).success).toBe(true);
      expect((await limiter(new Request('http://a?id=1'))).success).toBe(false);
    });
  });

  describe('IP Extraction', () => {
    const testIP = async (headers: Record<string, string>, expected: string) => {
      await rateLimit({ max: 1, windowMs: 1000 })(createReq(headers));
      expect(rateLimitStore.has(expected)).toBe(true);
    };

    it('should extract IP from various headers', async () => {
      await testIP({ 'x-forwarded-for': '1.2.3.4, 5.6.7.8' }, '1.2.3.4');
      await testIP({ 'x-real-ip': '9.8.7.6' }, '9.8.7.6');
      await testIP({ 'cf-connecting-ip': '4.3.2.1' }, '4.3.2.1');
      await testIP({}, 'unknown');
    });
  });

  describe('Redis Rate Limiting', () => {
    beforeEach(() => {
      process.env.UPSTASH_REDIS_REST_URL = 'http://mock';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'token';
    });

    it('should use Redis when available', async () => {
      const mockLimit = jest.fn().mockResolvedValue({ success: true, limit: 10, remaining: 5, reset: 999 });
      (Ratelimit as unknown as jest.Mock).mockImplementation(() => ({ limit: mockLimit }));

      const res = await rateLimit({ max: 10, windowMs: 60 })(createReq({ 'x-forwarded-for': '1.2' }));
      expect(res).toEqual({ success: true, limit: 10, remaining: 5, resetTime: 999 });
      expect(Redis).toHaveBeenCalled();
    });

    it('should fallback on Redis error or build mode', async () => {
      // Build mode
      process.env.DISABLE_UPSTASH_DURING_BUILD = '1';
      await rateLimit({ max: 1, windowMs: 60 })(createReq({ 'x-forwarded-for': 'b' }));
      expect(Redis).not.toHaveBeenCalled();
      expect(rateLimitStore.has('b')).toBe(true);

      // Redis throw
      delete process.env.DISABLE_UPSTASH_DURING_BUILD;
      clearRedisClient();
      (Redis as unknown as jest.Mock).mockImplementation(() => { throw new Error(); });
      await rateLimit({ max: 1, windowMs: 60 })(createReq({ 'x-forwarded-for': 't' }));
      expect(rateLimitStore.has('t')).toBe(true);
    });
  });

  describe('Maintenance', () => {
    it('should manage store and client lifecycle', () => {
      const now = Date.now();
      rateLimitStore.set('exp', { count: 1, resetTime: now - 1 });
      rateLimitStore.set('ok', { count: 1, resetTime: now + 999 });
      cleanupRateLimitStore();
      expect(rateLimitStore.has('exp')).toBe(false);
      expect(rateLimitStore.has('ok')).toBe(true);

      rateLimit({ max: 5, windowMs: 60 });
      expect(Redis).not.toHaveBeenCalled();
      process.env.UPSTASH_REDIS_REST_URL = 'http://mock';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'token';
      clearRedisClient();
      rateLimit({ max: 5, windowMs: 60 });
      expect(Redis).toHaveBeenCalled();
    });
  });

  it('should have working predefined limiters', async () => {
    const req = createReq({ 'x-forwarded-for': 'pre' });
    expect((await rateLimiters.contactForm(req)).success).toBe(true);
    expect((await rateLimiters.apiGeneral(req)).success).toBe(true);
    expect((await rateLimiters.search(req)).success).toBe(true);
  });
});
