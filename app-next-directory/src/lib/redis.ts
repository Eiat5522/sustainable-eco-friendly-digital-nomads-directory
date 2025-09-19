import { Redis } from '@upstash/redis';

let redisClient: Redis | undefined;

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

if (url && token) {
  try {
}
/**
 * Gets the Redis client instance if properly configured.
 * @returns Redis client instance or undefined if not configured
 */
export function getRedisClient() {
  return redisClient;
}
