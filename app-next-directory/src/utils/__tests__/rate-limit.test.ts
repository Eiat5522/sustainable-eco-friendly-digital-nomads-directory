/**
 * @jest-environment node
 */

import { afterEach, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import {
  rateLimit,
  rateLimiters,
  rateLimitStore,
  resetRedisClient,
  cleanupRateLimitStore,
} from '../rate-limit';
import { structuredLogger } from '@/lib/logger';

// Mock structuredLogger
jest.mock('@/lib/logger', () => ({
  structuredLogger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock Upstash Redis and Ratelimit
jest.mock('@upstash/redis', () => {
  return {
    Redis: jest.fn().mockImplementation(() => ({
      // Redis instance mock
    })),
  };
});

jest.mock('@upstash/ratelimit', () => {
  const mockLimit = jest.fn();
  return {
    Ratelimit: jest.fn().mockImplementation(() => ({
      limit: mockLimit,
    })),
  };
});

// Set up static method mock for Ratelimit
(Ratelimit as any).slidingWindow = jest.fn();

describe('rate-limit utility', () => {
  const originalEnv = { ...process.env };

  beforeAll(() => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.DISABLE_UPSTASH_DURING_BUILD;
  });

  beforeEach(() => {
    rateLimitStore.clear();
    resetRedisClient();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    process.env = { ...originalEnv };
  });

  describe('rateLimit initialization and Redis paths', () => {
    it('should allow requests within the limit using in-memory fallback', async () => {
      const limiter = rateLimit({ max: 3, windowMs: 1000 });
      const request = new Request('http://localhost', { headers: { 'x-forwarded-for': '127.0.0.1' } });

      for (let i = 2; i >= 0; i--) {
        const result = await limiter(request);
        expect(result.success).toBe(true);
        expect(result.remaining).toBe(i);
      }

      const blocked = await limiter(request);
      expect(blocked.success).toBe(false);
    });

    it('should use Redis when available', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://fake-redis.upstash.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'fake-token';

      const limiter = rateLimit({ max: 5, windowMs: 1000 });
      const request = new Request('http://localhost', { headers: { 'x-forwarded-for': '1.2.3.4' } });

      await limiter(request); // trigger init

      const mockRatelimitInstance = (Ratelimit as any).mock.results[0].value;
      mockRatelimitInstance.limit.mockResolvedValueOnce({
        success: true,
        limit: 5,
        remaining: 4,
        reset: 123456789,
      });

      const result = await limiter(request);
      expect(Redis).toHaveBeenCalled();
      expect(result.resetTime).toBe(123456789);
    });

    it('should fallback to in-memory on Redis error', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://fake-redis.upstash.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'fake-token';
      const limiter = rateLimit({ max: 5, windowMs: 1000 });
      const request = new Request('http://localhost', { headers: { 'x-forwarded-for': '5.6.7.8' } });

      await limiter(request); // init
      const mockRatelimitInstance = (Ratelimit as any).mock.results[0].value;
      mockRatelimitInstance.limit.mockRejectedValueOnce(new Error('Redis Down'));

      const result = await limiter(request);
      expect(result.success).toBe(true);
      expect(result.remaining).toBe(3); // 2 requests made (init + this one)
    });

    it('should skip Redis if DISABLE_UPSTASH_DURING_BUILD is set', async () => {
      process.env.DISABLE_UPSTASH_DURING_BUILD = '1';
      const limiter = rateLimit({ max: 5, windowMs: 1000 });
      await limiter(new Request('http://localhost'));
      expect(Redis).not.toHaveBeenCalled();
    });

    it('should handle Redis constructor error', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://fake-redis.upstash.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'fake-token';
      (Redis as unknown as jest.Mock).mockImplementationOnce(() => { throw new Error('fail'); });

      const limiter = rateLimit({ max: 5, windowMs: 1000 });
      await limiter(new Request('http://localhost'));
      expect(structuredLogger.error).toHaveBeenCalled();
    });
  });

  describe('IP detection and key generation', () => {
    it.each([
      ['x-forwarded-for', '1.1.1.1, 2.2.2.2', '1.1.1.1'],
      ['x-real-ip', '3.3.3.3', '3.3.3.3'],
      ['cf-connecting-ip', '4.4.4.4', '4.4.4.4'],
      ['none', '', 'unknown']
    ])('should detect IP from %s header', async (header, value, expected) => {
      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      const headers = value ? { [header]: value } : {};
      await limiter(new Request('http://localhost', { headers }));
      expect(rateLimitStore.has(expected)).toBe(true);
    });

    it.each([
      ['invalid-ip'],
      ['not-an-ip'],
      ['999.999.999.999']
    ])('should fallback to unknown for invalid IP: %s', async (ip) => {
      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      await limiter(new Request('http://localhost', { headers: { 'x-forwarded-for': ip } }));
      expect(rateLimitStore.has('unknown')).toBe(true);
    });

    it('should use custom key generator', async () => {
      const limiter = rateLimit({
        max: 1,
        windowMs: 1000,
        keyGenerator: req => new URL(req.url).searchParams.get('key') || 'none',
      });
      await limiter(new Request('http://localhost?key=abc'));
      expect(rateLimitStore.has('abc')).toBe(true);
    });
  });

  describe('Predefined limiters', () => {
    it.each([
      ['contactForm'],
      ['apiGeneral'],
      ['search']
    ])('should have %s limiter defined', (name) => {
      expect((rateLimiters as any)[name]).toBeDefined();
    });
  });

  describe('Internal State Utilities', () => {
    it('cleanupRateLimitStore should remove expired entries', () => {
      rateLimitStore.set('expired', { count: 1, resetTime: Date.now() - 1000 });
      rateLimitStore.set('valid', { count: 1, resetTime: Date.now() + 10000 });
      cleanupRateLimitStore();
      expect(rateLimitStore.has('expired')).toBe(false);
      expect(rateLimitStore.has('valid')).toBe(true);
    });

    it('resetRedisClient should allow re-initialization', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://fake-redis.upstash.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'token';
      const limiter = rateLimit({ max: 5, windowMs: 1000 });
      await limiter(new Request('http://localhost'));
      expect(Redis).toHaveBeenCalledTimes(1);
      resetRedisClient();
      await limiter(new Request('http://localhost'));
      expect(Redis).toHaveBeenCalledTimes(2);
    });
  });
});
