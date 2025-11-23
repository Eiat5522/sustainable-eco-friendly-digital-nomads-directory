import {
  CACHE_CONFIGS,
  cachedQuery,
  cacheHelpers,
  generateCacheKey,
  getCacheMetrics,
  invalidateCache,
  resetCacheMetrics,
} from '../cache-strategy';
import { getRedisClient } from '../redis';

// Mock dependencies
jest.mock('../redis');
jest.mock('../logger', () => ({
  structuredLogger: {
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

const mockRedis = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  sadd: jest.fn(),
  smembers: jest.fn(),
  expire: jest.fn(),
};

describe('Cache Strategy', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetCacheMetrics();
    (getRedisClient as jest.Mock).mockReturnValue(mockRedis);
  });

  describe('generateCacheKey', () => {
    it('should generate consistent keys for same parameters', () => {
      const params = { a: 1, b: 2, c: 3 };
      const key1 = generateCacheKey('test', params);
      const key2 = generateCacheKey('test', params);
      expect(key1).toBe(key2);
    });

    it('should generate different keys for different parameters', () => {
      const key1 = generateCacheKey('test', { a: 1, b: 2 });
      const key2 = generateCacheKey('test', { a: 1, b: 3 });
      expect(key1).not.toBe(key2);
    });

    it('should handle string parameters', () => {
      const key = generateCacheKey('test', 'simple-key');
      expect(key).toBe('test:simple-key');
    });

    it('should sort object keys for consistency', () => {
      const key1 = generateCacheKey('test', { b: 2, a: 1 });
      const key2 = generateCacheKey('test', { a: 1, b: 2 });
      expect(key1).toBe(key2);
    });
  });

  describe('cachedQuery', () => {
    it('should return cached value if available', async () => {
      const cachedData = { data: { test: 'value' }, timestamp: Date.now(), tags: [] };
      mockRedis.get.mockResolvedValue(JSON.stringify(cachedData));

      const queryFn = jest.fn().mockResolvedValue({ test: 'new value' });
      const result = await cachedQuery('test-key', queryFn, {
        ttl: 60,
        prefix: 'test',
      });

      expect(result).toEqual({ test: 'value' });
      expect(queryFn).not.toHaveBeenCalled();
      expect(mockRedis.get).toHaveBeenCalledWith('test:test-key');
    });

    it('should execute query on cache miss', async () => {
      mockRedis.get.mockResolvedValue(null);
      const queryFn = jest.fn().mockResolvedValue({ test: 'value' });

      const result = await cachedQuery('test-key', queryFn, {
        ttl: 60,
        prefix: 'test',
      });

      expect(result).toEqual({ test: 'value' });
      expect(queryFn).toHaveBeenCalled();
      expect(mockRedis.set).toHaveBeenCalled();
    });

    it('should store result in cache after query execution', async () => {
      mockRedis.get.mockResolvedValue(null);
      const queryFn = jest.fn().mockResolvedValue({ test: 'value' });

      await cachedQuery('test-key', queryFn, {
        ttl: 60,
        prefix: 'test',
        tags: ['test-tag'],
      });

      expect(mockRedis.set).toHaveBeenCalledWith(
        'test:test-key',
        expect.stringContaining('"test":"value"'),
        { ex: 60 }
      );
    });

    it('should update metrics on cache hit', async () => {
      const cachedData = { data: { test: 'value' }, timestamp: Date.now(), tags: [] };
      mockRedis.get.mockResolvedValue(JSON.stringify(cachedData));

      const queryFn = jest.fn();
      await cachedQuery('test-key', queryFn, { ttl: 60, prefix: 'test' });

      const metrics = getCacheMetrics('test:test-key');
      expect(metrics).toMatchObject({
        hits: 1,
        misses: 0,
        errors: 0,
      });
    });

    it('should update metrics on cache miss', async () => {
      mockRedis.get.mockResolvedValue(null);
      const queryFn = jest.fn().mockResolvedValue({ test: 'value' });

      await cachedQuery('test-key', queryFn, { ttl: 60, prefix: 'test' });

      const metrics = getCacheMetrics('test:test-key');
      expect(metrics).toMatchObject({
        hits: 0,
        misses: 1,
        errors: 0,
      });
    });

    it('should implement SWR pattern when enabled', async () => {
      const oldTimestamp = Date.now() - 60 * 60 * 1000; // 1 hour ago
      const cachedData = { data: { test: 'old' }, timestamp: oldTimestamp, tags: [] };
      mockRedis.get.mockResolvedValue(JSON.stringify(cachedData));

      const queryFn = jest.fn().mockResolvedValue({ test: 'new' });

      const result = await cachedQuery('test-key', queryFn, {
        ttl: 60,
        prefix: 'test',
        swr: true,
        staleTime: 30,
      });

      // Should return stale data immediately
      expect(result).toEqual({ test: 'old' });

      // Should trigger background revalidation
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(queryFn).toHaveBeenCalled();
    });

    it('should handle cache read errors gracefully', async () => {
      mockRedis.get.mockRejectedValue(new Error('Redis error'));
      const queryFn = jest.fn().mockResolvedValue({ test: 'value' });

      const result = await cachedQuery('test-key', queryFn, {
        ttl: 60,
        prefix: 'test',
      });

      expect(result).toEqual({ test: 'value' });
      expect(queryFn).toHaveBeenCalled();
    });

    it('should work without Redis (in-memory fallback)', async () => {
      (getRedisClient as jest.Mock).mockReturnValue(null);
      const queryFn = jest.fn().mockResolvedValue({ test: 'value' });

      const result = await cachedQuery('test-key', queryFn, {
        ttl: 60,
        prefix: 'test',
      });

      expect(result).toEqual({ test: 'value' });
      expect(queryFn).toHaveBeenCalled();
    });
  });

  describe('invalidateCache', () => {
    it('should invalidate cache by key', async () => {
      await invalidateCache('test:key');
      expect(mockRedis.del).toHaveBeenCalledWith('test:key');
    });

    it('should invalidate cache by tag', async () => {
      mockRedis.smembers.mockResolvedValue(['key1', 'key2', 'key3']);

      await invalidateCache('test-tag', true);

      expect(mockRedis.smembers).toHaveBeenCalledWith('tag:test-tag');
      expect(mockRedis.del).toHaveBeenCalledTimes(4); // 3 keys + 1 tag
    });

    it('should handle empty tag sets', async () => {
      mockRedis.smembers.mockResolvedValue([]);

      await invalidateCache('test-tag', true);

      expect(mockRedis.del).toHaveBeenCalledWith('tag:test-tag');
    });
  });

  describe('cacheHelpers', () => {
    beforeEach(() => {
      mockRedis.get.mockResolvedValue(null);
    });

    it('should cache Sanity queries', async () => {
      const queryFn = jest.fn().mockResolvedValue({ data: 'test' });
      const query = '*[_type == "listing"]';
      const params = { limit: 10 };

      await cacheHelpers.sanityQuery(query, params, queryFn);

      expect(queryFn).toHaveBeenCalled();
      expect(mockRedis.set).toHaveBeenCalled();
    });

    it('should cache search results', async () => {
      const queryFn = jest.fn().mockResolvedValue({ results: [] });
      const searchParams = { q: 'test', page: 1 };

      await cacheHelpers.searchResults(searchParams, queryFn);

      expect(queryFn).toHaveBeenCalled();
      expect(mockRedis.set).toHaveBeenCalled();
    });

    it('should cache categories with static config', async () => {
      const queryFn = jest.fn().mockResolvedValue(['category1', 'category2']);

      await cacheHelpers.categories(queryFn);

      expect(queryFn).toHaveBeenCalled();
      expect(mockRedis.set).toHaveBeenCalledWith(expect.any(String), expect.any(String), {
        ex: CACHE_CONFIGS.STATIC.ttl,
      });
    });

    it('should cache amenities with tags', async () => {
      const queryFn = jest.fn().mockResolvedValue([{ name: 'WiFi' }]);

      await cacheHelpers.amenities(queryFn);

      expect(mockRedis.sadd).toHaveBeenCalledWith('tag:amenities', expect.any(String));
    });

    it('should cache eco tags with static config', async () => {
      const queryFn = jest.fn().mockResolvedValue([{ name: 'Solar' }]);

      await cacheHelpers.ecoTags(queryFn);

      expect(queryFn).toHaveBeenCalled();
      expect(mockRedis.set).toHaveBeenCalled();
    });
  });

  describe('CACHE_CONFIGS', () => {
    it('should define STATIC config', () => {
      expect(CACHE_CONFIGS.STATIC).toMatchObject({
        ttl: 60 * 60 * 24,
        swr: true,
        staleTime: 60 * 60 * 12,
      });
    });

    it('should define STANDARD config', () => {
      expect(CACHE_CONFIGS.STANDARD).toMatchObject({
        ttl: 60 * 60,
        swr: true,
        staleTime: 60 * 30,
      });
    });

    it('should define DYNAMIC config', () => {
      expect(CACHE_CONFIGS.DYNAMIC).toMatchObject({
        ttl: 60 * 5,
        swr: true,
        staleTime: 60 * 2,
      });
    });

    it('should define SEARCH config', () => {
      expect(CACHE_CONFIGS.SEARCH).toMatchObject({
        ttl: 60 * 10,
        swr: false,
      });
    });

    it('should define USER config', () => {
      expect(CACHE_CONFIGS.USER).toMatchObject({
        ttl: 60 * 2,
        swr: false,
      });
    });
  });

  describe('Cache Metrics', () => {
    it('should track metrics per key', async () => {
      mockRedis.get.mockResolvedValue(null);
      const queryFn = jest.fn().mockResolvedValue({ test: 'value' });

      await cachedQuery('key1', queryFn, { ttl: 60, prefix: 'test' });
      await cachedQuery('key2', queryFn, { ttl: 60, prefix: 'test' });

      const metrics1 = getCacheMetrics('test:key1');
      const metrics2 = getCacheMetrics('test:key2');

      expect(metrics1).toBeDefined();
      expect(metrics2).toBeDefined();
      expect(metrics1?.misses).toBe(1);
      expect(metrics2?.misses).toBe(1);

      // Now create a cache hit for key1
      const cachedData = { data: { test: 'value' }, timestamp: Date.now(), tags: [] };
      mockRedis.get.mockResolvedValueOnce(JSON.stringify(cachedData));
      await cachedQuery('key1', queryFn, { ttl: 60, prefix: 'test' });

      const updatedMetrics1 = getCacheMetrics('test:key1');
      expect(updatedMetrics1?.hits).toBe(1);
      expect(updatedMetrics1?.misses).toBe(1);
    });

    it('should reset specific key metrics', async () => {
      mockRedis.get.mockResolvedValue(null);
      const queryFn = jest.fn().mockResolvedValue({ test: 'value' });

      await cachedQuery('test-key', queryFn, { ttl: 60, prefix: 'test' });
      expect(getCacheMetrics('test:test-key')).toBeDefined();

      resetCacheMetrics('test:test-key');
      expect(getCacheMetrics('test:test-key')).toBeNull();
    });

    it('should reset all metrics', async () => {
      mockRedis.get.mockResolvedValue(null);
      const queryFn = jest.fn().mockResolvedValue({ test: 'value' });

      await cachedQuery('key1', queryFn, { ttl: 60, prefix: 'test' });
      await cachedQuery('key2', queryFn, { ttl: 60, prefix: 'test' });

      resetCacheMetrics();

      const allMetrics = getCacheMetrics();
      expect(allMetrics.size).toBe(0);
    });
  });
});
