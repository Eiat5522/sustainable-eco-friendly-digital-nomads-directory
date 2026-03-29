/**
 * @jest-environment node
 */

import { afterEach, beforeEach, describe, expect, it, jest, test } from '@jest/globals';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import {
  cleanupRateLimitStore,
  clearRedisClient,
  rateLimit,
  rateLimiters,
  rateLimitStore,
} from '../rate-limit';

jest.mock('@upstash/redis');
jest.mock('@upstash/ratelimit');

describe('rate-limit utility', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    rateLimitStore.clear();
    clearRedisClient();
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.DISABLE_UPSTASH_DURING_BUILD;

    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});

    (Ratelimit as any).slidingWindow = jest.fn();
    (Ratelimit as unknown as jest.Mock).mockImplementation(() => ({
      limit: jest.fn().mockResolvedValue({
        success: true,
        limit: 10,
        remaining: 9,
        reset: 1234567890,
      }),
    }));
  });

  afterEach(() => {
    jest.restoreAllMocks();
    process.env = { ...originalEnv };
  });

  describe('in-memory fallback', () => {
    it('should allow requests within the limit and return correct info', async () => {
      const limiter = rateLimit({ max: 2, windowMs: 1000 });
      const req = new Request('http://l', { headers: { 'x-forwarded-for': '1.1.1.1' } });

      const r1 = await limiter(req);
      expect(r1.success).toBe(true);
      expect(r1.limit).toBe(2);
      expect(r1.remaining).toBe(1);
      expect(r1.resetTime).toBeGreaterThan(Date.now());

      const r2 = await limiter(req);
      expect(r2.success).toBe(true);
      expect(r2.remaining).toBe(0);

      const r3 = await limiter(req);
      expect(r3.success).toBe(false);
      expect(r3.remaining).toBe(0);
    });

    it('should cleanup expired entries', async () => {
      const limiter = rateLimit({ max: 1, windowMs: -1 });
      await limiter(new Request('http://l', { headers: { 'x-forwarded-for': '1.1.1.1' } }));
      expect(rateLimitStore.size).toBe(1);
      cleanupRateLimitStore();
      expect(rateLimitStore.size).toBe(0);
    });

    it('should handle custom key generator', async () => {
      const limiter = rateLimit({
        max: 1,
        windowMs: 1000,
        keyGenerator: req => new URL(req.url).searchParams.get('u') || 'a',
      });
      expect((await limiter(new Request('http://l?u=1'))).success).toBe(true);
      expect((await limiter(new Request('http://l?u=2'))).success).toBe(true);
      expect((await limiter(new Request('http://l?u=1'))).success).toBe(false);
    });
  });

  describe('redis integration', () => {
    it('should use redis when credentials are provided', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'http://fake';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'token';
      const limiter = rateLimit({ max: 5, windowMs: 1000 });
      const res = await limiter(new Request('http://l', { headers: { 'x-forwarded-for': '1.1.1.1' } }));

      expect(Redis).toHaveBeenCalled();
      expect(Ratelimit).toHaveBeenCalled();
      expect(res.success).toBe(true);
      expect(res.resetTime).toBe(1234567890);
    });

    test.each([
      ['init fails', () => (Redis as any).mockImplementationOnce(() => { throw new Error(); })],
      ['call fails', () => (Ratelimit as any).mockImplementationOnce(() => ({ limit: jest.fn().mockRejectedValue(new Error()) }))]
    ])('should fallback on %s', async (_, setup) => {
      process.env.UPSTASH_REDIS_REST_URL = 'http://f';
      process.env.UPSTASH_REDIS_REST_TOKEN = 't';
      setup();
      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      const req = new Request('http://l', { headers: { 'x-forwarded-for': '1.1.1.1' } });
      expect((await limiter(req)).success).toBe(true);
      expect((await limiter(req)).success).toBe(false);
    });

    it('should skip redis during build', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'http://f';
      process.env.UPSTASH_REDIS_REST_TOKEN = 't';
      process.env.DISABLE_UPSTASH_DURING_BUILD = '1';
      await rateLimit({ max: 1, windowMs: 1000 })(new Request('http://l'));
      expect(Redis).not.toHaveBeenCalled();
    });
  });

  describe('IP extraction', () => {
    test.each([
      ['x-forwarded-for', { 'x-forwarded-for': '1.2.3.4, 5.6.7.8' }, '1.2.3.4'],
      ['x-real-ip', { 'x-real-ip': '2.3.4.5' }, '2.3.4.5'],
      ['cf-connecting-ip', { 'cf-connecting-ip': '3.4.5.6' }, '3.4.5.6'],
      ['invalid ip', { 'x-forwarded-for': 'not-an-ip' }, 'unknown'],
      ['none', {}, 'unknown']
    ])('should handle %s', async (_, headers, expected) => {
      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      await limiter(new Request('http://l', { headers }));
      expect(rateLimitStore.has(expected)).toBe(true);
    });
  });

  describe('predefined limiters', () => {
    it('should have all limiters defined and functional', async () => {
      const req = new Request('http://l', { headers: { 'x-forwarded-for': '1.1.1.1' } });
      expect(await rateLimiters.contactForm(req)).toBeDefined();
      expect(await rateLimiters.apiGeneral(req)).toBeDefined();
      expect(await rateLimiters.search(req)).toBeDefined();
    });
  });
});
