
import { getRedisClient } from './redis';

const CACHE_TTL_SECONDS = 60 * 60; // 1 hour

export async function withMongooseCache(
  model: any,
  queryName: string,
  queryFn: () => Promise<any>,
  ttl: number = CACHE_TTL_SECONDS,
  queryParams: Record<string, any> = {}
) {
  const key = `mongoose:${model.modelName}:${queryName}:${JSON.stringify(queryParams)}`;
  
  const client = getRedisClient();

  if (!client) {
    return queryFn();
  }

  try {
    const cachedData = await client.get<string>(key);
    if (cachedData) {
      return JSON.parse(cachedData);
    }
  } catch (error) {
    console.warn('[mongoose-cache] Failed to read from Redis cache', error);
  }

  const data = await queryFn();

  try {
    await client.set(key, JSON.stringify(data), { ex: ttl });
  } catch (error) {
    console.warn('[mongoose-cache] Failed to write to Redis cache', error);
  }

  return data;
}
