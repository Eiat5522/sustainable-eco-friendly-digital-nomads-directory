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

// Track the current client so subscribers receive the current state
let currentClient: any = mockRedisClient;

// Listener registry for onRedisClientChange
const listeners: Set<(client: any) => void> = new Set();

export function onRedisClientChange(fn: (client: any) => void) {
  listeners.add(fn);
  // Immediately notify subscriber of current client to match runtime behaviour
  try {
    fn(currentClient);
  } catch (e) {
    // best-effort
  }

  return () => listeners.delete(fn);
}

export function _notifyRedisClientChange(client: any) {
  currentClient = client;
  for (const l of Array.from(listeners)) {
    try {
      l(client);
    } catch (e) {
      // Listener errors should not break the emitter
    }
  }
}

export const getRedisClient = jest.fn(() => mockRedisClient);

// Provide test helper shims so tests can call mockGetRedisClient.mockClear()
// and friends on the exported function. These helpers also update the
// `currentClient` and notify listeners to mimic the real `src/lib/redis.ts`.
(getRedisClient as any).mockClear = () => {
  // Make getRedisClient return undefined and notify listeners
  (getRedisClient as any).mockImplementation(() => undefined);
  _notifyRedisClientChange(undefined);
  // clear recorded calls
  (getRedisClient as any).mock.calls = [];
};

(getRedisClient as any).mockReset = () => {
  // Reset to default: return undefined and clear listeners and mocks
  (getRedisClient as any).mockImplementation(() => undefined);
  _notifyRedisClientChange(undefined);
  listeners.clear();

  // Reset internal mock implementations on the mock client
  for (const key of Object.keys(mockRedisClient)) {
    const v: any = (mockRedisClient as any)[key];
    if (v && typeof v.mockReset === 'function') v.mockReset();
  }
  (getRedisClient as any).mock.calls = [];
};

(getRedisClient as any).mockReturnValue = (val: any) => {
  (getRedisClient as any).mockImplementation(() => val);
  _notifyRedisClientChange(val);
};

export default getRedisClient;