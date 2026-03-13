/**
 * @jest-environment node
 */

import { afterEach, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';

// Mock Upstash dependencies before importing rate-limit
const mockRedisInstance = {
  url: 'https://test.upstash.io',
  token: 'test-token',
};

const mockRatelimitLimit = jest.fn();
const mockRatelimitInstance = {
  limit: mockRatelimitLimit,
};

// Use factory functions for mocks to satisfy SonarCloud and handle hoisting
jest.mock('@upstash/redis', () => ({
  Redis: jest.fn().mockImplementation(() => mockRedisInstance),
}));

jest.mock('@upstash/ratelimit', () => ({
  Ratelimit: Object.assign(
    jest.fn().mockImplementation(() => mockRatelimitInstance),
    {
      slidingWindow: jest.fn().mockReturnValue('sliding-window-mock'),
    }
  ),
}));

// Now import the utility
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
  // Store original env vars
  const originalEnv = { ...process.env };

  beforeAll(() => {
    // Start with a clean environment for Redis
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.DISABLE_UPSTASH_DURING_BUILD;
  });

  beforeEach(() => {
    // Reset singleton and store
    clearRedisClient();
    rateLimitStore.clear();

    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});

    // Clear mocks
    jest.clearAllMocks();
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

      await limiter(request);
      await limiter(request);

      const result = await limiter(request);
      expect(result.success).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should reset count after window expires (in-memory)', async () => {
      const limiter = rateLimit({ max: 1, windowMs: 100 });
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '127.0.0.1' },
      });

      await limiter(request);
      expect((await limiter(request)).success).toBe(false);

      // Simulate expiration
      const entry = rateLimitStore.get('127.0.0.1');
      if (entry) {
        entry.resetTime = Date.now() - 1000;
      }

      const result = await limiter(request);
      expect(result.success).toBe(true);
      expect(result.remaining).toBe(0);
    });

    it('should track different IPs separately', async () => {
      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      const request1 = new Request('http://localhost', { headers: { 'x-forwarded-for': '1.1.1.1' } });
      const request2 = new Request('http://localhost', { headers: { 'x-forwarded-for': '2.2.2.2' } });

      expect((await limiter(request1)).success).toBe(true);
      expect((await limiter(request2)).success).toBe(true);
      expect((await limiter(request1)).success).toBe(false);
    });
  });

  describe('IP Extraction', () => {
    it.each([
      ['x-forwarded-for', '192.168.1.1', '192.168.1.1'],
      ['x-forwarded-for', '1.1.1.1, 2.2.2.2', '1.1.1.1'],
      ['x-real-ip', '10.0.0.1', '10.0.0.1'],
      ['cf-connecting-ip', '172.16.0.1', '172.16.0.1'],
    ])('should extract IP from %s header', async (header, value, expected) => {
      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      const request = new Request('http://localhost', {
        headers: { [header]: value },
      });

      await limiter(request);
      expect(rateLimitStore.has(expected)).toBe(true);
    });

    it('should use "unknown" if no IP headers are present', async () => {
      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      const request = new Request('http://localhost');

      await limiter(request);
      expect(rateLimitStore.has('unknown')).toBe(true);
    });
  });

  describe('Redis-based Rate Limiting', () => {
    beforeEach(() => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://test.upstash.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';
    });

    it('should initialize Redis and use Ratelimit when credentials are present', async () => {
      mockRatelimitLimit.mockResolvedValue({
        success: true,
        limit: 10,
        remaining: 9,
        reset: Date.now() + 1000,
      });

      const limiter = rateLimit({ max: 10, windowMs: 1000 });
      const request = new Request('http://localhost', { headers: { 'x-real-ip': '8.8.8.8' } });

      const result = await limiter(request);

      expect(Redis).toHaveBeenCalled();
      expect(Ratelimit).toHaveBeenCalled();
      expect(mockRatelimitLimit).toHaveBeenCalledWith('8.8.8.8');
      expect(result.success).toBe(true);
    });

    it('should fallback to in-memory if Redis operations throw', async () => {
      mockRatelimitLimit.mockRejectedValue(new Error('Redis Down'));

      const limiter = rateLimit({ max: 5, windowMs: 1000 });
      const request = new Request('http://localhost', { headers: { 'x-real-ip': '9.9.9.9' } });

      const result = await limiter(request);

      expect(result.success).toBe(true);
      expect(result.remaining).toBe(4);
      expect(rateLimitStore.has('9.9.9.9')).toBe(true);
    });

    it('should skip Redis if DISABLE_UPSTASH_DURING_BUILD is set', async () => {
      process.env.DISABLE_UPSTASH_DURING_BUILD = '1';

      const limiter = rateLimit({ max: 5, windowMs: 1000 });
      const request = new Request('http://localhost', { headers: { 'x-real-ip': 'build-ip' } });

      await limiter(request);

      expect(Redis).not.toHaveBeenCalled();
      expect(rateLimitStore.has('build-ip')).toBe(true);
    });

    it('should handle Redis constructor errors', async () => {
      (Redis as unknown as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Config Error');
      });

      const limiter = rateLimit({ max: 5, windowMs: 1000 });
      const request = new Request('http://localhost', { headers: { 'x-real-ip': 'error-ip' } });

      await limiter(request);
      expect(rateLimitStore.has('error-ip')).toBe(true);
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

  describe('Predefined Rate Limiters', () => {
    it('should have contactForm, apiGeneral, and search limiters', () => {
      expect(rateLimiters.contactForm).toBeDefined();
      expect(rateLimiters.apiGeneral).toBeDefined();
      expect(rateLimiters.search).toBeDefined();
    });

    it('contactForm should have max 5', async () => {
      const request = new Request('http://localhost', { headers: { 'x-real-ip': 'cf-ip' } });
      for (let i = 0; i < 5; i++) {
        expect((await rateLimiters.contactForm(request)).success).toBe(true);
      }
      expect((await rateLimiters.contactForm(request)).success).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle custom key generator', async () => {
      const limiter = rateLimit({
        max: 1,
        windowMs: 1000,
        keyGenerator: (req) => req.headers.get('custom-id') || 'anon',
      });

      const req1 = new Request('http://localhost', { headers: { 'custom-id': 'user1' } });
      const req2 = new Request('http://localhost', { headers: { 'custom-id': 'user1' } });

      expect((await limiter(req1)).success).toBe(true);
      expect((await limiter(req2)).success).toBe(false);
    });

    it('should handle malformed x-forwarded-for', async () => {
      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '' },
      });

      await limiter(request);
      // Fallback to 'unknown' since x-forwarded-for is empty and no other headers
      expect(rateLimitStore.has('unknown')).toBe(true);
    });
  });
});
