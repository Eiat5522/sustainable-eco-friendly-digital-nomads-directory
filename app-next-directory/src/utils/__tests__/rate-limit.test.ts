/**
 * @jest-environment node
 */

import { afterEach, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';

// Define mocks before importing the module under test
const mockRedis = jest.fn().mockImplementation(() => ({}));
jest.mock('@upstash/redis', () => ({
  Redis: mockRedis,
}));

jest.mock('validator/lib/isIP.js', () => {
  return jest.fn().mockImplementation(ip => {
    // Basic IP validation mock for tests
    return (
      typeof ip === 'string' &&
      (ip.includes('.') || ip.includes(':')) &&
      !ip.includes('invalid')
    );
  });
});

const mockLimit = jest.fn();
const mockSlidingWindow = jest.fn();
jest.mock('@upstash/ratelimit', () => {
  return {
    Ratelimit: Object.assign(
      jest.fn().mockImplementation(() => ({
        limit: mockLimit,
      })),
      {
        slidingWindow: mockSlidingWindow,
      }
    ),
  };
});

import {
  cleanupRateLimitStore,
  clearRedisClient,
  rateLimit,
  rateLimiters,
  rateLimitStore,
  getClientIP,
} from '../rate-limit';

describe('rate-limit', () => {
  // Store original env vars
  const originalEnv = { ...process.env };

  beforeAll(() => {
    // Ensure Redis is not initialized during tests by default
    process.env.UPSTASH_REDIS_REST_URL = '';
    process.env.UPSTASH_REDIS_REST_TOKEN = '';
    process.env.DISABLE_UPSTASH_DURING_BUILD = '';
    // We want tests to run as if NOT in a worker to cover cleanup logic
    delete process.env.JEST_WORKER_ID;
  });

  beforeEach(() => {
    // Clear the rate limit store before each test
    rateLimitStore.clear();
    // Reset Redis singleton
    clearRedisClient();
    // Mock console.log to avoid noise in test output
    jest.spyOn(console, 'log').mockImplementation(() => {});
    // Mock console.warn to avoid noise from Redis initialization
    jest.spyOn(console, 'warn').mockImplementation(() => {});

    jest.clearAllMocks();

    // Default mock behavior for Ratelimit.limit: REJECT to force in-memory
    mockLimit.mockRejectedValue(new Error('Redis mock not configured for this test'));
  });

  afterEach(() => {
    jest.restoreAllMocks();
    // Restore env vars
    process.env = { ...originalEnv };
  });

  describe('getClientIP', () => {
    it('should use x-forwarded-for header for IP', () => {
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '192.168.1.1, 10.0.0.1' },
      });
      expect(getClientIP(request)).toBe('192.168.1.1');
    });

    it('should use x-real-ip header if x-forwarded-for is not present', () => {
      const request = new Request('http://localhost', {
        headers: { 'x-real-ip': '192.168.1.1' },
      });
      expect(getClientIP(request)).toBe('192.168.1.1');
    });

    it('should use cf-connecting-ip header if others are not present', () => {
      const request = new Request('http://localhost', {
        headers: { 'cf-connecting-ip': '192.168.1.1' },
      });
      expect(getClientIP(request)).toBe('192.168.1.1');
    });

    it('should use "unknown" as fallback if no IP headers present', () => {
      const request = new Request('http://localhost');
      expect(getClientIP(request)).toBe('unknown');
    });

    it('should handle x-forwarded-for with whitespace', () => {
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '  192.168.1.1  , 10.0.0.1' },
      });
      expect(getClientIP(request)).toBe('192.168.1.1');
    });

    it('should fallback to unknown if IP is invalid', () => {
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': 'invalid-ip' },
      });
      expect(getClientIP(request)).toBe('unknown');
    });

    it('should skip invalid IPs in x-forwarded-for and try next header', () => {
      const request = new Request('http://localhost', {
        headers: {
          'x-forwarded-for': 'invalid-ip, 10.0.0.1',
          'x-real-ip': '192.168.1.1',
        },
      });
      // Note: currently getClientIP takes the first candidate of x-forwarded-for
      // and if that is invalid, it DOES NOT try the second candidate of the same header,
      // but it SHOULD try the next header in the list.
      expect(getClientIP(request)).toBe('192.168.1.1');
    });
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

  describe('rateLimitStore', () => {
    it('should cleanup expired entries via cleanupRateLimitStore', async () => {
      const limiter = rateLimit({ max: 1, windowMs: 50 }); // 50ms window
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '192.168.1.100' },
      });

      // Add an entry to the store
      await limiter(request);
      expect(rateLimitStore.size).toBeGreaterThan(0);

      // Manually trigger cleanup by setting expired resetTime
      const entries = Array.from(rateLimitStore.entries());
      if (entries.length > 0) {
        const [key, info] = entries[0];
        rateLimitStore.set(key, { ...info, resetTime: Date.now() - 1000 });

        // Now the entry is expired (resetTime is in the past)
        cleanupRateLimitStore();

        // Should be removed
        expect(rateLimitStore.has(key)).toBe(false);
      }
    });
  });

  describe('Redis initialization', () => {
    it('should not initialize Redis when credentials are missing', async () => {
      process.env.UPSTASH_REDIS_REST_URL = '';
      process.env.UPSTASH_REDIS_REST_TOKEN = '';

      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      const request = new Request('http://localhost');
      await limiter(request);

      expect(mockRedis).not.toHaveBeenCalled();
    });

    it('should initialize Redis when credentials are provided', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://fake-redis.upstash.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'fake-token';

      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      const request = new Request('http://localhost');
      await limiter(request);

      expect(mockRedis).toHaveBeenCalledWith({
        url: 'https://fake-redis.upstash.io',
        token: 'fake-token',
      });
    });

    it('should not initialize Redis when DISABLE_UPSTASH_DURING_BUILD is set', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://fake-redis.upstash.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'fake-token';
      process.env.DISABLE_UPSTASH_DURING_BUILD = '1';

      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      const request = new Request('http://localhost');
      await limiter(request);

      expect(mockRedis).not.toHaveBeenCalled();
    });

    it('should handle Redis constructor error gracefully', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://fake-redis.upstash.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'fake-token';

      mockRedis.mockImplementationOnce(() => {
        throw new Error('Redis connection error');
      });

      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      const request = new Request('http://localhost');
      const result = await limiter(request);

      expect(result).toBeDefined();
      expect(result.success).toBe(true); // Should fall back to in-memory
    });
  });

  describe('Redis-based rate limiting', () => {
    beforeEach(() => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://fake-redis.upstash.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'fake-token';
    });

    it('should use Redis-based limiter when available', async () => {
      const resetTime = Date.now() + 1000;
      mockLimit.mockResolvedValueOnce({
        success: true,
        limit: 10,
        remaining: 5,
        reset: resetTime,
      });

      const limiter = rateLimit({ max: 10, windowMs: 1000 });
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '127.0.0.1' },
      });

      const result = await limiter(request);

      expect(mockLimit).toHaveBeenCalledWith('127.0.0.1');
      expect(result).toEqual({
        success: true,
        limit: 10,
        remaining: 5,
        resetTime,
      });
    });

    it('should fall back to in-memory on Redis error', async () => {
      mockLimit.mockRejectedValueOnce(new Error('Redis error'));

      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '127.0.0.5' },
      });

      // First call fails Redis, falls back to in-memory (success)
      const result1 = await limiter(request);
      expect(result1.success).toBe(true);

      // Second call fails Redis, falls back to in-memory (blocked because max=1)
      mockLimit.mockRejectedValueOnce(new Error('Redis error'));
      const result2 = await limiter(request);
      expect(result2.success).toBe(false);
    });

    it('should use custom key generator with Redis-based limiter', async () => {
      mockLimit.mockResolvedValueOnce({
        success: true,
        limit: 10,
        remaining: 9,
        reset: Date.now() + 1000,
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

    it('should use static slidingWindow in Ratelimit', async () => {
      const limiter = rateLimit({ max: 5, windowMs: 60000 });
      const request = new Request('http://localhost');
      await limiter(request);

      expect(mockSlidingWindow).toHaveBeenCalledWith(5, '60000 ms');
    });
  });

  describe('rateLimiters', () => {
    it('should have contactForm limiter configured correctly', async () => {
      expect(rateLimiters.contactForm).toBeDefined();
      const request = new Request('http://localhost');
      await rateLimiters.contactForm(request);
      expect(mockSlidingWindow).toHaveBeenCalledWith(5, '900000 ms'); // 15 minutes
    });

    it('should have apiGeneral limiter configured correctly', async () => {
      expect(rateLimiters.apiGeneral).toBeDefined();
      const request = new Request('http://localhost');
      await rateLimiters.apiGeneral(request);
      expect(mockSlidingWindow).toHaveBeenCalledWith(100, '3600000 ms'); // 1 hour
    });

    it('should have search limiter configured correctly', async () => {
      expect(rateLimiters.search).toBeDefined();
      const request = new Request('http://localhost');
      await rateLimiters.search(request);
      expect(mockSlidingWindow).toHaveBeenCalledWith(50, '600000 ms'); // 10 minutes
    });
  });
});
