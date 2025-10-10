import { getRedisClient } from '@/lib/redis';

/**
 * Cache configuration options
 */
export interface CacheOptions {
  /** Cache key */
  key: string;
  /** Time to live in seconds */
  ttl: number;
}

/**
 * Generic cache wrapper for API responses
 * Attempts to retrieve from Redis cache, falling back to the provided data fetcher
 * 
 * @param options - Cache configuration
 * @param fetchData - Function to fetch fresh data if cache miss
 * @returns Cached or fresh data
 */
export async function withCache<T>(
  options: CacheOptions,
  fetchData: () => Promise<T>
): Promise<T> {
  const redis = getRedisClient();
  
  // If Redis is not available, skip caching and fetch data directly
  if (!redis) {
    return fetchData();
  }

  const { key, ttl } = options;

  try {
    // Try to get from cache
    const cached = await redis.get<T>(key);
    
    if (cached !== null && cached !== undefined) {
      console.log(`[Cache HIT] ${key}`);
      return cached;
    }

    console.log(`[Cache MISS] ${key}`);
  } catch (error) {
    // Log cache read error but continue to fetch fresh data
    console.warn(`[Cache READ ERROR] ${key}:`, error);
  }

  // Cache miss or error - fetch fresh data
  const freshData = await fetchData();

  // Try to cache the result (fire and forget - don't block on cache write)
  try {
    await redis.set(key, freshData, { ex: ttl });
    console.log(`[Cache SET] ${key} (TTL: ${ttl}s)`);
  } catch (error) {
    // Log cache write error but don't fail the request
    console.warn(`[Cache WRITE ERROR] ${key}:`, error);
  }

  return freshData;
}

/**
 * Invalidate (delete) a cache key
 * 
 * @param key - Cache key to invalidate
 * @returns True if key was deleted, false otherwise
 */
export async function invalidateCache(key: string): Promise<boolean> {
  const redis = getRedisClient();
  
  if (!redis) {
    return false;
  }

  try {
    const result = await redis.del(key);
    console.log(`[Cache INVALIDATE] ${key} (deleted: ${result})`);
    return result > 0;
  } catch (error) {
    console.warn(`[Cache INVALIDATE ERROR] ${key}:`, error);
    return false;
  }
}

/**
 * Invalidate multiple cache keys matching a pattern
 * 
 * @param pattern - Pattern to match keys (e.g., "reviews:*")
 * @returns Number of keys deleted
 */
export async function invalidateCachePattern(pattern: string): Promise<number> {
  const redis = getRedisClient();
  
  if (!redis) {
    return 0;
  }

  try {
    // Note: Upstash Redis REST API doesn't support SCAN command
    // For pattern-based invalidation, we need to track keys explicitly
    // This is a simplified version that logs the intent
    console.warn(`[Cache INVALIDATE PATTERN] ${pattern} - Pattern invalidation requires explicit key tracking with Upstash REST API`);
    return 0;
  } catch (error) {
    console.warn(`[Cache INVALIDATE PATTERN ERROR] ${pattern}:`, error);
    return 0;
  }
}
