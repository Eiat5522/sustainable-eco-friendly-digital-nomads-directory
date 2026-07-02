/**
 * @jest-environment node
 */

import { afterEach, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';

// Mock Upstash
const mockRedis = { url: 'http://test', token: 'tok' };
const mockLimit = jest.fn();
const mockRatelimit = { limit: mockLimit };

jest.mock('@upstash/redis', () => ({
  Redis: jest.fn().mockImplementation(() => mockRedis),
}));

jest.mock('@upstash/ratelimit', () => ({
  Ratelimit: Object.assign(
    jest.fn().mockImplementation(() => mockRatelimit),
    { slidingWindow: jest.fn().mockReturnValue('sw') }
  ),
}));

import {
  rateLimit,
  rateLimiters,
  rateLimitStore,
  cleanupRateLimitStore,
  clearRedisClient,
} from '../rate-limit';
import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

describe('rate-limit', () => {
  const oldEnv = { ...process.env };

  beforeAll(() => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.DISABLE_UPSTASH_DURING_BUILD;
  });

  beforeEach(() => {
    clearRedisClient();
    rateLimitStore.clear();
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    process.env = { ...oldEnv };
  });

  describe('rateLimit', () => {
    it('enforces in-memory', async () => {
      const l = rateLimit({ max: 2, windowMs: 1000 });
      const r = new Request('http://l', { headers: { 'x-real-ip': '1.1.1.1' } });

      expect((await l(r)).success).toBe(true);
      expect((await l(r)).success).toBe(true);
      expect((await l(r)).success).toBe(false);
    });

    it('resets after expiry', async () => {
      const l = rateLimit({ max: 1, windowMs: 100 });
      const r = new Request('http://l', { headers: { 'x-real-ip': '1.1.1.1' } });

      await l(r);
      const e = rateLimitStore.get('1.1.1.1');
      if (e) e.resetTime = Date.now() - 1000;

      expect((await l(r)).success).toBe(true);
    });
  });

  describe('Redis-based', () => {
    beforeEach(() => {
      process.env.UPSTASH_REDIS_REST_URL = 'http://test';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'tok';
    });

    it('uses Redis when ready', async () => {
      mockLimit.mockResolvedValue({ success: true, limit: 10, remaining: 9, reset: Date.now() });
      const l = rateLimit({ max: 10, windowMs: 1000 });
      const r = new Request('http://l', { headers: { 'x-real-ip': '8.8.8.8' } });

      await l(r);
      expect(Redis).toHaveBeenCalled();
      expect(Ratelimit).toHaveBeenCalled();
    });

    it('falls back on failure', async () => {
      mockLimit.mockRejectedValue(new Error('Down'));
      const l = rateLimit({ max: 5, windowMs: 1000 });
      const r = new Request('http://l', { headers: { 'x-real-ip': '9.9.9.9' } });

      expect((await l(r)).success).toBe(true);
      expect(rateLimitStore.has('9.9.9.9')).toBe(true);
    });
  });

  describe('Maintenance', () => {
    it('cleans up store', () => {
      const now = Date.now();
      rateLimitStore.set('e', { count: 1, resetTime: now - 1000 });
      rateLimitStore.set('v', { count: 1, resetTime: now + 1000 });
      cleanupRateLimitStore();
      expect(rateLimitStore.has('e')).toBe(false);
      expect(rateLimitStore.has('v')).toBe(true);
    });

    it('limiters are defined', () => {
      expect(rateLimiters.contactForm).toBeDefined();
      expect(rateLimiters.apiGeneral).toBeDefined();
      expect(rateLimiters.search).toBeDefined();
    });
  });
});
