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
  // Only clear recorded calls to align with Jest's mockClear semantics in our shim
  // Do not alter implementation or notify listeners here.
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

// Provide an explicit, lighter reset that only changes the return implementation
// and notifies listeners, without clearing other internal mocks or listeners.
// This allows tests to opt-in to resetting the client state without the side effects
// previously bundled into mockClear.
(getRedisClient as any).mockResetClient = () => {
  (getRedisClient as any).mockImplementation(() => undefined);
  _notifyRedisClientChange(undefined);
};

// Back-compat alias with a descriptive name if tests expect a combined action
(getRedisClient as any).mockClearAndReset = (getRedisClient as any).mockResetClient;

export default getRedisClient;