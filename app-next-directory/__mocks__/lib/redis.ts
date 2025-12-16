import { jest } from '@jest/globals';

// Mock Redis client with common methods used in rate limiting
const mockRedisClient = {
  incr: jest.fn().mockResolvedValue(1),
  expire: jest.fn().mockResolvedValue(1),
  evalSha: jest.fn().mockResolvedValue(['1', '1']),
  script: jest.fn().mockReturnValue({
    load: jest.fn().mockResolvedValue('script-hash'),
  }),
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue('OK'),
  del: jest.fn().mockResolvedValue(1),
  exists: jest.fn().mockResolvedValue(0),
  ttl: jest.fn().mockResolvedValue(-1),
  ping: jest.fn().mockResolvedValue('PONG'),
};

// Type describing the runtime shape of our mock Redis client
type RedisClient = typeof mockRedisClient;

// Track the current client so subscribers receive the current state
let currentClient: RedisClient | undefined = mockRedisClient;

// Listener registry for onRedisClientChange
const listeners: Set<(client: RedisClient | undefined) => void> = new Set();

export function onRedisClientChange(fn: (client: RedisClient | undefined) => void) {
  listeners.add(fn);
  // Immediately notify subscriber of current client to match runtime behaviour
  try {
    fn(currentClient);
  } catch (_e) {
    // best-effort
  }

  return () => listeners.delete(fn);
}

export function _notifyRedisClientChange(client: RedisClient | undefined) {
  currentClient = client;
  for (const l of Array.from(listeners)) {
    try {
      l(client);
    } catch (_e) {
      // Listener errors should not break the emitter
    }
  }
}

export const getRedisClient: jest.Mock<RedisClient | undefined, []> = jest.fn(
  () => mockRedisClient
);

// Provide test helper shims so tests can call mockGetRedisClient.mockClear()
// and friends on the exported function. These helpers also update the
// `currentClient` and notify listeners to mimic the real `src/lib/redis.ts`.
type GetRedisClientMock = jest.Mock<RedisClient | undefined, []> & {
  mockClear?: () => void;
  mockResetClient?: () => void;
  mockClearAndReset?: () => void;
};

const getRedisClientMock = getRedisClient as GetRedisClientMock;

getRedisClientMock.mockClear = () => {
  // Only clear recorded calls to align with Jest's mockClear semantics in our shim
  getRedisClientMock.mock.calls = [] as unknown as Array<unknown[]>;
};

getRedisClientMock.mockResetClient = () => {
  getRedisClientMock.mockImplementation(() => undefined);
  _notifyRedisClientChange(undefined);
  listeners.clear();
};

// Alias for legacy usage
getRedisClientMock.mockClearAndReset = getRedisClientMock.mockResetClient;

export default getRedisClient;
