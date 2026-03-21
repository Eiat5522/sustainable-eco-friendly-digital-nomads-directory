/**
 * @jest-environment node
 */

import { afterEach, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Mock Upstash
jest.mock('@upstash/redis', () => {
  return {
    Redis: jest.fn().mockImplementation(() => ({
      // Mock methods if needed
    })),
  };
});

jest.mock('@upstash/ratelimit', () => {
  return {
    Ratelimit: jest.fn().mockImplementation(() => ({
      limit: jest.fn(),
    })),
  };
});

// Important: Need to define static method on the mock
(Ratelimit as any).slidingWindow = jest.fn().mockReturnValue({});

import {
  cleanupRateLimitStore,
  clearRedisClient,
  rateLimit,
  rateLimiters,
  rateLimitStore,
} from '../rate-limit';

// Helper function to reduce code duplication
function createTestRequest(ip?: string): Request {
  const headers: Record<string, string> = {};
  if (ip) {
    headers['x-forwarded-for'] = ip;
  }
  return new Request('http://localhost', { headers });
}

describe('rate-limit', () => {
  // Store original env vars
  const originalEnv = { ...process.env };

  beforeAll(() => {
    // Initial state: Redis not configured
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.DISABLE_UPSTASH_DURING_BUILD;
  });

  beforeEach(() => {
    // Clear the rate limit store before each test
    rateLimitStore.clear();
    // Reset Redis client state
    clearRedisClient();
    // Clear all mocks
    jest.clearAllMocks();

    // Default env for each test
    process.env = { ...originalEnv };
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.DISABLE_UPSTASH_DURING_BUILD;

    // Setup Ratelimit mock static method default
    (Ratelimit as any).slidingWindow.mockReturnValue({});
  });

  afterEach(() => {
    // Restore env vars
    process.env = { ...originalEnv };
  });

  describe('inMemoryRateLimit (fallback)', () => {
    it('should allow requests within the limit', async () => {
      const limiter = rateLimit({ max: 3, windowMs: 1000 });
      const request = createTestRequest('127.0.0.1');

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
      const request = createTestRequest('127.0.0.1');

      await limiter(request);
      await limiter(request);

      const result = await limiter(request);
      expect(result.success).toBe(false);
      expect(result.limit).toBe(2);
      expect(result.remaining).toBe(0);
    });

    it('should track different IPs separately', async () => {
      const limiter = rateLimit({ max: 2, windowMs: 1000 });

      const request1 = createTestRequest('127.0.0.1');
      const request2 = createTestRequest('127.0.0.2');

      await limiter(request1);
      await limiter(request1);

      const result2a = await limiter(request2);
      expect(result2a.success).toBe(true);
      expect(result2a.remaining).toBe(1);
    });

    it('should use custom keyGenerator in pure in-memory mode', async () => {
      const limiter = rateLimit({
        max: 1,
        windowMs: 1000,
        keyGenerator: () => 'custom-key',
      });
      const request = createTestRequest('1.2.3.4');
      await limiter(request);
      expect(rateLimitStore.has('custom-key')).toBe(true);
    });
  });

  describe('getClientIP', () => {
    it('should use x-forwarded-for header (first IP)', async () => {
      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '192.168.1.1, 10.0.0.1' },
      });

      const result = await limiter(request);
      expect(result.success).toBe(true);

      const result2 = await limiter(request);
      expect(result2.success).toBe(false);
      // Verify key in store
      expect(rateLimitStore.has('192.168.1.1')).toBe(true);
    });

    it('should use x-real-ip header if x-forwarded-for is missing', async () => {
      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      const request = new Request('http://localhost', {
        headers: { 'x-real-ip': '192.168.1.2' },
      });

      await limiter(request);
      expect(rateLimitStore.has('192.168.1.2')).toBe(true);
    });

    it('should use cf-connecting-ip header if others are missing', async () => {
      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      const request = new Request('http://localhost', {
        headers: { 'cf-connecting-ip': '192.168.1.3' },
      });

      await limiter(request);
      expect(rateLimitStore.has('192.168.1.3')).toBe(true);
    });

    it('should fallback to "unknown"', async () => {
      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      const request = new Request('http://localhost');

      await limiter(request);
      expect(rateLimitStore.has('unknown')).toBe(true);
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

  describe('Redis Initialization', () => {
    it('should skip Redis if DISABLE_UPSTASH_DURING_BUILD is set', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'http://localhost';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'token';
      process.env.DISABLE_UPSTASH_DURING_BUILD = '1';

      rateLimit({ max: 10, windowMs: 1000 });

      expect(Redis).not.toHaveBeenCalled();
    });

    it('should initialize Redis if credentials are provided', () => {
      process.env.UPSTASH_REDIS_REST_URL = 'http://localhost';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'token';

      rateLimit({ max: 10, windowMs: 1000 });

      expect(Redis).toHaveBeenCalledWith({
        url: 'http://localhost',
        token: 'token',
      });
    });

    it('should handle Redis initialization error', () => {
      process.env.UPSTASH_REDIS_REST_URL = 'http://localhost';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'token';
      (Redis as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Redis init failed');
      });

      const limiter = rateLimit({ max: 10, windowMs: 1000 });
      expect(limiter).toBeDefined();
      // Should fallback to in-memory (tested via its behavior)
    });
  });

  describe('Redis-based rate limiting', () => {
    beforeEach(() => {
      process.env.UPSTASH_REDIS_REST_URL = 'http://localhost';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'token';

      // Setup Ratelimit mock static method
      (Ratelimit as unknown as jest.Mock).mockImplementation(() => ({
        limit: jest.fn(),
      }));
    });

    it('should use Redis when available', async () => {
      const mockLimit = jest.fn().mockResolvedValue({
        success: true,
        limit: 10,
        remaining: 9,
        reset: 123456789,
      });
      (Ratelimit as unknown as jest.Mock).mockImplementation(() => ({
        limit: mockLimit,
      }));

      const limiter = rateLimit({ max: 10, windowMs: 1000 });
      const request = createTestRequest('1.2.3.4');
      const result = await limiter(request);

      expect(mockLimit).toHaveBeenCalledWith('1.2.3.4');
      expect(result).toEqual({
        success: true,
        limit: 10,
        remaining: 9,
        resetTime: 123456789,
      });
    });

    it('should fallback to in-memory if Redis limit call fails', async () => {
      const mockLimit = jest.fn().mockRejectedValue(new Error('Redis error'));
      (Ratelimit as unknown as jest.Mock).mockImplementation(() => ({
        limit: mockLimit,
      }));

      const limiter = rateLimit({ max: 10, windowMs: 1000 });
      const request = createTestRequest('5.6.7.8');

      const result = await limiter(request);

      expect(result.success).toBe(true);
      expect(rateLimitStore.has('5.6.7.8')).toBe(true);
    });

    it('should fallback to in-memory with custom keyGenerator if Redis limit call fails', async () => {
      const mockLimit = jest.fn().mockRejectedValue(new Error('Redis error'));
      (Ratelimit as unknown as jest.Mock).mockImplementation(() => ({
        limit: mockLimit,
      }));

      const limiter = rateLimit({
        max: 10,
        windowMs: 1000,
        keyGenerator: () => 'fallback-custom-key',
      });
      const request = createTestRequest('5.6.7.8');

      await limiter(request);

      expect(rateLimitStore.has('fallback-custom-key')).toBe(true);
    });

    it('should use custom keyGenerator with Redis', async () => {
      const mockLimit = jest.fn().mockResolvedValue({
        success: true,
        limit: 10,
        remaining: 9,
        reset: 123456789,
      });
      (Ratelimit as unknown as jest.Mock).mockImplementation(() => ({
        limit: mockLimit,
      }));

      const limiter = rateLimit({
        max: 10,
        windowMs: 1000,
        keyGenerator: () => 'custom-key',
      });
      const request = createTestRequest('1.2.3.4');
      await limiter(request);

      expect(mockLimit).toHaveBeenCalledWith('custom-key');
    });
  });

  describe('Predefined limiters', () => {
    it('should have contactForm, apiGeneral and search limiters', () => {
      expect(rateLimiters.contactForm).toBeDefined();
      expect(rateLimiters.apiGeneral).toBeDefined();
      expect(rateLimiters.search).toBeDefined();
    });
  });
});
