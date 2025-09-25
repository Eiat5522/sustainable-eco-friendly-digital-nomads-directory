import { Redis } from '@upstash/redis';

type RedisInstance = Redis | undefined;

let redisClient: RedisInstance;

type RedisClientListener = (client: RedisInstance) => void;
const listeners = new Set<RedisClientListener>();

const notifyListeners = (client: RedisInstance) => {
  redisClient = client;

  for (const listener of listeners) {
    try {
      listener(client);
    } catch (error) {
      // Listeners are best-effort; never let a failing listener break others.
      console.warn('[redis] Listener error during client update', error);
    }
  }
};

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

if (url && token) {
  try {
    // Initialize Upstash Redis client when configuration is present.
    notifyListeners(new Redis({ url, token }));
  } catch (error) {
    // Log initialization errors but do not rethrow to avoid crashing the app
    // during module load when Redis is optional.
    console.error('Failed to initialize Upstash Redis client:', error);
    notifyListeners(undefined);
  }
} else {
  notifyListeners(undefined);
}

export function getRedisClient(): Redis | undefined {
  return redisClient;
}

export function onRedisClientChange(listener: RedisClientListener): () => void {
  listeners.add(listener);
  listener(redisClient);

  return () => {
    listeners.delete(listener);
  };
}

// Provide lightweight mocking helpers so that unit tests can replace the Redis
// client without relying on Jest-specific helpers being attached to this
// function at runtime (which is not guaranteed when using ESM).
const attachMockHelpers = () => {
  const getter = getRedisClient as typeof getRedisClient & {
    mockReturnValue?: (client: RedisInstance) => typeof getRedisClient;
    mockClear?: () => void;
  };

  if (typeof getter.mockReturnValue !== 'function') {
    getter.mockReturnValue = (client: RedisInstance) => {
      notifyListeners(client);
      return getRedisClient;
    };
  }

  if (typeof getter.mockClear !== 'function') {
    getter.mockClear = () => {
      notifyListeners(undefined);
    };
  }
};

attachMockHelpers();
