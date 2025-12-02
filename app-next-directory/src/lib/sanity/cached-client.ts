import { getRedisClient } from '../redis';
import { client } from './client';

const CACHE_TTL_SECONDS = 60 * 60; // 1 hour
const inflightRequests = new Map<string, Promise<unknown>>();

async function fetchAndCache<T>(
  query: string,
  params: Record<string, unknown>,
  ttl: number
): Promise<T> {
  const sortedKeys = Object.keys(params).sort();
  const key = `sanity:${query}:${JSON.stringify(params, sortedKeys)}`;

  const redis = getRedisClient();

  if (redis) {
    try {
      const cachedData = await redis.get<string>(key);
      if (cachedData) {
        return JSON.parse(cachedData);
      }
    } catch (error) {}
  }

  // Check if request is already in-flight to prevent stampede
  if (inflightRequests.has(key)) {
    return inflightRequests.get(key) as Promise<T>;
  }

  const fetchPromise = (async () => {
    try {
      const data = await client.fetch<T>(query, params);

      if (redis) {
        try {
          await redis.set(key, JSON.stringify(data), { ex: ttl });
        } catch (error) {}
      }
      return data;
    } finally {
      inflightRequests.delete(key);
    }
  })();

  inflightRequests.set(key, fetchPromise);
  return fetchPromise;
}

export const cachedClient = {
  fetch: async <T = unknown>(
    query: string,
    params: Record<string, unknown> = {},
    ttl: number = CACHE_TTL_SECONDS
  ): Promise<T> => {
    return fetchAndCache<T>(query, params, ttl);
  },
};
