import { Redis } from '@upstash/redis';

let redisClient: Redis | undefined;

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

if (url && token) {
  try {
    // Initialize Upstash Redis client when configuration is present
    redisClient = new Redis({ url, token });
  } catch (error) {
    // Log initialization errors but do not rethrow to avoid crashing the app
    // during module load when Redis is optional.
     
    console.error('Failed to initialize Upstash Redis client:', error);
  }
}

export function getRedisClient(): Redis | undefined {
  return redisClient;
}
