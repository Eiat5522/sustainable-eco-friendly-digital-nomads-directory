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

/**
 * Jest mock helpers:
 * - mockClear: only clears call history (matches Jest semantics)
 * - mockResetClient: resets implementation to undefined and notifies listeners (for full reset)
 *
 * Use mockClear for normal test isolation. Use mockResetClient if you need to simulate client disconnect/reset.
 */
(getRedisClient as any).mockClear = () => {
  // Only clear recorded calls to align with Jest's mockClear semantics in our shim
  (getRedisClient as any).mock.calls = [];
};

(getRedisClient as any).mockResetClient = () => {
  (getRedisClient as any).mockImplementation(() => undefined);
  _notifyRedisClientChange(undefined);
  listeners.clear();
  // Optionally, reset internal mock implementations on the mock client if needed
};

// Alias for legacy usage
(getRedisClient as any).mockClearAndReset = (getRedisClient as any).mockResetClient;
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