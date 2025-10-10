
import { createClient, groq } from 'next-sanity';
import { redis } from '../redis';
import { client } from './client';

const CACHE_TTL_SECONDS = 60 * 60; // 1 hour

async function fetchAndCache(query: string, params: any, ttl: number) {
  const key = `sanity:${query}:${JSON.stringify(params)}`;
  let cachedData = await redis.get(key);

  if (cachedData) {
    return JSON.parse(cachedData as string);
  }

  const data = await client.fetch(query, params);
  await redis.set(key, JSON.stringify(data), { ex: ttl });
  return data;
}

export const cachedClient = {
  fetch: async (query: string, params: any = {}, ttl: number = CACHE_TTL_SECONDS) => {
    return fetchAndCache(query, params, ttl);
  },
};
