
import { redis } from './redis';

const CACHE_TTL_SECONDS = 60 * 60; // 1 hour

export async function withMongooseCache(model: any, queryName: string, queryFn: () => Promise<any>, ttl: number = CACHE_TTL_SECONDS) {
  const key = `mongoose:${model.modelName}:${queryName}:${JSON.stringify(queryFn)}`;
  let cachedData = await redis.get(key);

  if (cachedData) {
    return JSON.parse(cachedData as string);
  }

  const data = await queryFn();
  await redis.set(key, JSON.stringify(data), { ex: ttl });
  return data;
}
