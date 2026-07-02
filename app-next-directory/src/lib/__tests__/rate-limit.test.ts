/**
 * @jest-environment node
 */

import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { Ratelimit } from '@upstash/ratelimit';

// Unmock for this test file as it is mocked globally in jest.setup.ts
jest.unmock('../rate-limit');

// Mock dependencies
jest.mock('@upstash/ratelimit', () => {
  return {
    Ratelimit: jest.fn().mockImplementation(() => ({
      limit: jest.fn()
    })),
  };
});

// Mock static methods
(Ratelimit as any).slidingWindow = jest.fn();

jest.mock('@/lib/redis', () => ({
  getRedisClient: jest.fn(),
  onRedisClientChange: jest.fn()
}));

const mockWarn = jest.fn();
jest.mock('@/lib/logger', () => ({
  structuredLogger: {
    warn: mockWarn
  }
}));

import {
  getClientIp,
  isRateLimited,
  getRetryAfterMs,
  resetRateLimiters,
  clearRateLimiters
} from '../rate-limit';
import { getRedisClient } from '@/lib/redis';

describe('lib/rate-limit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getRedisClient as jest.Mock).mockReturnValue(null);
    resetRateLimiters();
  });

  describe('getClientIp', () => {
    it('should use x-forwarded-for header for IP', () => {
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '1.2.3.4, 10.0.0.1' },
      });
      expect(getClientIp(request)).toBe('1.2.3.4');
    });

    it('should use x-real-ip header if x-forwarded-for is not present', () => {
      const request = new Request('http://localhost', {
        headers: { 'x-real-ip': '2.2.2.2' },
      });
      expect(getClientIp(request)).toBe('2.2.2.2');
    });

    it('should use cf-connecting-ip header if others are not present', () => {
      const request = new Request('http://localhost', {
        headers: { 'cf-connecting-ip': '3.3.3.3' },
      });
      expect(getClientIp(request)).toBe('3.3.3.3');
    });

    it('should return "unknown" if no IP headers are present', () => {
      const request = new Request('http://localhost');
      expect(getClientIp(request)).toBe('unknown');
    });

    it('should return "unknown" if IP is invalid', () => {
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': 'not-an-ip' },
      });
      expect(getClientIp(request)).toBe('unknown');
    });
  });

  describe('isRateLimited', () => {
    it('should return false if limiter is not available', async () => {
      clearRateLimiters();
      const result = await isRateLimited('test-key');
      expect(result).toBe(false);
    });

    it('should handle errors by returning false', async () => {
      const mockLimit = jest.fn().mockRejectedValue(new Error('Redis error'));
      (Ratelimit as unknown as jest.Mock).mockImplementation(() => ({
        limit: mockLimit
      }));
      (getRedisClient as jest.Mock).mockReturnValue({ some: 'redis' });
      resetRateLimiters();

      const result = await isRateLimited('test-key');
      expect(result).toBe(false);
      expect(mockLimit).toHaveBeenCalled();
      expect(mockWarn).toHaveBeenCalledWith(
        '[rate-limit] Error checking rate limit',
        expect.any(Error),
        expect.any(Object)
      );
    });

    it('should return true if rate limited', async () => {
      const mockLimit = jest.fn().mockResolvedValue({ success: false });
      (Ratelimit as unknown as jest.Mock).mockImplementation(() => ({
        limit: mockLimit
      }));
      (getRedisClient as jest.Mock).mockReturnValue({ some: 'redis' });
      resetRateLimiters();

      const result = await isRateLimited('test-key');
      expect(result).toBe(true);
    });
  });

  describe('getRetryAfterMs', () => {
    it('should return 0 if limiter is not available', async () => {
      clearRateLimiters();
      const result = await getRetryAfterMs('test-key');
      expect(result).toBe(0);
    });

    it('should return reset time minus now', async () => {
      const now = Date.now();
      const mockLimit = jest.fn().mockResolvedValue({
        success: false,
        reset: now + 5000
      });
      (Ratelimit as unknown as jest.Mock).mockImplementation(() => ({
        limit: mockLimit
      }));
      (getRedisClient as jest.Mock).mockReturnValue({ some: 'redis' });
      resetRateLimiters();

      const result = await getRetryAfterMs('test-key');
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThanOrEqual(5000);
    });

    it('should handle errors by returning 0', async () => {
      const mockLimit = jest.fn().mockRejectedValue(new Error('Redis error'));
      (Ratelimit as unknown as jest.Mock).mockImplementation(() => ({
        limit: mockLimit
      }));
      (getRedisClient as jest.Mock).mockReturnValue({ some: 'redis' });
      resetRateLimiters();

      const result = await getRetryAfterMs('test-key');
      expect(result).toBe(0);
      expect(mockWarn).toHaveBeenCalledWith(
        '[rate-limit] Error getting retry after',
        expect.any(Error),
        expect.any(Object)
      );
    });
  });

  describe('initialization error', () => {
    it('should handle errors during initialization', () => {
      (getRedisClient as jest.Mock).mockImplementation(() => {
        throw new Error('Redis failure');
      });
      resetRateLimiters();
      expect(mockWarn).toHaveBeenCalledWith(
        '[rate-limit] Failed to initialize rate limiters',
        expect.any(Error),
        expect.any(Object)
      );
    });
  });
});
