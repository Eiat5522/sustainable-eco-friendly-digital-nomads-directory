/**
 * @jest-environment node
 */

import { afterEach, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Mocking should happen before other imports if they rely on the mocked module
jest.mock('@upstash/redis', () => {
  return {
    Redis: jest.fn().mockImplementation(() => ({
      // Mock any methods if needed
    })),
  };
});

jest.mock('@upstash/ratelimit', () => {
  const mockLimit = jest.fn();
  const RatelimitMock: any = jest.fn().mockImplementation(() => ({
    limit: mockLimit,
  }));
  RatelimitMock.slidingWindow = jest.fn().mockReturnValue({});
  return {
    Ratelimit: RatelimitMock,
    mockLimit,
  };
});

import {
  cleanupRateLimitStore,
  clearRedisClient,
  rateLimit,
  rateLimiters,
  rateLimitStore,
} from '../rate-limit';

// Accessing the mocked functions
const { mockLimit } = jest.requireMock('@upstash/ratelimit') as any;

describe('rate-limit', () => {
  // Store original env vars
  const originalEnv = { ...process.env };

  beforeAll(() => {
    // Ensure Redis is not initialized during tests by default
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.DISABLE_UPSTASH_DURING_BUILD;
  });

  beforeEach(() => {
    // Clear the rate limit store before each test
    rateLimitStore.clear();
    clearRedisClient();
    mockLimit.mockReset();
    (Ratelimit as any).slidingWindow.mockClear();
    (Redis as any).mockClear();
    // Mock console.log to avoid noise in test output
    jest.spyOn(console, 'log').mockImplementation(() => {});
    // Mock console.warn to avoid noise from Redis initialization
    jest.spyOn(console, 'warn').mockImplementation(() => {});

    // Clear potentially inherited env vars
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.DISABLE_UPSTASH_DURING_BUILD;
  });

  afterEach(() => {
    jest.restoreAllMocks();
    // Restore env vars
    process.env = { ...originalEnv };
  });

  describe('rateLimit', () => {
    it('should allow requests within the limit (in-memory)', async () => {
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

    it('should block requests when limit is exceeded (in-memory)', async () => {
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

    it('should reset count after window expires (in-memory)', async () => {
      const limiter = rateLimit({ max: 2, windowMs: 100 }); // 100ms window
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '127.0.0.1' },
      });

      // Use up the limit
      const result1 = await limiter(request);
      expect(result1.success).toBe(true);
      const result2 = await limiter(request);
      expect(result2.success).toBe(true);

      const blockedResult = await limiter(request);
      expect(blockedResult.success).toBe(false);

      // Manually clear the store to simulate window expiration
      rateLimitStore.clear();

      // Should allow requests again after manual reset
      const newResult = await limiter(request);
      expect(newResult.success).toBe(true);
      expect(newResult.remaining).toBe(1);
    });

    it('should track different IPs separately', async () => {
      const limiter = rateLimit({ max: 2, windowMs: 1000 });

      const request1 = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '127.0.0.1' },
      });
      const request2 = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '127.0.0.2' },
      });

      // First IP
      const result1a = await limiter(request1);
      expect(result1a.success).toBe(true);
      const result1b = await limiter(request1);
      expect(result1b.success).toBe(true);

      // Second IP should have its own limit
      const result2a = await limiter(request2);
      expect(result2a.success).toBe(true);
      expect(result2a.remaining).toBe(1);
    });

    describe('IP extraction edge cases', () => {
      it.each([
        ['x-forwarded-for', '192.168.1.1, 10.0.0.1', '192.168.1.1'],
        ['x-forwarded-for', '  192.168.1.1  , 10.0.0.1', '192.168.1.1'],
        ['x-forwarded-for', '2001:db8::1', '2001:db8::1'],
        ['x-forwarded-for', '[2001:db8::1]:8080', '2001:db8::1'],
        ['x-forwarded-for', '127.0.0.1:8080', '127.0.0.1'],
        ['x-real-ip', '192.168.1.1', '192.168.1.1'],
        ['cf-connecting-ip', '192.168.1.1', '192.168.1.1'],
      ])('should extract IP correctly from %s header', async (headerName, headerValue, expectedIp) => {
        const limiter = rateLimit({ max: 1, windowMs: 1000 });
        const request = new Request('http://localhost', {
          headers: { [headerName]: headerValue },
        });

        const result = await limiter(request);
        expect(result.success).toBe(true);

        // Verification of key in store (since we are in-memory mode)
        expect(rateLimitStore.has(expectedIp)).toBe(true);

        // Same IP should be blocked
        const result2 = await limiter(request);
        expect(result2.success).toBe(false);
      });

      it('should use "unknown" as fallback if no valid IP found', async () => {
        const limiter = rateLimit({ max: 1, windowMs: 1000 });
        const request = new Request('http://localhost');

        const result = await limiter(request);
        expect(result.success).toBe(true);
        expect(rateLimitStore.has('unknown')).toBe(true);

        const result2 = await limiter(request);
        expect(result2.success).toBe(false);
      });
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

      // Different keys should have separate limits
      const result1a = await limiter(request1);
      expect(result1a.success).toBe(true);

      const result2a = await limiter(request2);
      expect(result2a.success).toBe(true);

      // Same key should be limited
      const result1b = await limiter(request1);
      expect(result1b.success).toBe(false);
    });

    it('should return correct resetTime', async () => {
      const windowMs = 5000;
      const limiter = rateLimit({ max: 1, windowMs });
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '127.0.0.1' },
      });

      const before = Date.now();
      const result = await limiter(request);
      const after = Date.now();

      expect(result.resetTime).toBeGreaterThanOrEqual(before + windowMs);
      expect(result.resetTime).toBeLessThanOrEqual(after + windowMs);
    });
  });

  describe('Redis initialization', () => {
    it.each([
      { desc: 'success with credentials', url: 'http://test-redis.com', token: 'test-token', shouldInit: true },
      { desc: 'bypass with DISABLE_UPSTASH_DURING_BUILD', url: 'http://test-redis.com', token: 'test-token', shouldInit: false, disableBuild: '1' },
      { desc: 'failure with missing URL', url: undefined, token: 'test-token', shouldInit: false },
      { desc: 'failure with missing TOKEN', url: 'http://test-redis.com', token: undefined, shouldInit: false },
    ])('should handle Redis initialization: $desc', ({ url, token, shouldInit, disableBuild }) => {
      if (url) process.env.UPSTASH_REDIS_REST_URL = url;
      else delete process.env.UPSTASH_REDIS_REST_URL;

      if (token) process.env.UPSTASH_REDIS_REST_TOKEN = token;
      else delete process.env.UPSTASH_REDIS_REST_TOKEN;

      if (disableBuild) process.env.DISABLE_UPSTASH_DURING_BUILD = disableBuild;
      else delete process.env.DISABLE_UPSTASH_DURING_BUILD;

      rateLimit({ max: 1, windowMs: 1000 });

      if (shouldInit) {
        expect(Redis).toHaveBeenCalledWith({ url, token });
        expect(Ratelimit).toHaveBeenCalled();
      } else {
        expect(Redis).not.toHaveBeenCalled();
      }
    }, 20000);

    it('should handle Redis constructor error gracefully', () => {
      process.env.UPSTASH_REDIS_REST_URL = 'http://test-redis.com';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';

      (Redis as any).mockImplementationOnce(() => {
        throw new Error('Redis connection error');
      });

      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      expect(limiter).toBeDefined();
      expect(Ratelimit).not.toHaveBeenCalled();
    });
  });

  describe('Redis-based rate limiter', () => {
    beforeEach(() => {
      process.env.UPSTASH_REDIS_REST_URL = 'http://test-redis.com';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';
    });

    it('should use Redis limiter when available', async () => {
      mockLimit.mockResolvedValueOnce({
        success: true,
        limit: 10,
        remaining: 9,
        reset: 123456789,
      });

      const limiter = rateLimit({ max: 10, windowMs: 1000 });
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '1.2.3.4' },
      });

      const result = await limiter(request);

      expect(mockLimit).toHaveBeenCalledWith('1.2.3.4');
      expect(result).toEqual({
        success: true,
        limit: 10,
        remaining: 9,
        resetTime: 123456789,
      });
    });

    it('should fall back to in-memory on Redis error', async () => {
      mockLimit.mockRejectedValueOnce(new Error('Redis error'));

      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '1.2.3.4' },
      });

      // First request (falls back to in-memory)
      const result1 = await limiter(request);
      expect(result1.success).toBe(true);
      expect(rateLimitStore.has('1.2.3.4')).toBe(true);

      // Second request (in-memory will block it since max is 1)
      mockLimit.mockRejectedValueOnce(new Error('Redis error'));
      const result2 = await limiter(request);
      expect(result2.success).toBe(false);
    });

    it('should use custom key generator with Redis limiter', async () => {
      mockLimit.mockResolvedValueOnce({
        success: true,
        limit: 10,
        remaining: 9,
        reset: 123456789,
      });

      const limiter = rateLimit({
        max: 10,
        windowMs: 1000,
        keyGenerator: () => 'custom-key',
      });
      const request = new Request('http://localhost');

      await limiter(request);

      expect(mockLimit).toHaveBeenCalledWith('custom-key');
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

  describe('Predefined rate limiters', () => {
    it.each([
      ['contactForm', rateLimiters.contactForm, 5],
      ['apiGeneral', rateLimiters.apiGeneral, 100],
      ['search', rateLimiters.search, 50],
    ])('%s limiter should enforce its limit', async (name, limiter, max) => {
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': `127.0.0.${name}` },
      });

      // Make max requests (should all succeed)
      for (let i = 0; i < max; i++) {
        const result = await limiter(request);
        expect(result.success).toBe(true);
      }

      // Next request should fail
      const result = await limiter(request);
      expect(result.success).toBe(false);
      expect(result.limit).toBe(max);
    });
  });
});
