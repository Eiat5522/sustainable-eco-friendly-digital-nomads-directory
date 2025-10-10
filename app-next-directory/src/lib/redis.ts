import { Redis } from '@upstash/redis';

import { Redis } from '@upstash/redis';

let redis: Redis | null = null;

const initRedis = (): Redis => {
  if (!redis) {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      throw new Error('UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are not set');
    }
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return redis;
};

export const getRedisClient = (): Redis => {
  return initRedis();
};

export const redis = new Proxy({} as Redis, {
  get: (_, prop) => {
    return (initRedis() as any)[prop];
  }
});

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const getRedisClient = (): Redis => {
  return redis;
};

export { redis };
