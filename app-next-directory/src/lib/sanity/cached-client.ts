
import { createClient, groq } from 'next-sanity';
import { redis } from '../redis';
import { client } from './client';

const CACHE_TTL_SECONDS = 60 * 60; // 1 hour
const inflightRequests = new Map<string, Promise<any>>();

async function fetchAndCache(query: string, params: any, ttl: number) {
  const key = `sanity:${query}:${JSON.stringify(params, Object.keys(params).sort())}`;
  
  try {
    const cachedData = await redis.get(key);
    if (cachedData) {
      return JSON.parse(cachedData as string);
    }
  } catch (error) {
    console.warn('Cache read failed, falling through to fetch:', error);
  }

  // Check if request is already in-flight to prevent stampede
  if (inflightRequests.has(key)) {
    return inflightRequests.get(key);
  }

  const fetchPromise = (async () => {
    try {
      const data = await client.fetch(query, params);
      await redis.set(key, JSON.stringify(data), { ex: ttl });
      return data;
    } finally {
      inflightRequests.delete(key);
    }
  })();
  
  inflightRequests.set(key, fetchPromise);
  return fetchPromise;
}

export const cachedClient = {
  fetch: async <T = any>(query: string, params: Record<string, any> = {}, ttl: number = CACHE_TTL_SECONDS): Promise<T> => {
    return fetchAndCache(query, params, ttl);
  },
};
