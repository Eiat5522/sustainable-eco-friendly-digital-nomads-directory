
import { redis } from './redis';

const CACHE_TTL_SECONDS = 60 * 60; // 1 hour

export async function withMongooseCache(
  model: any,
  queryName: string,
  queryFn: () => Promise<any>,
  queryParams: Record<string, any> = {},
  ttl: number = CACHE_TTL_SECONDS
) {
  const key = `mongoose:${model.modelName}:${queryName}:${JSON.stringify(queryParams)}`;
  try {
    let cachedData = await redis.get(key);
    if (cachedData) {
      return JSON.parse(cachedData as string);
    }
  } catch (error) {
    // Cache read failed, continue to fetch fresh data
  }
  
  const data = await queryFn();
  try {
    await redis.set(key, JSON.stringify(data), { ex: ttl });
  } catch (error) {
    console.error('Cache write failed:', error);
    // Continue and return data even if caching fails
  }
  return data;
}
