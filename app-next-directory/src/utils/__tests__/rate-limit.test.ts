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

  beforeEach(() => {
    // Clear the rate limit store and reset Redis client before each test
    rateLimitStore.clear();
    clearRedisClient();
    jest.clearAllMocks();

    // Default env: no Redis
    process.env = { ...originalEnv };
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.DISABLE_UPSTASH_DURING_BUILD;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('In-memory Rate Limiting (Fallback)', () => {
    it('should allow requests within the limit', async () => {
      const limiter = rateLimit({ max: 3, windowMs: 1000 });
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '127.0.0.1' },
      });

      const result1 = await limiter(request);
      expect(result1.success).toBe(true);
      expect(result1.limit).toBe(3);
      expect(result1.remaining).toBe(2);

      const result2 = await limiter(request);
      expect(result2.success).toBe(true);
      expect(result2.remaining).toBe(1);

      const result3 = await limiter(request);
      expect(result3.success).toBe(true);
      expect(result3.remaining).toBe(0);
    });

    it('should block requests when limit is exceeded', async () => {
      const limiter = rateLimit({ max: 2, windowMs: 1000 });
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '127.0.0.1' },
      });

      await limiter(request);
      await limiter(request);

      const result = await limiter(request);
      expect(result.success).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should use custom key generator if provided', async () => {
      const limiter = rateLimit({
        max: 1,
        windowMs: 1000,
        keyGenerator: req => {
          const url = new URL(req.url);
          return url.searchParams.get('userId') || 'anonymous';
        },
      });

      const request1 = new Request('http://localhost?userId=user1');
      const request2 = new Request('http://localhost?userId=user2');

      expect((await limiter(request1)).success).toBe(true);
      expect((await limiter(request2)).success).toBe(true);
      expect((await limiter(request1)).success).toBe(false);
    });
  });

  describe('IP Extraction', () => {
    it('should use x-forwarded-for header', async () => {
      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '192.168.1.1, 10.0.0.1' },
      });
      await limiter(request);
      expect(rateLimitStore.has('192.168.1.1')).toBe(true);
    });

    it('should use x-real-ip header as fallback', async () => {
      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      const request = new Request('http://localhost', {
        headers: { 'x-real-ip': '192.168.1.2' },
      });
      await limiter(request);
      expect(rateLimitStore.has('192.168.1.2')).toBe(true);
    });

    it('should use cf-connecting-ip header as second fallback', async () => {
      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      const request = new Request('http://localhost', {
        headers: { 'cf-connecting-ip': '192.168.1.3' },
      });
      await limiter(request);
      expect(rateLimitStore.has('192.168.1.3')).toBe(true);
    });

    it('should fallback to "unknown"', async () => {
      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      const request = new Request('http://localhost');
      await limiter(request);
      expect(rateLimitStore.has('unknown')).toBe(true);
    });
  });

  describe('Redis Rate Limiting', () => {
    beforeEach(() => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://mock-redis.upstash.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'mock-token';
    });

    it('should use Redis when available', async () => {
      const mockLimit = jest.fn().mockResolvedValue({
        success: true,
        limit: 10,
        remaining: 9,
        reset: 123456789,
      });

      (Ratelimit as unknown as jest.Mock).mockImplementation(() => ({
        limit: mockLimit,
      }));

      const limiter = rateLimit({ max: 10, windowMs: 60000 });
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '1.2.3.4' },
      });

      const result = await limiter(request);

      expect(Redis).toHaveBeenCalled();
      expect(Ratelimit).toHaveBeenCalled();
      expect(mockLimit).toHaveBeenCalledWith('1.2.3.4');
      expect(result).toEqual({
        success: true,
        limit: 10,
        remaining: 9,
        resetTime: 123456789,
      });
    });

    it('should fallback to in-memory when Redis throws', async () => {
      const mockLimit = jest.fn().mockRejectedValue(new Error('Redis connection failed'));

      (Ratelimit as unknown as jest.Mock).mockImplementation(() => ({
        limit: mockLimit,
      }));

      const limiter = rateLimit({ max: 5, windowMs: 60000 });
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '5.6.7.8' },
      });

      const result = await limiter(request);

      expect(result.success).toBe(true);
      expect(result.remaining).toBe(4);
      expect(rateLimitStore.has('5.6.7.8')).toBe(true);
    });

    it('should skip Redis when DISABLE_UPSTASH_DURING_BUILD is set', async () => {
      process.env.DISABLE_UPSTASH_DURING_BUILD = '1';

      const limiter = rateLimit({ max: 5, windowMs: 60000 });
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '9.9.9.9' },
      });

      await limiter(request);

      expect(Redis).not.toHaveBeenCalled();
      expect(rateLimitStore.has('9.9.9.9')).toBe(true);
    });

    it('should handle Redis constructor errors', async () => {
      (Redis as unknown as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid Redis config');
      });

      const limiter = rateLimit({ max: 5, windowMs: 60000 });
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '8.8.8.8' },
      });

      const result = await limiter(request);
      expect(result.success).toBe(true);
      expect(rateLimitStore.has('8.8.8.8')).toBe(true);
    });
  });

  describe('Cleanup and Store Management', () => {
    it('cleanupRateLimitStore should remove expired entries', () => {
      const now = Date.now();
      rateLimitStore.set('expired', { count: 5, resetTime: now - 1000 });
      rateLimitStore.set('valid', { count: 2, resetTime: now + 1000 });

      cleanupRateLimitStore();

      expect(rateLimitStore.has('expired')).toBe(false);
      expect(rateLimitStore.has('valid')).toBe(true);
    });

    it('clearRedisClient should allow re-initialization', () => {
      // First call with no env
      rateLimit({ max: 5, windowMs: 60000 });
      expect(Redis).not.toHaveBeenCalled();

      // Set env and clear client
      process.env.UPSTASH_REDIS_REST_URL = 'https://mock-redis.upstash.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'mock-token';
      clearRedisClient();

      // Second call should now initialize Redis
      rateLimit({ max: 5, windowMs: 60000 });
      expect(Redis).toHaveBeenCalled();
    });
  });

  describe('Predefined Limiters', () => {
    it('should have working predefined limiters', async () => {
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '10.10.10.10' },
      });

      expect((await rateLimiters.contactForm(request)).success).toBe(true);
      expect((await rateLimiters.apiGeneral(request)).success).toBe(true);
      expect((await rateLimiters.search(request)).success).toBe(true);
    });
  });
});
