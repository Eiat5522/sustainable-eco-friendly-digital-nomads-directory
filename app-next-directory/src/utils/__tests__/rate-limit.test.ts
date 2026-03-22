/**
 * @jest-environment node
 */

import { afterEach, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { cleanupRateLimitStore, clearRedisClient, rateLimit, rateLimiters, rateLimitStore } from '../rate-limit';

// Mock Upstash Redis and Ratelimit
jest.mock('@upstash/redis', () => ({
  Redis: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('@upstash/ratelimit', () => {
  const mockSlidingWindow = jest.fn().mockReturnValue({});
  return {
    Ratelimit: Object.assign(
      jest.fn().mockImplementation(() => ({
        limit: jest.fn(),
      })),
      {
        slidingWindow: mockSlidingWindow,
      }
    ),
  };
});

// Helper function to create a mock request
function createTestRequest(headers: Record<string, string> = {}): Request {
  return new Request('http://localhost', {
    headers: new Headers(headers),
  });
}

describe('rate-limit', () => {
  const originalEnv = { ...process.env };

  beforeAll(() => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.DISABLE_UPSTASH_DURING_BUILD;
  });

  beforeEach(() => {
    clearRedisClient();
    rateLimitStore.clear();
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe('In-memory Rate Limiting (Fallback)', () => {
    it('should allow requests within the limit', async () => {
      const limiter = rateLimit({ max: 3, windowMs: 1000 });
      const request = createTestRequest({ 'x-forwarded-for': '127.0.0.1' });

      expect((await limiter(request)).remaining).toBe(2);
      expect((await limiter(request)).remaining).toBe(1);
      expect((await limiter(request)).remaining).toBe(0);
      expect((await limiter(request)).success).toBe(false);
    });

    it('should reset count after window expires', async () => {
      const limiter = rateLimit({ max: 1, windowMs: 10 });
      const request = createTestRequest({ 'x-forwarded-for': '127.0.0.1' });

      await limiter(request);
      expect((await limiter(request)).success).toBe(false);

      await new Promise(resolve => setTimeout(resolve, 20));
      expect((await limiter(request)).success).toBe(true);
    });

    it('should track different keys separately', async () => {
      const limiter = rateLimit({
        max: 1,
        windowMs: 1000,
        keyGenerator: req => new URL(req.url).searchParams.get('userId') || 'anon',
      });

      expect((await limiter(new Request('http://localhost?userId=u1'))).success).toBe(true);
      expect((await limiter(new Request('http://localhost?userId=u2'))).success).toBe(true);
      expect((await limiter(new Request('http://localhost?userId=u1'))).success).toBe(false);
    });
  });

  describe('IP Extraction', () => {
    it.each([
      ['x-forwarded-for', '192.168.1.1, 10.0.0.1', '192.168.1.1'],
      ['x-real-ip', '192.168.1.2', '192.168.1.2'],
      ['cf-connecting-ip', '192.168.1.3', '192.168.1.3'],
    ])('should use valid %s header', async (header, value, expected) => {
      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      await limiter(createTestRequest({ [header]: value }));
      expect(rateLimitStore.has(expected)).toBe(true);
    });

    it('should fallback when IP is invalid or missing', async () => {
      const limiter = rateLimit({ max: 1, windowMs: 1000 });

      // Invalid in x-forwarded-for, fallback to x-real-ip
      await limiter(createTestRequest({ 'x-forwarded-for': 'invalid', 'x-real-ip': '1.1.1.1' }));
      expect(rateLimitStore.has('1.1.1.1')).toBe(true);

      // All invalid, fallback to unknown
      rateLimitStore.clear();
      await limiter(createTestRequest({ 'x-forwarded-for': 'invalid', 'x-real-ip': 'invalid' }));
      expect(rateLimitStore.has('unknown')).toBe(true);
    });

    it('should handle empty x-forwarded-for', async () => {
      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      await limiter(createTestRequest({ 'x-forwarded-for': '' }));
      expect(rateLimitStore.has('unknown')).toBe(true);
    });
  });

  describe('Redis Initialization & Usage', () => {
    beforeEach(() => {
      process.env.UPSTASH_REDIS_REST_URL = 'http://test-redis.com';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';
    });

    it('should handle Redis initialization and build-time skip', async () => {
      rateLimit({ max: 10, windowMs: 1000 });
      expect(Redis).toHaveBeenCalled();

      jest.clearAllMocks();
      clearRedisClient();
      process.env.DISABLE_UPSTASH_DURING_BUILD = '1';
      rateLimit({ max: 10, windowMs: 1000 });
      expect(Redis).not.toHaveBeenCalled();
    });

    it('should handle partial Redis credentials', () => {
      process.env.UPSTASH_REDIS_REST_URL = 'http://test';
      delete process.env.UPSTASH_REDIS_REST_TOKEN;
      rateLimit({ max: 10, windowMs: 1000 });
      expect(Redis).not.toHaveBeenCalled();
    });

    it('should fallback if Redis constructor or limiter fails', async () => {
      (Redis as unknown as jest.Mock).mockImplementationOnce(() => { throw new Error(); });
      const limiter1 = rateLimit({ max: 1, windowMs: 1000 });
      await limiter1(createTestRequest({ 'x-forwarded-for': '1.1.1.1' }));
      expect(rateLimitStore.has('1.1.1.1')).toBe(true);

      const mockLimit = jest.fn().mockRejectedValue(new Error());
      (Ratelimit as unknown as jest.Mock).mockImplementationOnce(() => ({ limit: mockLimit }));
      clearRedisClient();
      const limiter2 = rateLimit({ max: 1, windowMs: 1000 });
      await limiter2(createTestRequest({ 'x-forwarded-for': '2.2.2.2' }));
      expect(rateLimitStore.has('2.2.2.2')).toBe(true);
    });

    it('should use custom key generator in fallback if Redis limiter throws', async () => {
      const mockLimit = jest.fn().mockRejectedValue(new Error());
      (Ratelimit as unknown as jest.Mock).mockImplementationOnce(() => ({ limit: mockLimit }));

      const customKeyGen = jest.fn().mockReturnValue('custom-key');
      const limiter = rateLimit({ max: 1, windowMs: 1000, keyGenerator: customKeyGen });

      await limiter(createTestRequest());
      expect(customKeyGen).toHaveBeenCalled();
      expect(rateLimitStore.has('custom-key')).toBe(true);
    });

    it('should use Redis-based limiter if available', async () => {
      const mockLimit = jest.fn().mockResolvedValue({ success: true, limit: 10, remaining: 9, reset: 123 });
      (Ratelimit as unknown as jest.Mock).mockImplementationOnce(() => ({ limit: mockLimit }));
      const result = await rateLimit({ max: 10, windowMs: 1000 })(createTestRequest({ 'x-forwarded-for': '3.3.3.3' }));
      expect(result.resetTime).toBe(123);
      expect(mockLimit).toHaveBeenCalledWith('3.3.3.3');
    });
  });

  it('cleanupRateLimitStore should remove expired entries', () => {
    const now = Date.now();
    rateLimitStore.set('exp', { count: 1, resetTime: now - 1 });
    rateLimitStore.set('val', { count: 1, resetTime: now + 1000 });
    cleanupRateLimitStore();
    expect(rateLimitStore.has('exp')).toBe(false);
    expect(rateLimitStore.has('val')).toBe(true);
  });

  describe('Predefined Limiters', () => {
    it.each([
      ['contactForm', 5],
      ['apiGeneral', 100],
      ['search', 50],
    ])('limiter %s should enforce %i limit', async (name, max) => {
      const limiter = (rateLimiters as any)[name];
      const req = createTestRequest({ 'x-forwarded-for': `10.0.0.${name}` });
      for (let i = 0; i < max; i++) expect((await limiter(req)).success).toBe(true);
      expect((await limiter(req)).success).toBe(false);
    });
  });
});
