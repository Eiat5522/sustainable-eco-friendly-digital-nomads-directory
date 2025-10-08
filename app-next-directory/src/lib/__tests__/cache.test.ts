/**
 * Jest Test Suite for Cache Utility
 * Tests the Redis caching wrapper functions
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { withCache, invalidateCache } from '../cache';
import { getRedisClient } from '../redis';

// Mock the redis module
jest.mock('../redis', () => ({
  getRedisClient: jest.fn(),
}));

const mockGetRedisClient = getRedisClient as jest.MockedFunction<typeof getRedisClient>;

describe('Cache Utility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn();
    console.warn = jest.fn();
  });

  describe('withCache', () => {
    it('should return fresh data when Redis is not available', async () => {
      mockGetRedisClient.mockReturnValue(undefined);

      const fetchData = jest.fn().mockResolvedValue({ data: 'test' });
      const result = await withCache(
        { key: 'test-key', ttl: 60 },
        fetchData
      );

      expect(result).toEqual({ data: 'test' });
      expect(fetchData).toHaveBeenCalledTimes(1);
    });

    it('should return cached data on cache hit', async () => {
      const mockRedis = {
        get: jest.fn().mockResolvedValue({ data: 'cached' }),
        set: jest.fn(),
        del: jest.fn(),
      };
      mockGetRedisClient.mockReturnValue(mockRedis as any);

      const fetchData = jest.fn().mockResolvedValue({ data: 'fresh' });
      const result = await withCache(
        { key: 'test-key', ttl: 60 },
        fetchData
      );

      expect(result).toEqual({ data: 'cached' });
      expect(mockRedis.get).toHaveBeenCalledWith('test-key');
      expect(fetchData).not.toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith('[Cache HIT] test-key');
    });

    it('should fetch and cache data on cache miss', async () => {
      const mockRedis = {
        get: jest.fn().mockResolvedValue(null),
        set: jest.fn().mockResolvedValue('OK'),
        del: jest.fn(),
      };
      mockGetRedisClient.mockReturnValue(mockRedis as any);

      const fetchData = jest.fn().mockResolvedValue({ data: 'fresh' });
      const result = await withCache(
        { key: 'test-key', ttl: 120 },
        fetchData
      );

      expect(result).toEqual({ data: 'fresh' });
      expect(mockRedis.get).toHaveBeenCalledWith('test-key');
      expect(fetchData).toHaveBeenCalledTimes(1);
      expect(mockRedis.set).toHaveBeenCalledWith(
        'test-key',
        { data: 'fresh' },
        { ex: 120 }
      );
      expect(console.log).toHaveBeenCalledWith('[Cache MISS] test-key');
      expect(console.log).toHaveBeenCalledWith('[Cache SET] test-key (TTL: 120s)');
    });

    it('should handle cache read errors gracefully', async () => {
      const mockRedis = {
        get: jest.fn().mockRejectedValue(new Error('Redis read error')),
        set: jest.fn().mockResolvedValue('OK'),
        del: jest.fn(),
      };
      mockGetRedisClient.mockReturnValue(mockRedis as any);

      const fetchData = jest.fn().mockResolvedValue({ data: 'fresh' });
      const result = await withCache(
        { key: 'test-key', ttl: 60 },
        fetchData
      );

      expect(result).toEqual({ data: 'fresh' });
      expect(fetchData).toHaveBeenCalledTimes(1);
      expect(console.warn).toHaveBeenCalledWith(
        '[Cache READ ERROR] test-key:',
        expect.any(Error)
      );
    });

    it('should handle cache write errors gracefully', async () => {
      const mockRedis = {
        get: jest.fn().mockResolvedValue(null),
        set: jest.fn().mockRejectedValue(new Error('Redis write error')),
        del: jest.fn(),
      };
      mockGetRedisClient.mockReturnValue(mockRedis as any);

      const fetchData = jest.fn().mockResolvedValue({ data: 'fresh' });
      const result = await withCache(
        { key: 'test-key', ttl: 60 },
        fetchData
      );

      expect(result).toEqual({ data: 'fresh' });
      expect(fetchData).toHaveBeenCalledTimes(1);
      expect(console.warn).toHaveBeenCalledWith(
        '[Cache WRITE ERROR] test-key:',
        expect.any(Error)
      );
    });
  });

  describe('invalidateCache', () => {
    it('should return false when Redis is not available', async () => {
      mockGetRedisClient.mockReturnValue(undefined);

      const result = await invalidateCache('test-key');

      expect(result).toBe(false);
    });

    it('should delete cache key and return true on success', async () => {
      const mockRedis = {
        get: jest.fn(),
        set: jest.fn(),
        del: jest.fn().mockResolvedValue(1),
      };
      mockGetRedisClient.mockReturnValue(mockRedis as any);

      const result = await invalidateCache('test-key');

      expect(result).toBe(true);
      expect(mockRedis.del).toHaveBeenCalledWith('test-key');
      expect(console.log).toHaveBeenCalledWith('[Cache INVALIDATE] test-key (deleted: 1)');
    });

    it('should return false when key does not exist', async () => {
      const mockRedis = {
        get: jest.fn(),
        set: jest.fn(),
        del: jest.fn().mockResolvedValue(0),
      };
      mockGetRedisClient.mockReturnValue(mockRedis as any);

      const result = await invalidateCache('test-key');

      expect(result).toBe(false);
      expect(mockRedis.del).toHaveBeenCalledWith('test-key');
    });

    it('should handle deletion errors gracefully', async () => {
      const mockRedis = {
        get: jest.fn(),
        set: jest.fn(),
        del: jest.fn().mockRejectedValue(new Error('Redis delete error')),
      };
      mockGetRedisClient.mockReturnValue(mockRedis as any);

      const result = await invalidateCache('test-key');

      expect(result).toBe(false);
      expect(console.warn).toHaveBeenCalledWith(
        '[Cache INVALIDATE ERROR] test-key:',
        expect.any(Error)
      );
    });
  });
});
