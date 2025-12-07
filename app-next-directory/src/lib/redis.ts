import { Redis } from '@upstash/redis';
import { structuredLogger } from '@/lib/logger';

export type RedisLike = Pick<Redis, 'get' | 'set' | 'del' | 'incr' | 'expire' | 'ping'> &
  Record<string, unknown>;

type RedisListener = (client: Redis | undefined) => void;

type MockableGetRedisClient = (() => Redis | undefined) & {
  mockReturnValue: (client: Redis | undefined) => MockableGetRedisClient;
  mockClear: () => void;
  mockReset: () => void;
};

const listeners = new Set<RedisListener>();
let currentClient: Redis | undefined;

const notifyListeners = () => {
  for (const listener of listeners) {
    try {
      listener(currentClient);
    } catch (error) {
      structuredLogger.warn('[redis] listener threw error', error, { component: 'redis' });
    }
  }
};

const isTestEnvironment = () =>
  process.env.NODE_ENV === 'test' || typeof process.env.JEST_WORKER_ID !== 'undefined';

const getRedisCredentials = () => {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!redisUrl || !redisToken) {
    return undefined;
  }

  return { redisUrl, redisToken };
};

let missingCredentialsLogged = false;

export const createRedisClient = (): Redis | undefined => {
  // Allow opting-out of Upstash during static builds or when a maintainer needs it disabled.
  // This prevents network fetches during static prerendering which can mark pages as dynamic.
  if (process.env.DISABLE_UPSTASH_DURING_BUILD === '1') {
    return undefined;
  }

  const credentials = getRedisCredentials();

  if (!credentials) {
    if (!missingCredentialsLogged && !isTestEnvironment()) {
      missingCredentialsLogged = true;
    }

    return undefined;
  }

  const { redisUrl, redisToken } = credentials;

  try {
    return new Redis({ url: redisUrl, token: redisToken });
  } catch (error) {
    structuredLogger.warn('[redis] failed to create client', error as Error, { component: 'redis' });
    return undefined;
  }
};

const setClient = (client: Redis | undefined) => {
  currentClient = client;
  notifyListeners();
};

const baseGetRedisClient = () => {
  if (!currentClient) {
    if (isTestEnvironment()) {
      return undefined;
    }

    const client = createRedisClient();
    if (!client) {
      return undefined;
    }

    setClient(client);
  }

  return currentClient;
};

const attachMockHelpers = (getter: () => Redis | undefined): MockableGetRedisClient => {
  const mock = getter as MockableGetRedisClient;

  mock.mockReturnValue = client => {
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

export const getRedisClient = (
  isTestEnvironment() ? attachMockHelpers(baseGetRedisClient) : baseGetRedisClient
) as MockableGetRedisClient;

export const setRedisClient = (client: Redis | undefined) => {
  setClient(client);
};

export const onRedisClientChange = (listener: RedisListener) => {
  listeners.add(listener);
  listener(currentClient);

  return () => {
    listeners.delete(listener);
  };
};

export const mockRedisClient: RedisLike | undefined = isTestEnvironment()
  ? {
      async get() {
        return null;
      },
      async set() {
        return 'OK';
      },
      async del() {
        return 0;
      },
      async incr() {
        return 0;
      },
      async expire() {
        return 0 as 0 | 1;
      },
      async ping() {
        return 'PONG';
      },
    }
  : undefined;
