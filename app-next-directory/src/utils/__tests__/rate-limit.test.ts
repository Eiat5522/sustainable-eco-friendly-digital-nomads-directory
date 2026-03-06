/**
 * @jest-environment node
 */

import { afterEach, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Mock Upstash Redis and Ratelimit before importing rate-limit
jest.mock('@upstash/redis', () => ({
  Redis: jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    set: jest.fn(),
  })),
}));

const mockSlidingWindow = jest.fn();
jest.mock('@upstash/ratelimit', () => ({
  Ratelimit: jest.fn().mockImplementation(() => ({
    limit: jest.fn(),
  })),
}));

// Add slidingWindow to Ratelimit mock
(Ratelimit as any).slidingWindow = mockSlidingWindow;

import {
  cleanupRateLimitStore,
  clearRedisClient,
  rateLimit,
  rateLimiters,
  rateLimitStore,
} from '../rate-limit';

describe('rate-limit', () => {
  const originalEnv = { ...process.env };
  const TEST_IP = '127.0.0.1';

  const createReq = (ip: string) =>
    new Request('http://localhost', {
      headers: { 'x-forwarded-for': ip },
    });

  beforeAll(() => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.DISABLE_UPSTASH_DURING_BUILD;
  });

  beforeEach(() => {
    rateLimitStore.clear();
    clearRedisClient();
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe('in-memory rate limiting', () => {
    it('enforces limits and resets correctly', async () => {
      const max = 2;
      const limiter = rateLimit({ max, windowMs: 1000 });
      const req = createReq(TEST_IP);

      // Requests 1 & 2: Success
      for (let i = 1; i <= max; i++) {
        const res = await limiter(req);
        expect(res.success).toBe(true);
        expect(res.remaining).toBe(max - i);
      }

      // Request 3: Blocked
      expect((await limiter(req)).success).toBe(false);

      // Simulate expiration
      const info = rateLimitStore.get(TEST_IP);
      if (info) rateLimitStore.set(TEST_IP, { ...info, resetTime: Date.now() - 1000 });

      // Request 4: Success again
      const resAfter = await limiter(req);
      expect(resAfter.success).toBe(true);
      expect(resAfter.remaining).toBe(max - 1);
    });

    it('isolates different IPs', async () => {
      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      expect((await limiter(createReq('1.1.1.1'))).success).toBe(true);
      expect((await limiter(createReq('1.1.1.1'))).success).toBe(false);
      expect((await limiter(createReq('2.2.2.2'))).success).toBe(true);
    });
  });

  describe('IP extraction headers', () => {
    const testHeader = async (headers: Record<string, string>, expectedIp: string) => {
      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      const req = new Request('http://localhost', { headers });
      await limiter(req);
      expect(rateLimitStore.has(expectedIp)).toBe(true);
    };

    it('supports various IP headers', async () => {
      await testHeader({ 'x-forwarded-for': '10.0.0.1, 10.0.0.2' }, '10.0.0.1');
      rateLimitStore.clear();
      await testHeader({ 'x-real-ip': '10.0.0.3' }, '10.0.0.3');
      rateLimitStore.clear();
      await testHeader({ 'cf-connecting-ip': '10.0.0.4' }, '10.0.0.4');
    });

    it('falls back to unknown', async () => {
      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      await limiter(new Request('http://localhost'));
      expect(rateLimitStore.has('unknown')).toBe(true);
    });
  });

  describe('Redis integration', () => {
    const setupRedisEnv = () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://fake.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'token';
    };

    it('uses Redis when configured', async () => {
      setupRedisEnv();
      const mockLimit = jest.fn().mockResolvedValue({ success: true, limit: 5, remaining: 4, reset: 100 });
      (Ratelimit as unknown as jest.Mock).mockImplementation(() => ({ limit: mockLimit }));

      const res = await rateLimit({ max: 5, windowMs: 1000 })(createReq(TEST_IP));
      expect(res.success).toBe(true);
      expect(Redis).toHaveBeenCalled();
      expect(mockLimit).toHaveBeenCalledWith(TEST_IP);
    });

    it('falls back on Redis errors', async () => {
      setupRedisEnv();
      (Redis as unknown as jest.Mock).mockImplementation(() => { throw new Error('fail'); });
      const res = await rateLimit({ max: 1, windowMs: 1000 })(createReq(TEST_IP));
      expect(res.success).toBe(true);
      expect(rateLimitStore.has(TEST_IP)).toBe(true);
    });
  });

  it('provides configured limiters', () => {
    ['contactForm', 'apiGeneral', 'search'].forEach(key => {
      expect(rateLimiters[key as keyof typeof rateLimiters]).toBeDefined();
    });
  });

  it('cleans up store', () => {
    const now = Date.now();
    rateLimitStore.set('old', { count: 1, resetTime: now - 1 });
    rateLimitStore.set('new', { count: 1, resetTime: now + 1000 });
    cleanupRateLimitStore();
    expect(rateLimitStore.has('old')).toBe(false);
    expect(rateLimitStore.has('new')).toBe(true);
  });
});
