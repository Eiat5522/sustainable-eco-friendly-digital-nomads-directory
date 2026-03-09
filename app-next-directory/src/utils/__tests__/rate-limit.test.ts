/**
 * @jest-environment node
 */

import { afterEach, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

// Mock Upstash Redis and Ratelimit before importing the module
jest.mock('@upstash/redis', () => ({
  Redis: jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    set: jest.fn(),
  })),
}));

const mockLimitFn = jest.fn();

jest.mock('@upstash/ratelimit', () => {
  const mockSlidingWindow = jest.fn().mockReturnValue({});
  return {
    Ratelimit: Object.assign(
      jest.fn().mockImplementation(() => ({
        limit: mockLimitFn,
      })),
      {
        slidingWindow: mockSlidingWindow,
      }
    ),
  };
});

// Now import the module under test
import {
  rateLimit,
  rateLimiters,
  rateLimitStore,
  clearRedisClient,
  cleanupRateLimitStore,
  getClientIP
} from '../rate-limit';

describe('rate-limit', () => {
  // Store original env vars
  const originalEnv = { ...process.env };

  beforeAll(() => {
    // Ensure Redis is not initialized by default
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.DISABLE_UPSTASH_DURING_BUILD;
  });

  beforeEach(() => {
    // Clear the rate limit store before each test
    rateLimitStore.clear();
    clearRedisClient();

    // Clear all mocks
    jest.clearAllMocks();
    mockLimitFn.mockReset();

    // Reset env vars to original state (from beforeAll)
    process.env = { ...originalEnv };
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.DISABLE_UPSTASH_DURING_BUILD;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('rateLimit - In-Memory (Fallback)', () => {
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

      await limiter(request); // First request
      await limiter(request); // Second request

      const result = await limiter(request); // Third request should be blocked
      expect(result.success).toBe(false);
      expect(result.limit).toBe(2);
      expect(result.remaining).toBe(0);
    });

    it('should reset count after window expires', async () => {
      const limiter = rateLimit({ max: 2, windowMs: 100 }); // 100ms window
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '127.0.0.1' },
      });

      // Use up the limit
      await limiter(request);
      await limiter(request);

      const blockedResult = await limiter(request);
      expect(blockedResult.success).toBe(false);

      // Manually clear the store to simulate window expiration
      rateLimitStore.clear();

      // Should allow requests again after manual reset
      const newResult = await limiter(request);
      expect(newResult.success).toBe(true);
      expect(newResult.remaining).toBe(1);
    });
  });

  describe('rateLimit - Redis (when available)', () => {
    beforeEach(() => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://test-url.com';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';
    });

    it('should use Redis-based rate limiting when credentials are provided', async () => {
      mockLimitFn.mockResolvedValue({
        success: true,
        limit: 5,
        remaining: 4,
        reset: 123456789,
      });

      const limiter = rateLimit({ max: 5, windowMs: 60000 });
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '8.8.8.8' },
      });

      const result = await limiter(request);

      expect(Redis).toHaveBeenCalledWith({
        url: 'https://test-url.com',
        token: 'test-token',
      });
      expect(Ratelimit).toHaveBeenCalled();
      expect(mockLimitFn).toHaveBeenCalledWith('8.8.8.8');
      expect(result).toEqual({
        success: true,
        limit: 5,
        remaining: 4,
        resetTime: 123456789,
      });
    });

    it('should fall back to in-memory when Redis initialization fails', async () => {
      (Redis as unknown as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Redis connection failed');
      });

      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '1.1.1.1' },
      });

      const result = await limiter(request);
      expect(result.success).toBe(true);
      expect(rateLimitStore.has('1.1.1.1')).toBe(true);
    });

    it('should fall back to in-memory when Redis limit call fails', async () => {
      mockLimitFn.mockRejectedValue(new Error('Redis limit failed'));

      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '2.2.2.2' },
      });

      const result = await limiter(request);
      expect(result.success).toBe(true);
      expect(rateLimitStore.has('2.2.2.2')).toBe(true);
    });

    it('should use custom key generator with Redis', async () => {
      mockLimitFn.mockResolvedValue({
        success: true,
        limit: 5,
        remaining: 4,
        reset: 123456789,
      });

      const limiter = rateLimit({
        max: 5,
        windowMs: 60000,
        keyGenerator: () => 'custom-key'
      });
      const request = new Request('http://localhost');

      await limiter(request);
      expect(mockLimitFn).toHaveBeenCalledWith('custom-key');
    });
  });

  describe('DISABLE_UPSTASH_DURING_BUILD', () => {
    it('should skip Redis initialization when DISABLE_UPSTASH_DURING_BUILD is set', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://test-url.com';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';
      process.env.DISABLE_UPSTASH_DURING_BUILD = '1';

      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '3.3.3.3' },
      });

      await limiter(request);
      expect(Redis).not.toHaveBeenCalled();
      expect(rateLimitStore.has('3.3.3.3')).toBe(true);
    });
  });

  describe('getClientIP', () => {
    it('should prioritize x-forwarded-for and validate IP', () => {
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '1.1.1.1, 2.2.2.2' },
      });
      expect(getClientIP(request)).toBe('1.1.1.1');
    });

    it('should skip invalid IPs in x-forwarded-for', () => {
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': 'invalid, 2.2.2.2' },
      });
      expect(getClientIP(request)).toBe('2.2.2.2');
    });

    it('should fall back to x-real-ip and validate', () => {
      const request = new Request('http://localhost', {
        headers: { 'x-real-ip': '3.3.3.3' },
      });
      expect(getClientIP(request)).toBe('3.3.3.3');
    });

    it('should skip invalid x-real-ip', () => {
      const request = new Request('http://localhost', {
        headers: { 'x-real-ip': 'invalid' },
      });
      expect(getClientIP(request)).toBe('unknown');
    });

    it('should fall back to cf-connecting-ip and validate', () => {
      const request = new Request('http://localhost', {
        headers: { 'cf-connecting-ip': '4.4.4.4' },
      });
      expect(getClientIP(request)).toBe('4.4.4.4');
    });

    it('should return unknown if no valid headers', () => {
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': 'invalid-ip' }
      });
      expect(getClientIP(request)).toBe('unknown');
    });

    it('should handle malformed x-forwarded-for', () => {
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '' },
      });
      expect(getClientIP(request)).toBe('unknown');
    });
  });

  describe('cleanupRateLimitStore', () => {
    it('should remove expired entries', () => {
      const now = Date.now();
      rateLimitStore.set('expired', { count: 1, resetTime: now - 1000 });
      rateLimitStore.set('valid', { count: 1, resetTime: now + 1000 });

      cleanupRateLimitStore();

      expect(rateLimitStore.has('expired')).toBe(false);
      expect(rateLimitStore.has('valid')).toBe(true);
    });
  });

  describe('rateLimiters predefined', () => {
    it('should define standard limiters', () => {
      expect(rateLimiters.contactForm).toBeDefined();
      expect(rateLimiters.apiGeneral).toBeDefined();
      expect(rateLimiters.search).toBeDefined();
    });
  });
});
