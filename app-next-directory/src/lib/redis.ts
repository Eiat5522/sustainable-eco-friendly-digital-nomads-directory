import { Redis } from '@upstash/redis';

type RedisLike = Pick<Redis, 'set' | 'get' | 'del' | 'ping' | 'incr' | 'expire'> & Record<string, any>;
type RedisListener = (client: RedisLike | undefined) => void;

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

if (!redisUrl || !redisToken) {
  throw new Error('UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are not set');
}

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

let redis: RedisLike = createRedisClient();
let currentClient: RedisLike | undefined = redis;

const setClient = (client: RedisLike | undefined) => {
  currentClient = client;
  if (client) {
    redis = client;
  }
  notifyListeners();
};

const isTestEnvironment = () => {
  return process.env.NODE_ENV === 'test' || typeof process.env.JEST_WORKER_ID !== 'undefined';
};

const baseGetRedisClient = () => {
  if (!currentClient && !isTestEnvironment()) {
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
    listeners.delete(listener);
  };
};

export { redis };
