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
  const createReq = (h: Record<string, string> = {}) => new Request('http://example.local', { headers: h });

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
      const req = createReq({ 'x-forwarded-for': 'dev-client' });
      expect((await limiter(req)).remaining).toBe(1);
      expect((await limiter(req)).remaining).toBe(0);
      expect((await limiter(req)).success).toBe(false);
    });

    it('key gen', async () => {
      const limiter = rateLimit({
        max: 1,
        windowMs: 1000,
        keyGenerator: r => new URL(r.url).searchParams.get('id') || 'dev',
      });
      expect((await limiter(new Request('http://local?id=A'))).success).toBe(true);
      expect((await limiter(new Request('http://local?id=A'))).success).toBe(false);
    });
  });

  describe('IP Extraction', () => {
    const check = async (h: Record<string, string>, k: string) => {
      await rateLimit({ max: 1, windowMs: 1000 })(createReq(h));
      expect(rateLimitStore.has(k)).toBe(true);
    };

    it('extracts correctly', async () => {
      await check({ 'x-forwarded-for': 'client1, client2' }, 'client1');
      await check({ 'x-real-ip': 'clientR' }, 'clientR');
      await check({ 'cf-connecting-ip': 'clientC' }, 'clientC');
      await check({}, 'unknown');
    });
  });

  describe('Redis', () => {
    beforeEach(() => {
      process.env.UPSTASH_REDIS_REST_URL = 'http://local/db';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'mock';
    });

    it('uses Redis', async () => {
      const mockLimit = jest.fn().mockResolvedValue({ success: true, limit: 10, remaining: 5, reset: 9 });
      (Ratelimit as unknown as jest.Mock).mockImplementation(() => ({ limit: mockLimit }));
      const res = await rateLimit({ max: 10, windowMs: 6 })(createReq({ 'x-forwarded-for': 'client-red' }));
      expect(res).toEqual({ success: true, limit: 10, remaining: 5, resetTime: 9 });
    });

    it('fallbacks', async () => {
      process.env.DISABLE_UPSTASH_DURING_BUILD = '1';
      await rateLimit({ max: 1, windowMs: 6 })(createReq({ 'x-forwarded-for': 'dev-b' }));
      expect(Redis).not.toHaveBeenCalled();

      delete process.env.DISABLE_UPSTASH_DURING_BUILD;
      clearRedisClient();
      (Redis as unknown as jest.Mock).mockImplementation(() => { throw new Error(); });
      await rateLimit({ max: 1, windowMs: 6 })(createReq({ 'x-forwarded-for': 'dev-t' }));
      expect(rateLimitStore.has('dev-t')).toBe(true);
    });
  });

  it('maintenance', () => {
    const now = Date.now();
    rateLimitStore.set('dev-exp', { count: 1, resetTime: now - 1 });
    cleanupRateLimitStore();
    expect(rateLimitStore.has('dev-exp')).toBe(false);

    rateLimit({ max: 5, windowMs: 6 });
    process.env.UPSTASH_REDIS_REST_URL = 'http://local/db';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'mock';
    clearRedisClient();
    rateLimit({ max: 5, windowMs: 6 });
    expect(Redis).toHaveBeenCalled();
  });

  it('predefined', async () => {
    const req = createReq({ 'x-forwarded-for': 'dev-p' });
    expect((await rateLimiters.contactForm(req)).success).toBe(true);
  });
});
