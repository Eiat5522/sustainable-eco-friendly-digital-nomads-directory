/**
 * @jest-environment node
 */

import { afterEach, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

// Mock Upstash MUST be before imports of modules that use them
jest.mock('@upstash/redis');
jest.mock('@upstash/ratelimit', () => {
  const mockRatelimit = jest.fn().mockImplementation(() => ({
    limit: jest.fn(),
  }));
  (mockRatelimit as any).slidingWindow = jest.fn().mockReturnValue('mock-limiter');
  return {
    Ratelimit: mockRatelimit,
  };
});

import {
  rateLimit,
  rateLimiters,
  rateLimitStore,
  clearRedisClient,
  cleanupRateLimitStore,
} from '../rate-limit';

// Helper function to reduce code duplication
function createTestRequest(headers: Record<string, string>): Request {
  return new Request('http://localhost', { headers });
}

describe('rate-limit', () => {
  const originalEnv = { ...process.env };

  beforeAll(() => {
    process.env.UPSTASH_REDIS_REST_URL = '';
    process.env.UPSTASH_REDIS_REST_TOKEN = '';
  });

  beforeEach(() => {
    rateLimitStore.clear();
    clearRedisClient();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    process.env = { ...originalEnv };
  });

  describe('rateLimit in-memory', () => {
    it('should allow requests within the limit', async () => {
      const limiter = rateLimit({ max: 3, windowMs: 1000 });
      const request = createTestRequest({ 'x-forwarded-for': '127.0.0.1' });

      const results = [await limiter(request), await limiter(request), await limiter(request)];

      expect(results[0]).toMatchObject({ success: true, limit: 3, remaining: 2 });
      expect(results[1].remaining).toBe(1);
      expect(results[2].remaining).toBe(0);
    });

    it('should block requests when limit is exceeded', async () => {
      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      const request = createTestRequest({ 'x-forwarded-for': '127.0.0.1' });

      await limiter(request);
      const blocked = await limiter(request);

      expect(blocked.success).toBe(false);
      expect(blocked.remaining).toBe(0);
    });

    it('should track different IPs separately', async () => {
      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      const req1 = createTestRequest({ 'x-forwarded-for': '1.1.1.1' });
      const req2 = createTestRequest({ 'x-forwarded-for': '2.2.2.2' });

      expect((await limiter(req1)).success).toBe(true);
      expect((await limiter(req2)).success).toBe(true);
      expect((await limiter(req1)).success).toBe(false);
    });
  });

  describe('IP Extraction & Validation', () => {
    beforeEach(() => {
      process.env.UPSTASH_REDIS_REST_URL = '';
      process.env.UPSTASH_REDIS_REST_TOKEN = '';
      clearRedisClient();
    });

    it.each([
      ['x-forwarded-for', '192.168.1.1', '192.168.1.1'],
      ['x-forwarded-for', '1.2.3.4, 5.6.7.8', '1.2.3.4'],
      ['x-real-ip', '10.0.0.1', '10.0.0.1'],
      ['cf-connecting-ip', '172.16.0.1', '172.16.0.1'],
      ['x-forwarded-for', 'invalid-ip', 'unknown'],
    ])('should use %s header and extract %s', async (header, value, expectedIp) => {
      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      const req = createTestRequest({ [header]: value });

      await limiter(req);

      // If expectedIp is 'unknown', it should be shared with a request with no headers
      const reqUnknown = createTestRequest({});
      const result = await limiter(reqUnknown);

      expect(result.success).toBe(expectedIp === 'unknown' ? false : true);
    });

    it('should prioritize headers correctly', async () => {
      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      const req = createTestRequest({
        'x-forwarded-for': '1.1.1.1',
        'x-real-ip': '2.2.2.2'
      });

      await limiter(req);
      // Should have used 1.1.1.1. So 2.2.2.2 should still be allowed.
      expect((await limiter(createTestRequest({ 'x-real-ip': '2.2.2.2' }))).success).toBe(true);
      // But 1.1.1.1 should be blocked.
      expect((await limiter(createTestRequest({ 'x-forwarded-for': '1.1.1.1' }))).success).toBe(false);
    });
  });

  describe('Predefined limiters', () => {
    it.each([
      ['contactForm', 5],
      ['apiGeneral', 100],
      ['search', 50],
    ])('%s limiter should enforce %i requests limit', async (name, max) => {
      const limiter = (rateLimiters as any)[name];
      const req = createTestRequest({ 'x-forwarded-for': `10.0.1.${name}` }); // Change IP to ensure fresh limit

      for (let i = 0; i < max; i++) {
        expect((await limiter(req)).success).toBe(true);
      }
      expect((await limiter(req)).success).toBe(false);
    });
  });

  describe('Redis initialization', () => {
    it.each([
      ['missing credentials', '', '', false],
      ['valid credentials', 'http://redis', 'token', true],
      ['disabled during build', 'http://redis', 'token', false, '1'],
    ])('should handle %s', (desc, url, token, shouldInit, disableBuild = '0') => {
      process.env.UPSTASH_REDIS_REST_URL = url;
      process.env.UPSTASH_REDIS_REST_TOKEN = token;
      process.env.DISABLE_UPSTASH_DURING_BUILD = disableBuild;
      clearRedisClient();

      rateLimit({ max: 1, windowMs: 1000 });

      if (shouldInit) {
        expect(Redis).toHaveBeenCalled();
      } else {
        expect(Redis).not.toHaveBeenCalled();
      }
    });

    it('should handle Redis initialization error', () => {
      process.env.UPSTASH_REDIS_REST_URL = 'http://redis';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'token';
      (Redis as unknown as jest.Mock).mockImplementationOnce(() => { throw new Error(); });

      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      expect(limiter).toBeDefined();
    });
  });

  describe('Redis-based rate limiting', () => {
    let mockLimit: jest.Mock;

    beforeEach(() => {
      process.env.UPSTASH_REDIS_REST_URL = 'http://redis';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'token';
      mockLimit = jest.fn();
      (Ratelimit as unknown as jest.Mock).mockImplementation(() => ({ limit: mockLimit }));
    });

    it('should use Redis limiter when available', async () => {
      mockLimit.mockResolvedValue({ success: true, limit: 10, remaining: 9, reset: 12345 });
      const limiter = rateLimit({ max: 10, windowMs: 1000 });
      const result = await limiter(createTestRequest({ 'x-forwarded-for': '1.2.3.4' }));

      expect(result).toMatchObject({ success: true, remaining: 9, resetTime: 12345 });
      expect(mockLimit).toHaveBeenCalledWith('1.2.3.4');
    });

    it('should fallback to in-memory if Redis limiter throws', async () => {
      mockLimit.mockRejectedValue(new Error());
      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      const req = createTestRequest({ 'x-forwarded-for': '1.2.3.5' });

      expect((await limiter(req)).success).toBe(true);
      expect((await limiter(req)).success).toBe(false);
    });
  });

  describe('rateLimitStore & Cleanup', () => {
    it('should cleanup expired entries via cleanupRateLimitStore', async () => {
      const limiter = rateLimit({ max: 1, windowMs: 50 });
      await limiter(createTestRequest({ 'x-forwarded-for': '1.1.1.1' }));

      const [key, info] = Array.from(rateLimitStore.entries())[0];
      rateLimitStore.set(key, { ...info, resetTime: Date.now() - 1000 });

      cleanupRateLimitStore();
      expect(rateLimitStore.has(key)).toBe(false);
    });
  });
});
