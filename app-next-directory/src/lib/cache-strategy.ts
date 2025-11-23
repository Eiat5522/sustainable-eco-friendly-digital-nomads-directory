/**
 * Comprehensive Caching Strategy for Expensive Queries
 * 
 * This module provides caching utilities for different types of queries:
 * 1. Sanity CMS queries (via Redis with fallback)
 * 2. Database queries (MongoDB)
 * 3. API route responses
 * 4. Search results
 */

import { getRedisClient } from './redis';
import { structuredLogger } from './logger';

export interface CacheOptions {
  /** Cache key prefix for namespacing */
  prefix?: string;
  /** Time-to-live in seconds */
  ttl: number;
  /** Whether to use stale-while-revalidate pattern */
  swr?: boolean;
  /** Stale time for SWR (if enabled) */
  staleTime?: number;
  /** Tags for cache invalidation */
  tags?: string[];
}

export interface CacheMetrics {
  hits: number;
  misses: number;
  errors: number;
  lastAccess: Date;
}

const cacheMetrics = new Map<string, CacheMetrics>();

/**
 * Get cache metrics for monitoring
 */
export function getCacheMetrics(key?: string): Map<string, CacheMetrics> | CacheMetrics | null {
  if (key) {
    return cacheMetrics.get(key) || null;
  }
  return cacheMetrics;
}

/**
 * Reset cache metrics
 */
export function resetCacheMetrics(key?: string): void {
  if (key) {
    cacheMetrics.delete(key);
  } else {
    cacheMetrics.clear();
  }
}

/**
 * Update cache metrics
 */
function updateMetrics(key: string, type: 'hit' | 'miss' | 'error'): void {
  const metrics = cacheMetrics.get(key) || {
    hits: 0,
    misses: 0,
    errors: 0,
    lastAccess: new Date(),
  };

  if (type === 'hit') metrics.hits++;
  if (type === 'miss') metrics.misses++;
  if (type === 'error') metrics.errors++;
  metrics.lastAccess = new Date();

  cacheMetrics.set(key, metrics);
}

/**
 * Generate a cache key from parameters
 */
export function generateCacheKey(
  prefix: string,
  params: Record<string, unknown> | string
): string {
  if (typeof params === 'string') {
    return `${prefix}:${params}`;
  }

  const sortedKeys = Object.keys(params).sort();
  const paramsString = JSON.stringify(params, sortedKeys);
  return `${prefix}:${Buffer.from(paramsString).toString('base64')}`;
}

/**
 * Cached query wrapper with Redis backend
 */
export async function cachedQuery<T>(
  key: string,
  queryFn: () => Promise<T>,
  options: CacheOptions
): Promise<T> {
  const { ttl, prefix = 'query', swr = false, staleTime = ttl / 2, tags = [] } = options;
  const fullKey = prefix ? `${prefix}:${key}` : key;

  const redis = getRedisClient();

  // Try to get from cache first
  if (redis) {
    try {
      const cached = await redis.get<string>(fullKey);
      if (cached) {
        updateMetrics(fullKey, 'hit');
        const parsed = JSON.parse(cached) as { data: T; timestamp: number; tags: string[] };

        // SWR: serve stale while revalidating
        if (swr) {
          const age = Date.now() - parsed.timestamp;
          if (age > staleTime * 1000) {
            // Revalidate in background
            queryFn()
              .then(async (fresh) => {
                await setCachedValue(fullKey, fresh, ttl, tags, redis);
              })
              .catch((error) => {
                structuredLogger.warn('Background revalidation failed', {
                  component: 'cache-strategy',
                  key: fullKey,
                  error,
                });
              });
          }
        }

        return parsed.data;
      }
    } catch (error) {
      updateMetrics(fullKey, 'error');
      structuredLogger.warn('Cache read failed, falling through to query', {
        component: 'cache-strategy',
        key: fullKey,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // Cache miss - execute query
  updateMetrics(fullKey, 'miss');
  const result = await queryFn();

  // Store in cache
  if (redis) {
    await setCachedValue(fullKey, result, ttl, tags, redis);
  }

  return result;
}

/**
 * Set cached value with metadata
 */
async function setCachedValue<T>(
  key: string,
  value: T,
  ttl: number,
  tags: string[],
  redis: ReturnType<typeof getRedisClient>
): Promise<void> {
  if (!redis) return;

  try {
    const cacheValue = {
      data: value,
      timestamp: Date.now(),
      tags,
    };
    await redis.set(key, JSON.stringify(cacheValue), { ex: ttl });

    // Store tag references for invalidation
    for (const tag of tags) {
      const tagKey = `tag:${tag}`;
      await redis.sadd(tagKey, key);
      await redis.expire(tagKey, ttl);
    }
  } catch (error) {
    structuredLogger.warn('Cache write failed', {
      component: 'cache-strategy',
      key,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Invalidate cache by key or tags
 */
export async function invalidateCache(keyOrTag: string, isTag = false): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  try {
    if (isTag) {
      const tagKey = `tag:${keyOrTag}`;
      const keys = await redis.smembers(tagKey);
      if (Array.isArray(keys) && keys.length > 0) {
        await Promise.all(keys.map((k) => redis.del(k)));
      }
      await redis.del(tagKey);
    } else {
      await redis.del(keyOrTag);
    }
  } catch (error) {
    structuredLogger.error('Cache invalidation failed', error, {
      component: 'cache-strategy',
      keyOrTag,
    });
  }
}

/**
 * Predefined cache configurations for common query types
 */
export const CACHE_CONFIGS = {
  // Long-lived, rarely changing data
  STATIC: {
    ttl: 60 * 60 * 24, // 24 hours
    swr: true,
    staleTime: 60 * 60 * 12, // 12 hours
  },
  // Medium-lived data that changes occasionally
  STANDARD: {
    ttl: 60 * 60, // 1 hour
    swr: true,
    staleTime: 60 * 30, // 30 minutes
  },
  // Short-lived, frequently changing data
  DYNAMIC: {
    ttl: 60 * 5, // 5 minutes
    swr: true,
    staleTime: 60 * 2, // 2 minutes
  },
  // Search results (moderate TTL)
  SEARCH: {
    ttl: 60 * 10, // 10 minutes
    swr: false,
  },
  // User-specific data (short TTL)
  USER: {
    ttl: 60 * 2, // 2 minutes
    swr: false,
  },
} as const;

/**
 * Specific cache helpers for common operations
 */
export const cacheHelpers = {
  /**
   * Cache Sanity query results
   */
  async sanityQuery<T>(
    query: string,
    params: Record<string, unknown>,
    queryFn: () => Promise<T>,
    options: Partial<CacheOptions> = {}
  ): Promise<T> {
    const key = generateCacheKey(query, params);
    return cachedQuery(key, queryFn, {
      prefix: 'sanity',
      ...CACHE_CONFIGS.STANDARD,
      ...options,
    });
  },

  /**
   * Cache search results
   */
  async searchResults<T>(
    searchParams: Record<string, unknown>,
    queryFn: () => Promise<T>,
    options: Partial<CacheOptions> = {}
  ): Promise<T> {
    const key = generateCacheKey('search', searchParams);
    return cachedQuery(key, queryFn, {
      prefix: 'search',
      ...CACHE_CONFIGS.SEARCH,
      ...options,
    });
  },

  /**
   * Cache API route responses
   */
  async apiRoute<T>(
    route: string,
    params: Record<string, unknown>,
    queryFn: () => Promise<T>,
    options: Partial<CacheOptions> = {}
  ): Promise<T> {
    const key = generateCacheKey(route, params);
    return cachedQuery(key, queryFn, {
      prefix: 'api',
      ...CACHE_CONFIGS.STANDARD,
      ...options,
    });
  },

  /**
   * Cache categories (static data)
   */
  async categories<T>(queryFn: () => Promise<T>): Promise<T> {
    return cachedQuery('categories', queryFn, {
      prefix: 'static',
      tags: ['categories'],
      ...CACHE_CONFIGS.STATIC,
    });
  },

  /**
   * Cache amenities (static data)
   */
  async amenities<T>(queryFn: () => Promise<T>): Promise<T> {
    return cachedQuery('amenities', queryFn, {
      prefix: 'static',
      tags: ['amenities'],
      ...CACHE_CONFIGS.STATIC,
    });
  },

  /**
   * Cache eco tags (static data)
   */
  async ecoTags<T>(queryFn: () => Promise<T>): Promise<T> {
    return cachedQuery('eco-tags', queryFn, {
      prefix: 'static',
      tags: ['eco-tags'],
      ...CACHE_CONFIGS.STATIC,
    });
  },
};

export default cachedQuery;
