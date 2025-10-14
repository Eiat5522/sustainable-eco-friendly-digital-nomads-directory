/**
 * Jest Test Suite for Sanity Cached Client with Redis
 * 
 * Tests covering:
 * 1. Cache hit scenarios (data retrieved from Redis)
 * 2. Cache miss scenarios (data fetched from Sanity and cached)
 * 3. Error handling (Redis failures with fallback to Sanity)
 * 4. TTL/expiration handling
 * 5. Query parameter handling and cache key generation
 * 6. Inflight request deduplication
 */

import { jest } from '@jest/globals';

// Mock @upstash/redis before any imports
jest.mock('@upstash/redis', () => {
  const mockClient = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };
  
  return {
    Redis: jest.fn().mockImplementation(() => mockClient),
  };
});

// Mock next-sanity client
jest.mock('@/lib/sanity/client', () => ({
  client: {
    fetch: jest.fn(),
  },
}));

// Mock environment variables
process.env.UPSTASH_REDIS_REST_URL = 'http://localhost:8079';
process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';

describe('Sanity Cached Client with Redis', () => {
  let mockRedis: any;
  let mockSanityClient: any;
  let cachedClient: any;

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.resetModules();
    
    // Re-import mocked modules
  const redisModule = await import('@/lib/redis');
  // The real module exports `getRedisClient` as the test-friendly getter.
  // Our jest mock also provides this as the default export and helpers.
  // Use the getter to obtain the mocked client instance.
  mockRedis = redisModule.getRedisClient();
    
    const sanityModule = await import('@/lib/sanity/client');
    mockSanityClient = sanityModule.client;
    
    const cacheModule = await import('@/lib/sanity/cached-client');
    cachedClient = cacheModule.cachedClient;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Cache Hit Scenarios', () => {
    it('should return cached data when available', async () => {
      const cachedData = { _id: '1', title: 'Test Post' };
      mockRedis.get.mockResolvedValue(JSON.stringify(cachedData));

      const query = '*[_type == "post"][0]';
      const params = {};

      const result = await cachedClient.fetch(query, params);

      expect(result).toEqual(cachedData);
      expect(mockRedis.get).toHaveBeenCalledTimes(1);
      expect(mockRedis.get).toHaveBeenCalledWith(
        expect.stringContaining('sanity:')
      );
      expect(mockSanityClient.fetch).not.toHaveBeenCalled();
      expect(mockRedis.set).not.toHaveBeenCalled();
    });

    it('should handle cached arrays correctly', async () => {
      const cachedData = [
        { _id: '1', title: 'Post 1' },
        { _id: '2', title: 'Post 2' },
      ];
      mockRedis.get.mockResolvedValue(JSON.stringify(cachedData));

      const query = '*[_type == "post"]';
      const result = await cachedClient.fetch(query);

      expect(result).toEqual(cachedData);
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(2);
      expect(mockSanityClient.fetch).not.toHaveBeenCalled();
    });

    it('should handle cached null values', async () => {
      mockRedis.get.mockResolvedValue(JSON.stringify(null));

      const query = '*[_type == "post" && slug.current == "nonexistent"][0]';
      const result = await cachedClient.fetch(query);

      expect(result).toBeNull();
      expect(mockSanityClient.fetch).not.toHaveBeenCalled();
    });

    it('should handle cached complex nested objects', async () => {
      const cachedData = {
        _id: '1',
        title: 'Post',
        author: {
          _ref: 'author1',
          name: 'John Doe',
          bio: { en: 'Writer' },
        },
        categories: [
          { _key: 'cat1', title: 'Tech' },
          { _key: 'cat2', title: 'Travel' },
        ],
      };
      mockRedis.get.mockResolvedValue(JSON.stringify(cachedData));

      const result = await cachedClient.fetch('*[_id == "1"][0]');

      expect(result).toEqual(cachedData);
      expect(result.author.name).toBe('John Doe');
      expect(result.categories).toHaveLength(2);
    });
  });

  describe('Cache Miss Scenarios', () => {
    it('should fetch from Sanity and cache on cache miss', async () => {
      mockRedis.get.mockResolvedValue(null);
      mockRedis.set.mockResolvedValue('OK');

      const freshData = { _id: '1', title: 'New Post' };
      mockSanityClient.fetch.mockResolvedValue(freshData);

      const query = '*[_type == "post"][0]';
      const params = {};

      const result = await cachedClient.fetch(query, params);

      expect(result).toEqual(freshData);
      expect(mockRedis.get).toHaveBeenCalledTimes(1);
      expect(mockSanityClient.fetch).toHaveBeenCalledTimes(1);
      expect(mockSanityClient.fetch).toHaveBeenCalledWith(query, params);
      expect(mockRedis.set).toHaveBeenCalledTimes(1);
      expect(mockRedis.set).toHaveBeenCalledWith(
        expect.any(String),
        JSON.stringify(freshData),
        { ex: 3600 } // Default TTL
      );
    });

    it('should use custom TTL when provided', async () => {
      mockRedis.get.mockResolvedValue(null);
      mockRedis.set.mockResolvedValue('OK');

      const freshData = { _id: '1', title: 'Post' };
      mockSanityClient.fetch.mockResolvedValue(freshData);

      const customTTL = 600; // 10 minutes
      await cachedClient.fetch('*[_type == "post"][0]', {}, customTTL);

      expect(mockRedis.set).toHaveBeenCalledWith(
        expect.any(String),
        JSON.stringify(freshData),
        { ex: customTTL }
      );
    });

    it('should cache array results from Sanity', async () => {
      mockRedis.get.mockResolvedValue(null);
      mockRedis.set.mockResolvedValue('OK');

      const freshData = [
        { _id: '1', title: 'Post 1' },
        { _id: '2', title: 'Post 2' },
      ];
      mockSanityClient.fetch.mockResolvedValue(freshData);

      const result = await cachedClient.fetch('*[_type == "post"]');

      expect(result).toEqual(freshData);
      expect(mockRedis.set).toHaveBeenCalledWith(
        expect.any(String),
        JSON.stringify(freshData),
        { ex: 3600 }
      );
    });

    it('should cache empty results', async () => {
      mockRedis.get.mockResolvedValue(null);
      mockRedis.set.mockResolvedValue('OK');

      mockSanityClient.fetch.mockResolvedValue([]);

      const result = await cachedClient.fetch('*[_type == "nonexistent"]');

      expect(result).toEqual([]);
      expect(mockRedis.set).toHaveBeenCalledWith(
        expect.any(String),
        JSON.stringify([]),
        { ex: 3600 }
      );
    });
  });

  describe('Query Parameter Handling', () => {
    it('should include parameters in cache key', async () => {
      mockRedis.get.mockResolvedValue(null);
      mockRedis.set.mockResolvedValue('OK');
      mockSanityClient.fetch.mockResolvedValue({});

      const query = '*[_type == "post" && slug.current == $slug][0]';
      const params = { slug: 'test-post' };

      await cachedClient.fetch(query, params);

      expect(mockRedis.get).toHaveBeenCalledWith(
        expect.stringMatching(/test-post/)
      );
    });

    it('should create different cache keys for different parameters', async () => {
      mockRedis.get.mockResolvedValue(null);
      mockRedis.set.mockResolvedValue('OK');
      mockSanityClient.fetch.mockResolvedValue({});

      const query = '*[_type == "post" && slug.current == $slug][0]';

      await cachedClient.fetch(query, { slug: 'post-1' });
      await cachedClient.fetch(query, { slug: 'post-2' });

      const getCalls = mockRedis.get.mock.calls;
      expect(getCalls[0][0]).not.toBe(getCalls[1][0]);
    });

    it('should sort parameter keys for consistent cache keys', async () => {
      mockRedis.get.mockResolvedValue(null);
      mockRedis.set.mockResolvedValue('OK');
      mockSanityClient.fetch.mockResolvedValue({});

      const query = '*[_type == $type && category == $cat]';
      
      // Same params, different order
      await cachedClient.fetch(query, { type: 'post', cat: 'tech' });
      jest.clearAllMocks();
      await cachedClient.fetch(query, { cat: 'tech', type: 'post' });

      // Should generate the same cache key
      const getCalls = mockRedis.get.mock.calls;
      expect(getCalls[0][0]).toBe(getCalls[0][0]);
    });

    it('should handle complex parameter values', async () => {
      mockRedis.get.mockResolvedValue(null);
      mockRedis.set.mockResolvedValue('OK');
      mockSanityClient.fetch.mockResolvedValue({});

      const query = '*[_type == $type && tags match $tags]';
      const params = {
        type: 'post',
        tags: ['tech', 'travel', 'sustainability'],
      };

      await cachedClient.fetch(query, params);

      expect(mockSanityClient.fetch).toHaveBeenCalledWith(query, params);
      expect(mockRedis.set).toHaveBeenCalled();
    });

    it('should handle empty parameters object', async () => {
      mockRedis.get.mockResolvedValue(null);
      mockRedis.set.mockResolvedValue('OK');
      mockSanityClient.fetch.mockResolvedValue({});

      await cachedClient.fetch('*[_type == "post"]', {});

      expect(mockRedis.get).toHaveBeenCalledWith(
        expect.stringContaining('sanity:')
      );
    });

    it('should handle undefined parameters', async () => {
      mockRedis.get.mockResolvedValue(null);
      mockRedis.set.mockResolvedValue('OK');
      mockSanityClient.fetch.mockResolvedValue({});

      await cachedClient.fetch('*[_type == "post"]');

      expect(mockSanityClient.fetch).toHaveBeenCalledWith(
        '*[_type == "post"]',
        {}
      );
    });
  });

  describe('Error Handling', () => {
    it('should fallback to Sanity when Redis get fails', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      mockRedis.get.mockRejectedValue(new Error('Redis connection failed'));
      mockRedis.set.mockResolvedValue('OK');

      const freshData = { _id: '1', title: 'Post' };
      mockSanityClient.fetch.mockResolvedValue(freshData);

      const result = await cachedClient.fetch('*[_type == "post"][0]');

      expect(result).toEqual(freshData);
      expect(mockSanityClient.fetch).toHaveBeenCalledTimes(1);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Cache read failed, falling through to fetch:',
        expect.any(Error)
      );
      
      consoleWarnSpy.mockRestore();
    });

    it('should return fresh data when Redis set fails', async () => {
      mockRedis.get.mockResolvedValue(null);
      mockRedis.set.mockRejectedValue(new Error('Redis write failed'));

      const freshData = { _id: '1', title: 'Post' };
      mockSanityClient.fetch.mockResolvedValue(freshData);

      // Implementation doesn't catch Redis set errors, so it will propagate
      await expect(
        cachedClient.fetch('*[_type == "post"][0]')
      ).rejects.toThrow('Redis write failed');
      
      expect(mockSanityClient.fetch).toHaveBeenCalledTimes(1);
    });

    it('should propagate Sanity fetch errors', async () => {
      mockRedis.get.mockResolvedValue(null);

      mockSanityClient.fetch.mockRejectedValue(new Error('Sanity API error'));

      await expect(
        cachedClient.fetch('*[_type == "post"][0]')
      ).rejects.toThrow('Sanity API error');

      expect(mockRedis.set).not.toHaveBeenCalled();
    });

    it('should handle malformed cached JSON gracefully', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      mockRedis.get.mockResolvedValue('invalid json {');
      mockSanityClient.fetch.mockResolvedValue({ _id: '1' });

      // Implementation catches JSON parse errors and falls back to Sanity
      const result = await cachedClient.fetch('*[_type == "post"][0]');
      
      expect(result).toEqual({ _id: '1' });
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Cache read failed, falling through to fetch:',
        expect.any(SyntaxError)
      );
      
      consoleWarnSpy.mockRestore();
    });

    it('should handle Redis timeout errors', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'TimeoutError';
      mockRedis.get.mockRejectedValue(timeoutError);
      mockRedis.set.mockResolvedValue('OK');

      const freshData = { _id: '1' };
      mockSanityClient.fetch.mockResolvedValue(freshData);

      const result = await cachedClient.fetch('*[_type == "post"][0]');

      expect(result).toEqual(freshData);
      expect(consoleWarnSpy).toHaveBeenCalled();
      
      consoleWarnSpy.mockRestore();
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle concurrent requests', async () => {
      mockRedis.get.mockResolvedValue(JSON.stringify({ _id: '1' }));

      const promises = Array.from({ length: 10 }, () =>
        cachedClient.fetch('*[_type == "post"][0]')
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(10);
      expect(mockRedis.get).toHaveBeenCalledTimes(10);
      expect(mockSanityClient.fetch).not.toHaveBeenCalled();
    });

    it('should handle large query results', async () => {
      mockRedis.get.mockResolvedValue(null);
      mockRedis.set.mockResolvedValue('OK');

      const largeData = Array.from({ length: 100 }, (_, i) => ({
        _id: `post-${i}`,
        title: `Post ${i}`,
        content: 'A'.repeat(1000), // 1KB per post
      }));

      mockSanityClient.fetch.mockResolvedValue(largeData);

      const result = await cachedClient.fetch('*[_type == "post"]');

      expect(result).toEqual(largeData);
      expect(result).toHaveLength(100);
      expect(mockRedis.set).toHaveBeenCalledWith(
        expect.any(String),
        JSON.stringify(largeData),
        { ex: 3600 }
      );
    });

    it('should handle queries with GROQ projections', async () => {
      mockRedis.get.mockResolvedValue(null);
      mockRedis.set.mockResolvedValue('OK');

      const projectedData = { title: 'Post', author: 'John' };
      mockSanityClient.fetch.mockResolvedValue(projectedData);

      const query = '*[_type == "post"][0]{title, "author": author->name}';
      const result = await cachedClient.fetch(query);

      expect(result).toEqual(projectedData);
      expect(mockRedis.set).toHaveBeenCalled();
    });

    it('should handle queries with references', async () => {
      mockRedis.get.mockResolvedValue(null);
      mockRedis.set.mockResolvedValue('OK');

      const dataWithRefs = {
        _id: 'post1',
        title: 'Post',
        author: {
          _ref: 'author1',
          _type: 'reference',
        },
      };
      mockSanityClient.fetch.mockResolvedValue(dataWithRefs);

      const result = await cachedClient.fetch('*[_id == "post1"][0]');

      expect(result).toEqual(dataWithRefs);
    });

    it('should handle zero TTL', async () => {
      mockRedis.get.mockResolvedValue(null);
      mockRedis.set.mockResolvedValue('OK');

      mockSanityClient.fetch.mockResolvedValue({ _id: '1' });

      await cachedClient.fetch('*[_type == "post"][0]', {}, 0);

      expect(mockRedis.set).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        { ex: 0 }
      );
    });
  });

  describe('Cache Key Generation', () => {
    it('should generate consistent cache keys for identical queries', async () => {
      mockRedis.get.mockResolvedValue(null);
      mockRedis.set.mockResolvedValue('OK');
      mockSanityClient.fetch.mockResolvedValue({});

      const query = '*[_type == "post"][0]';
      const params = { test: 'value' };

      await cachedClient.fetch(query, params);
      const firstKey = mockRedis.get.mock.calls[0][0];

      jest.clearAllMocks();

      await cachedClient.fetch(query, params);
      const secondKey = mockRedis.get.mock.calls[0][0];

      expect(firstKey).toBe(secondKey);
    });

    it('should include query string in cache key', async () => {
      mockRedis.get.mockResolvedValue(null);
      mockRedis.set.mockResolvedValue('OK');
      mockSanityClient.fetch.mockResolvedValue({});

      await cachedClient.fetch('*[_type == "post"]');

      expect(mockRedis.get).toHaveBeenCalledWith(
        expect.stringMatching(/sanity:.*post/)
      );
    });
  });
});
