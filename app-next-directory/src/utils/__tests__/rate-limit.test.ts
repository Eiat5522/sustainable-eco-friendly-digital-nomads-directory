/**
 * @jest-environment node
 */

import { afterEach, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';

// Mock Upstash
jest.mock('@upstash/redis', () => {
  return {
    Redis: jest.fn().mockImplementation(() => ({})),
  };
});

jest.mock('@upstash/ratelimit', () => {
  const mockRatelimit = jest.fn().mockImplementation(() => ({
    limit: jest.fn(),
  }));
  // Static method must be part of the mock object
  (mockRatelimit as any).slidingWindow = jest.fn();
  return {
    Ratelimit: mockRatelimit,
  };
});

import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';
import {
  rateLimit,
  rateLimiters,
  rateLimitStore,
  cleanupRateLimitStore,
  clearRedisClient,
} from '../rate-limit';

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
    // Reset mocks
    jest.clearAllMocks();
    // Clear the rate limit store before each test
    rateLimitStore.clear();
    // Clear Redis client state
    clearRedisClient();
    // Mock console.log to avoid noise in test output
    jest.spyOn(console, 'log').mockImplementation(() => {});
    // Mock console.warn to avoid noise from Redis initialization
    jest.spyOn(console, 'warn').mockImplementation(() => {});

    // Ensure env vars are clean
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

    it.each([
      ['x-forwarded-for', '192.168.1.1, 10.0.0.1', '192.168.1.1'],
      ['x-real-ip', '192.168.1.1', '192.168.1.1'],
      ['cf-connecting-ip', '192.168.1.1', '192.168.1.1'],
    ])('should use %s header for IP', async (header, value, expectedIp) => {
      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      const request = new Request('http://localhost', {
        headers: { [header]: value },
      });

      const result = await limiter(request);
      expect(result.success).toBe(true);

      // Should be limited for the same IP
      const result2 = await limiter(request);
      expect(result2.success).toBe(false);
      expect(rateLimitStore.has(expectedIp)).toBe(true);
    });

    it('should use "unknown" as fallback if no IP headers present', async () => {
      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      const request = new Request('http://localhost');

      const result = await limiter(request);
      expect(result.success).toBe(true);

      const result2 = await limiter(request);
      expect(result2.success).toBe(false);
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

    it('should handle multiple requests at the exact limit', async () => {
      const limiter = rateLimit({ max: 5, windowMs: 1000 });
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '127.0.0.1' },
      });

      // Make exactly max requests
      for (let i = 0; i < 5; i++) {
        const result = await limiter(request);
        expect(result.success).toBe(true);
      }

      // Next one should fail
      const result = await limiter(request);
      expect(result.success).toBe(false);
      expect(result.remaining).toBe(0);
    });
  });

  describe('Redis initialization', () => {
    it('should not initialize Redis when credentials are missing', () => {
      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      expect(Redis).not.toHaveBeenCalled();
      expect(limiter).toBeDefined();
    });

    it('should initialize Redis when credentials are provided', () => {
      process.env.UPSTASH_REDIS_REST_URL = 'http://localhost:8080';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';

      rateLimit({ max: 1, windowMs: 1000 });

      expect(Redis).toHaveBeenCalledWith({
        url: 'http://localhost:8080',
        token: 'test-token',
      });
      expect(Ratelimit).toHaveBeenCalled();
    });

    it('should skip Redis initialization when DISABLE_UPSTASH_DURING_BUILD is set', () => {
      process.env.UPSTASH_REDIS_REST_URL = 'http://localhost:8080';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';
      process.env.DISABLE_UPSTASH_DURING_BUILD = '1';

      rateLimit({ max: 1, windowMs: 1000 });

      expect(Redis).not.toHaveBeenCalled();
    });

    it('should handle Redis initialization errors', () => {
      process.env.UPSTASH_REDIS_REST_URL = 'http://localhost:8080';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';

      (Redis as unknown as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Connection failed');
      });

      // Should not throw and fall back to in-memory
      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      expect(limiter).toBeDefined();
    });
  });

  describe('Redis-based rate limiting', () => {
    let mockLimit: jest.Mock;

    beforeEach(() => {
      process.env.UPSTASH_REDIS_REST_URL = 'http://localhost:8080';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';

      mockLimit = jest.fn();
      (Ratelimit as unknown as jest.Mock).mockImplementation(() => ({
        limit: mockLimit,
      }));
    });

    it('should use Redis limiter when available', async () => {
      mockLimit.mockResolvedValue({
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

    it('should use custom key with Redis limiter', async () => {
      mockLimit.mockResolvedValue({
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

    it('should fall back to in-memory if Redis limit call fails', async () => {
      mockLimit.mockRejectedValue(new Error('Redis error'));

      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '5.6.7.8' },
      });

      // First call should succeed (using in-memory fallback)
      const result1 = await limiter(request);
      expect(result1.success).toBe(true);

      // Second call should fail (in-memory limit reached)
      const result2 = await limiter(request);
      expect(result2.success).toBe(false);
    });
  });

  describe('rateLimiters', () => {
    const testCases = [
      { name: 'contactForm', limiter: rateLimiters.contactForm, max: 5, ip: '127.0.0.1' },
      { name: 'apiGeneral', limiter: rateLimiters.apiGeneral, max: 100, ip: '127.0.0.2' },
      { name: 'search', limiter: rateLimiters.search, max: 50, ip: '127.0.0.3' },
    ];

    it.each(testCases)('$name limiter should enforce $max requests limit', async ({ limiter, max, ip }) => {
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': ip },
      });

      for (let i = 0; i < max; i++) {
        const result = await limiter(request);
        expect(result.success).toBe(true);
      }

      const result = await limiter(request);
      expect(result.success).toBe(false);
      expect(result.limit).toBe(max);
    });
  });

  describe('cleanupRateLimitStore', () => {
    it('should remove expired entries', () => {
      const now = Date.now();
      rateLimitStore.set('expired', { count: 1, resetTime: now - 1000 });
      rateLimitStore.set('valid', { count: 1, resetTime: now + 1000 });

      expect(rateLimitStore.size).toBe(2);

      cleanupRateLimitStore();

      expect(rateLimitStore.has('expired')).toBe(false);
      expect(rateLimitStore.has('valid')).toBe(true);
      expect(rateLimitStore.size).toBe(1);
    });
  });

  describe('Edge cases and IP extraction', () => {
    it('should handle x-forwarded-for with multiple IPs correctly', async () => {
      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '  192.168.1.1  , 10.0.0.1' },
      });

      const result = await limiter(request);
      expect(result.success).toBe(true);

      // Check that it's stored under the trimmed first IP
      expect(rateLimitStore.has('192.168.1.1')).toBe(true);
    });

    it.each([
      {
        name: 'x-forwarded-for > x-real-ip',
        headers: { 'x-forwarded-for': '1.1.1.1', 'x-real-ip': '2.2.2.2' },
        expected: '1.1.1.1',
        notExpected: '2.2.2.2',
      },
      {
        name: 'x-real-ip > cf-connecting-ip',
        headers: { 'x-real-ip': '2.2.2.2', 'cf-connecting-ip': '3.3.3.3' },
        expected: '2.2.2.2',
        notExpected: '3.3.3.3',
      },
    ])('should prioritize $name', async ({ headers, expected, notExpected }) => {
      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      const req = new Request('http://localhost', { headers });
      await limiter(req);
      expect(rateLimitStore.has(expected)).toBe(true);
      expect(rateLimitStore.has(notExpected)).toBe(false);
    });

    it('should fall back if header contains invalid IP', async () => {
      const limiter = rateLimit({ max: 1, windowMs: 1000 });

      // Invalid x-forwarded-for should fall back to x-real-ip
      const req1 = new Request('http://localhost', {
        headers: {
          'x-forwarded-for': 'invalid-ip',
          'x-real-ip': '4.4.4.4',
        },
      });
      await limiter(req1);
      expect(rateLimitStore.has('4.4.4.4')).toBe(true);
      expect(rateLimitStore.has('invalid-ip')).toBe(false);

      rateLimitStore.clear();

      // All invalid should fall back to 'unknown'
      const req2 = new Request('http://localhost', {
        headers: {
          'x-forwarded-for': 'not-an-ip',
          'x-real-ip': 'also-not-an-ip',
          'cf-connecting-ip': 'definitely-not-an-ip',
        },
      });
      await limiter(req2);
      expect(rateLimitStore.has('unknown')).toBe(true);
    });
  });
});
