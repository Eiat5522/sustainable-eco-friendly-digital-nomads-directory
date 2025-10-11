import { Redis } from '@upstash/redis';

type RedisLike = Pick<Redis, 'set' | 'get' | 'del' | 'ping' | 'incr' | 'expire'>;
type RedisListener = (client: RedisLike | undefined) => void;

// --- before (imports) ---
import { Redis } from '@upstash/redis';
import type { RedisLike } from './types';

// --- moved and wrapped env check into a function ---
const getRedisCredentials = () => {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!redisUrl || !redisToken) {
    throw new Error('UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are not set');
  }

  return { redisUrl, redisToken };
};

// --- updated createRedisClient to invoke the above ---
export const createRedisClient = (): RedisLike => {
  const { redisUrl, redisToken } = getRedisCredentials();
  return new Redis({
    url: redisUrl,
    token: redisToken,
  }) as unknown as RedisLike;
};

const listeners = new Set<RedisListener>();

const notifyListeners = () => {
  for (const listener of listeners) {
    try {
      listener(currentClient);
    } catch (error) {
      console.warn('[redis] listener threw error', error);
    }
  }
};

const createRedisClient = (): RedisLike => {
  return new Redis({
    url: redisUrl,
    token: redisToken,
  }) as unknown as RedisLike;
};

let redis: RedisLike | undefined;
let currentClient: RedisLike | undefined;

const setClient = (client: RedisLike | undefined) => {
  currentClient = client;
  redis = client;
  notifyListeners();
};
  return process.env.NODE_ENV === 'test' || typeof process.env.JEST_WORKER_ID !== 'undefined';
};

const baseGetRedisClient = () => {
  if (!currentClient) {
    if (isTestEnvironment()) {
      return undefined;
    }
    currentClient = redis = createRedisClient();
  }
  return currentClient;
};

const attachMockHelpers = (getter: () => RedisLike | undefined) => {
  const mock = getter as typeof getter & {
    mockReturnValue: (client: RedisLike | undefined) => typeof getter;
    mockClear: () => void;
    mockReset: () => void;
  };

  mock.mockReturnValue = (client) => {
    setClient(client);
    return mock;
  };

  const reset = () => {
    setClient(undefined);
  };

  mock.mockClear = reset;
  mock.mockReset = reset;

  return mock;
};

export const getRedisClient = isTestEnvironment()
  ? attachMockHelpers(baseGetRedisClient)
  : baseGetRedisClient;

export const onRedisClientChange = (listener: RedisListener) => {
  listeners.add(listener);
  listener(currentClient);

  return () => {
    listeners.del  };
};

export { redis };
