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
  const originalEnv = { ...process.env };
  const createReq = (h: Record<string, string> = {}) => new Request('http://localhost', { headers: h });

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

  describe('In-memory', () => {
    it('lifecycle', async () => {
      const limiter = rateLimit({ max: 2, windowMs: 1000 });
      const req = createReq({ 'x-forwarded-for': 'test-ip' });
      expect((await limiter(req)).remaining).toBe(1);
      expect((await limiter(req)).remaining).toBe(0);
      expect((await limiter(req)).success).toBe(false);
    });

    it('key gen', async () => {
      const limiter = rateLimit({
        max: 1,
        windowMs: 1000,
        keyGenerator: r => new URL(r.url).searchParams.get('id') || 'none',
      });
      expect((await limiter(new Request('http://a?id=1'))).success).toBe(true);
      expect((await limiter(new Request('http://a?id=1'))).success).toBe(false);
    });
  });

  describe('IP Extraction', () => {
    const check = async (h: Record<string, string>, k: string) => {
      await rateLimit({ max: 1, windowMs: 1000 })(createReq(h));
      expect(rateLimitStore.has(k)).toBe(true);
    };

    it('extracts correctly', async () => {
      await check({ 'x-forwarded-for': 'ip1, ip2' }, 'ip1');
      await check({ 'x-real-ip': 'ipR' }, 'ipR');
      await check({ 'cf-connecting-ip': 'ipC' }, 'ipC');
      await check({}, 'unknown');
    });
  });

  describe('Redis', () => {
    beforeEach(() => {
      process.env.UPSTASH_REDIS_REST_URL = 'http://localhost/redis';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';
    });

    it('uses Redis', async () => {
      const mock = jest.fn().mockResolvedValue({ success: true, limit: 10, remaining: 5, reset: 999 });
      (Ratelimit as unknown as jest.Mock).mockImplementation(() => ({ limit: mock }));
      const res = await rateLimit({ max: 10, windowMs: 60 })(createReq({ 'x-forwarded-for': 'ip-r' }));
      expect(res).toEqual({ success: true, limit: 10, remaining: 5, resetTime: 999 });
    });

    it('fallbacks', async () => {
      process.env.DISABLE_UPSTASH_DURING_BUILD = '1';
      await rateLimit({ max: 1, windowMs: 60 })(createReq({ 'x-forwarded-for': 'b' }));
      expect(Redis).not.toHaveBeenCalled();

      delete process.env.DISABLE_UPSTASH_DURING_BUILD;
      clearRedisClient();
      (Redis as unknown as jest.Mock).mockImplementation(() => { throw new Error(); });
      await rateLimit({ max: 1, windowMs: 60 })(createReq({ 'x-forwarded-for': 't' }));
      expect(rateLimitStore.has('t')).toBe(true);
    });
  });

  it('maintenance', () => {
    const now = Date.now();
    rateLimitStore.set('e', { count: 1, resetTime: now - 1 });
    cleanupRateLimitStore();
    expect(rateLimitStore.has('e')).toBe(false);

    rateLimit({ max: 5, windowMs: 60 });
    process.env.UPSTASH_REDIS_REST_URL = 'http://localhost/redis';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'token';
    clearRedisClient();
    rateLimit({ max: 5, windowMs: 60 });
    expect(Redis).toHaveBeenCalled();
  });

  it('predefined', async () => {
    const req = createReq({ 'x-forwarded-for': 'p' });
    expect((await rateLimiters.contactForm(req)).success).toBe(true);
  });
});
