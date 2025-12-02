import { getRedisClient } from './redis';

const CACHE_TTL_SECONDS = 60 * 60; // 1 hour

export async function withMongooseCache<T>(
  model: { modelName: string },
  queryName: string,
  queryFn: () => Promise<T>,
  ttl: number = CACHE_TTL_SECONDS,
  queryParams: Record<string, unknown> = {}
): Promise<T> {
  const key = `mongoose:${model.modelName}:${queryName}:${JSON.stringify(queryParams)}`;

  const client = getRedisClient();

  if (!client) {
    return queryFn();
  }

  try {
    const cachedData = await client.get<unknown>(key);
    if (cachedData !== null && cachedData !== undefined) {
      if (typeof cachedData === 'string') {
        return JSON.parse(cachedData) as T;
      }
      return cachedData as T;
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
