/**
 * @jest-environment node
 */

import { afterEach, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { cleanupRateLimitStore, clearRedisClient, rateLimit, rateLimiters, rateLimitStore } from '../rate-limit';

// Mock Upstash Redis and Ratelimit
jest.mock('@upstash/redis', () => ({
  Redis: jest.fn().mockImplementation(() => ({
    // Mock methods if needed
  })),
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
  // Store original env vars
  const originalEnv = { ...process.env };

  beforeAll(() => {
    // Default to in-memory by ensuring Redis credentials are missing
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.DISABLE_UPSTASH_DURING_BUILD;
  });

  beforeEach(() => {
    // Reset the singleton
    clearRedisClient();
    // Clear the rate limit store before each test
    rateLimitStore.clear();
    // Clear mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore env vars
    process.env = { ...originalEnv };
  });

  describe('In-memory Rate Limiting (Fallback)', () => {
    it('should allow requests within the limit', async () => {
      const limiter = rateLimit({ max: 3, windowMs: 1000 });
      const request = createTestRequest({ 'x-forwarded-for': '127.0.0.1' });

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
      const request = createTestRequest({ 'x-forwarded-for': '127.0.0.1' });

      await limiter(request); // First request
      await limiter(request); // Second request

      const result = await limiter(request); // Third request should be blocked
      expect(result.success).toBe(false);
      expect(result.limit).toBe(2);
      expect(result.remaining).toBe(0);
    });

    it('should reset count after window expires', async () => {
      const limiter = rateLimit({ max: 1, windowMs: 10 });
      const request = createTestRequest({ 'x-forwarded-for': '127.0.0.1' });

      await limiter(request);
      const blockedResult = await limiter(request);
      expect(blockedResult.success).toBe(false);

      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, 20));

      const newResult = await limiter(request);
      expect(newResult.success).toBe(true);
    });

    it('should track different IPs separately', async () => {
      const limiter = rateLimit({ max: 1, windowMs: 1000 });

      const request1 = createTestRequest({ 'x-forwarded-for': '127.0.0.1' });
      const request2 = createTestRequest({ 'x-forwarded-for': '127.0.0.2' });

      await limiter(request1);
      const result2 = await limiter(request2);
      expect(result2.success).toBe(true);

      const result1Repeat = await limiter(request1);
      expect(result1Repeat.success).toBe(false);
    });

    it('should use custom key generator if provided', async () => {
      const limiter = rateLimit({
        max: 1,
        windowMs: 1000,
        keyGenerator: req => new URL(req.url).searchParams.get('userId') || 'anon',
      });

      const request1 = new Request('http://localhost?userId=user1');
      const request2 = new Request('http://localhost?userId=user2');

      await limiter(request1);
      const result2 = await limiter(request2);
      expect(result2.success).toBe(true);

      const result1Repeat = await limiter(request1);
      expect(result1Repeat.success).toBe(false);
    });
  });

  describe('IP Extraction', () => {
    it('should use first IP in x-forwarded-for', async () => {
      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      const request = createTestRequest({ 'x-forwarded-for': '192.168.1.1, 10.0.0.1' });

      await limiter(request);
      expect(rateLimitStore.has('192.168.1.1')).toBe(true);
    });

    it('should use x-real-ip if x-forwarded-for is missing', async () => {
      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      const request = createTestRequest({ 'x-real-ip': '192.168.1.2' });

      await limiter(request);
      expect(rateLimitStore.has('192.168.1.2')).toBe(true);
    });

    it('should use cf-connecting-ip if others are missing', async () => {
      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      const request = createTestRequest({ 'cf-connecting-ip': '192.168.1.3' });

      await limiter(request);
      expect(rateLimitStore.has('192.168.1.3')).toBe(true);
    });

    it('should fallback to "unknown"', async () => {
      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      const request = createTestRequest();

      await limiter(request);
      expect(rateLimitStore.has('unknown')).toBe(true);
    });
  });

  describe('Redis Initialization & Usage', () => {
    beforeEach(() => {
      process.env.UPSTASH_REDIS_REST_URL = 'http://test-redis.com';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';
    });

    it('should initialize Redis when credentials are provided', async () => {
      rateLimit({ max: 10, windowMs: 1000 });
      expect(Redis).toHaveBeenCalledWith({
        url: 'http://test-redis.com',
        token: 'test-token',
      });
    });

    it('should skip Redis when DISABLE_UPSTASH_DURING_BUILD is set', async () => {
      process.env.DISABLE_UPSTASH_DURING_BUILD = '1';
      rateLimit({ max: 10, windowMs: 1000 });
      expect(Redis).not.toHaveBeenCalled();
    });

    it('should fallback to in-memory if Redis constructor throws', async () => {
      (Redis as unknown as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Redis failed');
      });

      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      const request = createTestRequest({ 'x-forwarded-for': '1.1.1.1' });

      const result = await limiter(request);
      expect(result.success).toBe(true);
      expect(rateLimitStore.has('1.1.1.1')).toBe(true);
    });

    it('should use Redis-based limiter if initialized', async () => {
      const mockLimit = jest.fn().mockResolvedValue({
        success: true,
        limit: 10,
        remaining: 9,
        reset: 123456,
      });

      (Ratelimit as unknown as jest.Mock).mockImplementationOnce(() => ({
        limit: mockLimit,
      }));

      const limiter = rateLimit({ max: 10, windowMs: 1000 });
      const request = createTestRequest({ 'x-forwarded-for': '2.2.2.2' });

      const result = await limiter(request);
      expect(result.success).toBe(true);
      expect(result.resetTime).toBe(123456);
      expect(mockLimit).toHaveBeenCalledWith('2.2.2.2');
    });

    it('should fallback to in-memory if Redis limiter throws', async () => {
      const mockLimit = jest.fn().mockRejectedValue(new Error('Redis limit failed'));

      (Ratelimit as unknown as jest.Mock).mockImplementationOnce(() => ({
        limit: mockLimit,
      }));

      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      const request = createTestRequest({ 'x-forwarded-for': '3.3.3.3' });

      const result = await limiter(request);
      expect(result.success).toBe(true); // Should succeed via in-memory fallback
      expect(rateLimitStore.has('3.3.3.3')).toBe(true);
    });
  });

  describe('cleanupRateLimitStore', () => {
    it('should remove expired entries', () => {
      const now = Date.now();
      rateLimitStore.set('expired', { count: 5, resetTime: now - 1000 });
      rateLimitStore.set('valid', { count: 5, resetTime: now + 1000 });

      cleanupRateLimitStore();

      expect(rateLimitStore.has('expired')).toBe(false);
      expect(rateLimitStore.has('valid')).toBe(true);
    });
  });

  describe('Predefined Rate Limiters', () => {
    it('should expose predefined limiters', () => {
      expect(rateLimiters.contactForm).toBeDefined();
      expect(rateLimiters.apiGeneral).toBeDefined();
      expect(rateLimiters.search).toBeDefined();
    });
  });
});
