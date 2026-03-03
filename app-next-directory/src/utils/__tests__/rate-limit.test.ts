/**
 * @jest-environment node
 */

import { afterEach, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';

// Define the mocks before anything else to ensure they are used by the imported module
const mockLimit = jest.fn();
const mockSlidingWindow = jest.fn().mockReturnValue('slidingWindow');

jest.mock('@upstash/redis', () => ({
  Redis: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('@upstash/ratelimit', () => ({
  Ratelimit: Object.assign(
    jest.fn().mockImplementation(() => ({
      limit: mockLimit,
    })),
    {
      slidingWindow: mockSlidingWindow,
    }
  ),
}));

import { Redis } from '@upstash/redis';
import {
  cleanupRateLimitStore,
  clearRedisClient,
  rateLimit,
  rateLimiters,
  rateLimitStore,
} from '../rate-limit';

// Shared test helpers
function createTestRequest(ip: string, headers: Record<string, string> = {}): Request {
  const h = new Headers(headers);
  if (ip && !h.has('x-forwarded-for')) h.set('x-forwarded-for', ip);
  return new Request('http://localhost', { headers: h });
}

type RateLimiterFn = (request: Request) => Promise<any>;

async function verifyLimiterCapacity(limiter: RateLimiterFn, max: number, ip: string) {
  const request = createTestRequest(ip);
  for (let i = 0; i < max; i++) {
    const result = await limiter(request);
    expect(result.success).toBe(true);
  }
  const result = await limiter(request);
  expect(result.success).toBe(false);
  expect(result.limit).toBe(max);
}

function setupRedisEnv(enabled: boolean = true) {
  if (enabled) {
    process.env.UPSTASH_REDIS_REST_URL = 'https://fake-redis.upstash.io';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'fake-token';
  } else {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  }
}

describe('rate-limit', () => {
  const originalEnv = { ...process.env };

  beforeAll(() => {
    setupRedisEnv(false);
  });

  beforeEach(() => {
    rateLimitStore.clear();
    clearRedisClient();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.clearAllMocks();
    mockLimit.mockReset();
    mockSlidingWindow.mockClear();
    mockSlidingWindow.mockReturnValue('slidingWindow');
    // Ensure env vars are cleared to avoid leaking between tests
    setupRedisEnv(false);
    delete process.env.DISABLE_UPSTASH_DURING_BUILD;
  });

  afterEach(() => {
    jest.restoreAllMocks();
    process.env = { ...originalEnv };
  });

  describe('rateLimit - core logic', () => {
    it.each([
      ['In-Memory Fallback', false],
      ['Redis-based', true],
    ])('should allow requests within the limit (%s)', async (_, useRedis) => {
      if (useRedis) {
        setupRedisEnv();
        mockLimit.mockResolvedValue({ success: true, limit: 3, remaining: 2, reset: 1000 });
      }

      const limiter = rateLimit({ max: 3, windowMs: 1000 });
      const result = await limiter(createTestRequest('127.0.0.1'));
      expect(result.success).toBe(true);
      expect(result.limit).toBe(3);
    });

    it('should block requests when limit is exceeded (In-Memory)', async () => {
      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      await limiter(createTestRequest('127.0.0.1'));
      expect((await limiter(createTestRequest('127.0.0.1'))).success).toBe(false);
    });

    it('should fallback to In-Memory if Redis call fails', async () => {
      setupRedisEnv();
      mockLimit.mockRejectedValue(new Error('Redis Down'));
      const limiter = rateLimit({ max: 5, windowMs: 60000 });
      const result = await limiter(createTestRequest('9.9.9.9'));
      expect(result.success).toBe(true);
      expect(rateLimitStore.has('9.9.9.9')).toBe(true);
    });
  });

  describe('rateLimiters predefined', () => {
    it.each([
      ['contactForm', rateLimiters.contactForm, 5],
      ['apiGeneral', rateLimiters.apiGeneral, 100],
      ['search', rateLimiters.search, 50],
    ])('should enforce predefined limits for %s', async (_, limiter, max) => {
      await verifyLimiterCapacity(limiter, max, `10.0.0.${max}`);
    });
  });

  describe('Redis initialization', () => {
    it('should handle various initialization scenarios', () => {
      const scenarios = [
        { env: { }, expectedRedis: false },
        { env: { UPSTASH_REDIS_REST_URL: 'u', UPSTASH_REDIS_REST_TOKEN: 't', DISABLE_UPSTASH_DURING_BUILD: '1' }, expectedRedis: false },
        { env: { UPSTASH_REDIS_REST_URL: 'u', UPSTASH_REDIS_REST_TOKEN: 't' }, expectedRedis: true },
      ];

      for (const { env, expectedRedis } of scenarios) {
        clearRedisClient();
        Object.assign(process.env, env);
        rateLimit({ max: 1, windowMs: 1 });
        if (expectedRedis) expect(Redis).toHaveBeenCalled();
        else expect(Redis).not.toHaveBeenCalled();
        // Clean up for next iteration
        for (const k of Object.keys(env)) delete process.env[k];
      }
    });
  });

  describe('IP Extraction', () => {
    it.each([
      ['x-forwarded-for', { 'x-forwarded-for': '1.1.1.1' }, '1.1.1.1'],
      ['x-real-ip', { 'x-real-ip': '2.2.2.2' }, '2.2.2.2'],
      ['cf-connecting-ip', { 'cf-connecting-ip': '3.3.3.3' }, '3.3.3.3'],
      ['priority', { 'x-forwarded-for': '4.4.4.4', 'x-real-ip': '5.5.5.5' }, '4.4.4.4'],
      ['invalid skip', { 'x-forwarded-for': 'bad', 'x-real-ip': '6.6.6.6' }, '6.6.6.6'],
      ['fallback', {}, 'unknown'],
    ])('should correctly extract IP from %s', async (_, headers, expected) => {
      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      // We check if the key in the store (or the one passed to mockLimit) matches the expected IP
      let usedKey = '';
      if (process.env.UPSTASH_REDIS_REST_URL) {
         mockLimit.mockImplementation(async (key: string) => { usedKey = key; return { success: true }; });
      }

      const req = new Request('http://localhost', { headers: new Headers(headers) });
      await limiter(req);

      // For in-memory, we can check the store
      const keys = Array.from(rateLimitStore.keys());
      if (!process.env.UPSTASH_REDIS_REST_URL) {
        expect(keys).toContain(expected);
      }
    });
  });

  describe('Maintenance and Edge cases', () => {
    it('should cleanup expired entries', () => {
      const now = Date.now();
      jest.spyOn(Date, 'now').mockReturnValue(now);
      rateLimitStore.set('expired', { count: 1, resetTime: now - 1 });
      rateLimitStore.set('valid', { count: 1, resetTime: now + 1000 });
      cleanupRateLimitStore();
      expect(rateLimitStore.has('expired')).toBe(false);
      expect(rateLimitStore.has('valid')).toBe(true);
    });

    it('should return correct resetTime (In-Memory)', async () => {
      const windowMs = 5000;
      const limiter = rateLimit({ max: 1, windowMs });
      const before = Date.now();
      const result = await limiter(createTestRequest('127.0.0.1'));
      expect(result.resetTime).toBeGreaterThanOrEqual(before + windowMs);
    });
  });
});
