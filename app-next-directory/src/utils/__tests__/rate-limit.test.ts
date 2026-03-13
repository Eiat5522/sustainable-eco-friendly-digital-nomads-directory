/**
 * @jest-environment node
 */

import { afterEach, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';

// Mock Upstash dependencies before importing rate-limit
const mockRedisInstance = { url: 'https://test.upstash.io', token: 'test-token' };
const mockRatelimitLimit = jest.fn();
const mockRatelimitInstance = { limit: mockRatelimitLimit };

jest.mock('@upstash/redis', () => ({
  Redis: jest.fn().mockImplementation(() => mockRedisInstance),
}));

jest.mock('@upstash/ratelimit', () => ({
  Ratelimit: Object.assign(
    jest.fn().mockImplementation(() => mockRatelimitInstance),
    { slidingWindow: jest.fn().mockReturnValue('sliding-window-mock') }
  ),
}));

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
  const originalEnv = { ...process.env };

  beforeAll(() => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.DISABLE_UPSTASH_DURING_BUILD;
  });

  beforeEach(() => {
    clearRedisClient();
    rateLimitStore.clear();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    process.env = { ...originalEnv };
  });

  describe('rateLimit', () => {
    it('should enforce limits in-memory', async () => {
      const limiter = rateLimit({ max: 2, windowMs: 1000 });
      const req = new Request('http://localhost', { headers: { 'x-real-ip': '1.1.1.1' } });

      expect((await limiter(req)).success).toBe(true);
      expect((await limiter(req)).success).toBe(true);
      expect((await limiter(req)).success).toBe(false);
    });

    it('should reset after expiry', async () => {
      const limiter = rateLimit({ max: 1, windowMs: 100 });
      const req = new Request('http://localhost', { headers: { 'x-real-ip': '1.1.1.1' } });

      await limiter(req);
      const entry = rateLimitStore.get('1.1.1.1');
      if (entry) entry.resetTime = Date.now() - 1000;

      expect((await limiter(req)).success).toBe(true);
    });
  });

  describe('IP Extraction Integration', () => {
    it.each([
      ['x-forwarded-for', '1.2.3.4, 5.6.7.8', '1.2.3.4'],
      ['x-real-ip', '10.0.0.1', '10.0.0.1'],
      ['cf-connecting-ip', '172.16.0.1', '172.16.0.1'],
    ])('should use IP from %s', async (header, value, expected) => {
      const limiter = rateLimit({ max: 1, windowMs: 1000 });
      const req = new Request('http://localhost', { headers: { [header]: value } });

      await limiter(req);
      expect(rateLimitStore.has(expected)).toBe(true);
    });
  });

  describe('Redis-based Rate Limiting', () => {
    beforeEach(() => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://test.upstash.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';
    });

    it('should use Redis when available', async () => {
      mockRatelimitLimit.mockResolvedValue({ success: true, limit: 10, remaining: 9, reset: Date.now() });
      const limiter = rateLimit({ max: 10, windowMs: 1000 });
      const req = new Request('http://localhost', { headers: { 'x-real-ip': '8.8.8.8' } });

      await limiter(req);
      expect(Redis).toHaveBeenCalled();
      expect(Ratelimit).toHaveBeenCalled();
    });

    it('should fallback on Redis failure', async () => {
      mockRatelimitLimit.mockRejectedValue(new Error('Redis Down'));
      const limiter = rateLimit({ max: 5, windowMs: 1000 });
      const req = new Request('http://localhost', { headers: { 'x-real-ip': '9.9.9.9' } });

      expect((await limiter(req)).success).toBe(true);
      expect(rateLimitStore.has('9.9.9.9')).toBe(true);
    });

    it('should skip Redis during build', async () => {
      process.env.DISABLE_UPSTASH_DURING_BUILD = '1';
      const limiter = rateLimit({ max: 5, windowMs: 1000 });
      const req = new Request('http://localhost', { headers: { 'x-real-ip': '1.2.3.4' } });

      await limiter(req);
      expect(Redis).not.toHaveBeenCalled();
    });
  });

  describe('Maintenance', () => {
    it('cleanupRateLimitStore should remove expired', () => {
      const now = Date.now();
      rateLimitStore.set('exp', { count: 1, resetTime: now - 1000 });
      rateLimitStore.set('val', { count: 1, resetTime: now + 1000 });
      cleanupRateLimitStore();
      expect(rateLimitStore.has('exp')).toBe(false);
      expect(rateLimitStore.has('val')).toBe(true);
    });

    it('predefined limiters should exist', () => {
      expect(rateLimiters.contactForm).toBeDefined();
      expect(rateLimiters.apiGeneral).toBeDefined();
      expect(rateLimiters.search).toBeDefined();
    });
  });
});
