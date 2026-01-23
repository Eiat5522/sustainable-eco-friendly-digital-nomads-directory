jest.mock('broadcast-channel', () => {
  type MessageEvent = { data: unknown; type: 'message' };
  type MessageListener = (event: MessageEvent) => void;
  type BroadcastChannelWithCleanup = typeof BroadcastChannel & { __cleanup: () => void };

  // Store all instances to clean them up
  const instances: Set<BroadcastChannel> = new Set();

  class BroadcastChannel {
    public name: string;
    #listeners: Set<MessageListener> = new Set();
    #onmessageHandler: MessageListener | null = null;

    constructor(name: string) {
      this.name = name;
      instances.add(this);
    }

    postMessage(message: unknown): void {
      const event: MessageEvent = { data: message, type: 'message' };
      for (const listener of this.#listeners) {
        listener(event);
      }
      this.#onmessageHandler?.(event);
    }

    addEventListener(type: string, listener: MessageListener): void {
      if (type === 'message') this.#listeners.add(listener);
    }

    removeEventListener(type: string, listener: MessageListener): void {
      if (type === 'message') this.#listeners.delete(listener);
    }

    set onmessage(fn: MessageListener | null) {
      this.#onmessageHandler = fn;
    }

    get onmessage(): MessageListener | null {
      return this.#onmessageHandler;
    }

    close(): void {
      this.#listeners.clear();
      this.#onmessageHandler = null;
      instances.delete(this);
    }
  }

  // Export cleanup function for afterEach
  (BroadcastChannel as BroadcastChannelWithCleanup).__cleanup = () => {
    for (const instance of instances) {
      instance.close();
    }
    instances.clear();
  };

  return { __esModule: true, BroadcastChannel, default: BroadcastChannel };
});

// Load polyfills FIRST before any other imports (after jest.mock calls which are hoisted)
import './jest.polyfills';

// ============================================================================
// STOP! Do not add `jest.mock('mongoose')` calls in this file.
// The Jest config maps `mongoose` to a handcrafted manual mock that provides
// schema metadata and constructor behaviour; auto-mocking erases that setup.
// If you need to change mongoose test behaviour, update `__mocks__/mongoose.ts`
// and the guard test at `src/models/__tests__/mongoose-mock.guard.test.ts`.
// ============================================================================

// React 19 compatibility fix for act function - must be before other imports
import React from 'react';

// Set React 19 act environment
(global as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

// Create a working React.act polyfill for React 19
if (typeof React.act === 'undefined') {
  React.act = (callback: () => void | Promise<void>) => {
    try {
      const result = callback();

      // If it's a promise, return it
      if (result && typeof result.then === 'function') {
        return result.then(() => undefined);
      }

      // For sync callbacks, return a resolved promise
      return Promise.resolve();
    } catch (error) {
      return Promise.reject(error);
    }
  };
}

// Console filtering helpers --------------------------------------------------
type ConsoleFilter = (args: unknown[]) => boolean;

type ConsoleFilterConfig = {
  error?: readonly ConsoleFilter[];
  warn?: readonly ConsoleFilter[];
};

const getFirstArgString = (args: unknown[]): string => {
  const [first] = args;
  if (typeof first === 'string') return first;
  if (first instanceof Error) return first.message;
  return '';
};

const createIncludesEveryFilter =
  (needles: readonly string[]): ConsoleFilter =>
  args => {
    if (!needles.length) return false;
    const message = getFirstArgString(args);
    return needles.every(needle => message.includes(needle));
  };

const createIncludesSomeFilter =
  (needles: readonly string[]): ConsoleFilter =>
  args => {
    if (!needles.length) return false;
    const message = getFirstArgString(args);
    return needles.some(needle => message.includes(needle));
  };

const jsdomNotImplementedFilter: ConsoleFilter = args => {
  const [first] = args;
  return (
    typeof first === 'object' &&
    first !== null &&
    'type' in (first as { type?: unknown }) &&
    (first as { type?: unknown }).type === 'not implemented'
  );
};

const createCombinedIncludesFilter =
  (needle: string): ConsoleFilter =>
  args =>
    args.map(String).join(' ').includes(needle);

const defaultErrorFilters: readonly ConsoleFilter[] = [
  createIncludesEveryFilter(['ReactDOMTestUtils.act', 'deprecated']),
  jsdomNotImplementedFilter,
  createIncludesSomeFilter([
    'Not implemented: navigation',
    'Not implemented: HTMLFormElement.prototype.submit',
  ]),
  createIncludesSomeFilter([
    // React testing environment warnings
    'The current testing environment is not configured to support act',
  ]),
  createIncludesSomeFilter([
    // API route errors
    'Search GET error:',
    'Search POST error:',
    'Search API failed:',
    'Search API request failed',
    'listing-view] Failed to parse',
    'listing-view] POST failed',
    'MongoDB Connection Error:',
    'Failed to submit comment:',
    'Error toggling favorite:',
    'Failed to delete listing:',
    'Error loading favorites:',
    'Error removing favorite:',
    'Failed to load listing:',
    'Error loading listing:',
    'Failed to load comments:',
    'Error fetching reviews:',
    'Failed to fetch reviews:',
    'Error creating review:',
    'Failed to create review:',
    'Error updating review:',
    'Failed to update review:',
    'Error deleting review:',
    'Failed to delete review:',
    'FeaturedListings] failed to load',
    'Error fetching blog post:',
    'Error updating blog post:',
    'Failed to persist view count',
    'Categories API error:',
    'Events API Error:',
    'Authentication error:',
    'Get user error:',
    'Newsletter subscription error:',
    'Sanity test error:',
    'GET /api/city/[slug] failed',

    // Component errors
    'Failed to check favorite status:',
    'Failed to toggle favorite:',
    'Failed to unfavorite listing:',
    'Failed to fetch featured listings:',
    'Failed to fetch listing from Sanity:',
    'Failed to fetch listing:',
    'Failed to update listing:',
    'Error fetching suggestions:',
    'Error fetching view count:',
    'Error incrementing view count:',
    'Error recording vote:',
    'Error fetching vote stats:',
    'Error resetting view counts:',
    'Error initializing view counts collection:',
    'Error revalidating path:',
    'Error fetching blog posts:',
    'Error fetching review analytics:',

    // Auth errors
    'User creation error:',
    'Update user role error:',
    'Unfavorite listing error:',
    'Update user profile error:',

    // Page errors
    'listings/[slug]] failed to fetch',
    'listings/[slug]] failed to check',

    // React test warnings - using complete pattern to avoid false positives
  ]),
  // React act warnings - must match BOTH parts to avoid suppressing real errors
  createIncludesEveryFilter(['An update to', 'inside a test was not wrapped in act']),
  // Note: Controlled/uncontrolled input warnings and value prop warnings are NOT filtered
  // as they indicate real code issues that should be visible and fixed
  createIncludesSomeFilter([
    'In HTML, <html> cannot be a child of <div>',
    'React does not recognize the',
    'Received `true` for a non-boolean attribute',
    'Invalid API response shape',
    'A component is changing an uncontrolled input to be controlled',
    'component is changing a controlled input to be uncontrolled',
    '`value` prop on `input` should not be null',
    'Received NaN for the `value` attribute',
    'Failed to fetch comments',
    'Failed to create comment',
    'Failed to record review vote',
    'Failed to fetch review vote statistics',
    '[Performance API] Error processing metrics',
    'validateDOMNesting',
  ]),
  createCombinedIncludesFilter('Received NaN for the `value` attribute'),
];

const defaultWarnFilters: readonly ConsoleFilter[] = [
  createIncludesSomeFilter(['Missing optional environment variable: SANITY_API_TOKEN']),
  createIncludesSomeFilter(['[listing-view]']),
  createIncludesSomeFilter(['Failed to revalidate comment tag']),
  createIncludesSomeFilter(['[auth] Failed to load providers']),
];

// Shared helper to check if console output should be filtered
const shouldFilterWithFilters = (filters: readonly ConsoleFilter[], args: unknown[]): boolean =>
  filters.some(filter => {
    try {
      return filter(args);
    } catch {
      return false;
    }
  });

const runWithConsoleFilters = <T>(
  callback: () => T | Promise<T>,
  filters: Required<ConsoleFilterConfig>
): T | Promise<T> => {
  const errorFilters = filters.error;
  const warnFilters = filters.warn;

  if (!errorFilters.length && !warnFilters.length) {
    return callback();
  }

  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;

  console.error = ((...args: unknown[]) => {
    if (shouldFilterWithFilters(errorFilters, args)) {
      return;
    }
    originalConsoleError(...args);
  }) as typeof console.error;

  console.warn = ((...args: unknown[]) => {
    if (shouldFilterWithFilters(warnFilters, args)) {
      return;
    }
    originalConsoleWarn(...args);
  }) as typeof console.warn;

  const restore = () => {
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
  };

  try {
    const result = callback();
    if (result && typeof (result as PromiseLike<unknown>).then === 'function') {
      return (result as PromiseLike<T>).finally(restore);
    }
    restore();
    return result as T;
  } catch (error) {
    restore();
    throw error;
  }
};

export const withConsoleFilters = <T>(
  callback: () => T | Promise<T>,
  config: ConsoleFilterConfig = {}
): T | Promise<T> => {
  const filters: Required<ConsoleFilterConfig> = {
    error: config.error ? [...config.error] : [...defaultErrorFilters],
    warn: config.warn ? [...config.warn] : [...defaultWarnFilters],
  };
  return runWithConsoleFilters(callback, filters);
};

export const withDefaultConsoleFilters = <T>(callback: () => T | Promise<T>): T | Promise<T> =>
  withConsoleFilters(callback);

type GlobalConsoleFilterRegistry = typeof globalThis & {
  withConsoleFilters?: typeof withConsoleFilters;
  withDefaultConsoleFilters?: typeof withDefaultConsoleFilters;
};

// biome-ignore lint/correctness/noInvalidUseBeforeDeclaration: TypeScript type annotation pattern
(globalThis as GlobalConsoleFilterRegistry).withConsoleFilters = withConsoleFilters;
// biome-ignore lint/correctness/noInvalidUseBeforeDeclaration: TypeScript type annotation pattern
(globalThis as GlobalConsoleFilterRegistry).withDefaultConsoleFilters = withDefaultConsoleFilters;

declare global {
  var withConsoleFilters: typeof withConsoleFilters;

  var withDefaultConsoleFilters: typeof withDefaultConsoleFilters;
}

// Apply console filters globally by default to suppress noisy test errors
// Set JEST_CONSOLE_NO_FILTER=1 to disable filtering for debugging
//
if (process.env.JEST_CONSOLE_NO_FILTER !== '1') {
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;

  (console as Console & { originalConsoleError?: typeof console.error }).originalConsoleError =
    originalConsoleError;
  (console as Console & { originalConsoleWarn?: typeof console.warn }).originalConsoleWarn =
    originalConsoleWarn;

  // Silence noisy console output in test runs; originals are kept for opt-in spying
  console.error = (() => {}) as typeof console.error;
  console.warn = (() => {}) as typeof console.warn;
  console.debug = (() => {}) as typeof console.debug;
  console.log = (() => {}) as typeof console.log;
}

// jest.setup.ts
import { jest } from '@jest/globals';
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { createTestData } from './src/tests/helpers/test-data';

// Provide deterministic dataset for unit tests
// Use a function instead of storing on global to avoid memory leaks
const testDataCache = createTestData();
Object.defineProperty(global, '__TEST_DATA__', {
  get() {
    return testDataCache;
  },
  configurable: true,
});

// Add automatic cleanup after each test to prevent memory leaks
afterEach(async () => {
  cleanup();
  // Clear all timers to prevent memory leaks
  jest.clearAllTimers();
  // Clear all mocks to release references
  jest.clearAllMocks();

  // Clean up BroadcastChannel instances
  try {
    const bcModule = await import('broadcast-channel');
    const BC = bcModule.BroadcastChannel || bcModule.default;
    if (BC && typeof (BC as { __cleanup?: () => void }).__cleanup === 'function') {
      (BC as { __cleanup: () => void }).__cleanup();
    }
  } catch (_e) {
    // Ignore if broadcast-channel is not loaded
  }

  // Run garbage collection if available (with --expose-gc flag)
  if (global.gc) {
    global.gc();
  }

  // Flush any pending promises to prevent memory leaks
  await new Promise(resolve => setTimeout(resolve, 0));
});

// Ensure real mongoose never loads under jsdom/unit runs.
// The Jest config maps `mongoose` to our manual implementation, so avoid calling
// `jest.mock` here - the automocking would erase the mock's runtime behavior.

// Integration: start a shared mongodb-memory-server once and set MONGODB_URI
if (process.env.JEST_RUN_INTEGRATION === '1' && process.env.JEST_USE_REAL_MONGOOSE === '1') {
  const g = global as Record<string, unknown>;
  const ensureServer = async () => {
    // If a test suite already set MONGODB_URI, respect it and don't start another server
    if (process.env.MONGODB_URI) {
      return;
    }
    if (!g.__GLOBAL_MONGO_SERVER__) {
      try {
        const mod = await import('./src/test-helpers/createMongoMemoryServer');
        const createMongoMemoryServer =
          mod.createMongoMemoryServer || mod.default?.createMongoMemoryServer || mod.default;
        const server = await createMongoMemoryServer();
        g.__GLOBAL_MONGO_SERVER__ = server;
        process.env.MONGODB_URI = (server as { getUri: () => string }).getUri();
      } catch (_e) {
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        const server = await MongoMemoryServer.create();
        g.__GLOBAL_MONGO_SERVER__ = server;
        process.env.MONGODB_URI = server.getUri();
      }
    } else {
      try {
        process.env.MONGODB_URI = (g.__GLOBAL_MONGO_SERVER__ as { getUri: () => string }).getUri();
      } catch {
        // ignore
      }
    }
  };

  beforeAll(async () => {
    await ensureServer();
  });

  afterAll(async () => {
    // Only stop if we started it here
    if (g.__JEST_GLOBAL_MONGO_TEARDOWN_DONE__) return;
    if (!g.__GLOBAL_MONGO_SERVER__) return;
    g.__JEST_GLOBAL_MONGO_TEARDOWN_DONE__ = true;
    try {
      await (g.__GLOBAL_MONGO_SERVER__ as { stop: () => Promise<void> })?.stop();
    } catch {
      // ignore
    }
    g.__GLOBAL_MONGO_SERVER__ = undefined;
  });
}

// MSW setup for tests that rely on HTTP mocks
// Skip MSW setup for model/database tests that use real mongoose
const skipMSW = process.env.JEST_USE_REAL_MONGOOSE === '1';
if (!skipMSW) {
  // Store server in a way that allows cleanup without holding references
  let serverInstance: {
    listen: (opts: unknown) => void;
    resetHandlers: () => void;
    close: () => void;
  } | null = null;
  let serverPromise: Promise<typeof serverInstance> | null = null;

  const getServer = () => {
    if (!serverPromise) {
      serverPromise = import('./src/mocks/server')
        .then(({ server }) => {
          serverInstance = server;
          return server;
        })
        .catch(e => {
          const code = (e as { code?: string })?.code;
          const msg = (e as Error)?.message ?? '';
          const isModuleNotFound = code === 'MODULE_NOT_FOUND' || code === 'ERR_MODULE_NOT_FOUND';
          if (
            isModuleNotFound &&
            (msg.includes('__mocks__/server') || msg.includes('./__mocks__/server'))
          ) {
            return null;
          }
          throw e;
        });
    }
    return serverPromise;
  };

  beforeAll(async () => {
    const server = await getServer();
    if (server) {
      server.listen({ onUnhandledRequest: 'bypass' });
    }
  });

  afterEach(async () => {
    if (serverInstance) {
      serverInstance.resetHandlers();
      // Ensure all pending requests are completed
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  });

  afterAll(async () => {
    if (serverInstance) {
      serverInstance.close();
      // Wait for server to fully close
      await new Promise(resolve => setTimeout(resolve, 0));
      // Clear references
      serverInstance = null;
      serverPromise = null;
    }
  });
}

// Polyfill NEXT_PUBLIC_SANITY_PROJECT_ID and NEXT_PUBLIC_SANITY_DATASET for tests
process.env.NEXT_PUBLIC_SANITY_PROJECT_ID =
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'test-project';
process.env.NEXT_PUBLIC_SANITY_DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET || 'test-dataset';

// Mock global.fetch for NextAuth.js session requests
if (!global.fetch) {
  global.fetch = () =>
    Promise.resolve(
      new global.Response(
        JSON.stringify({ user: { name: 'Test User', email: 'test@example.com' } }),
        {
          status: 200,
          statusText: 'OK',
          headers: { 'Content-Type': 'application/json' },
        }
      )
    );
}

// Ensure a safe default `window` and `window.plausible` exists to avoid
// module-load time errors in modules that access `window.plausible` during
// Individual tests may still delete or override `global.window`.
if (!(global as Record<string, unknown>).window) {
  (global as Record<string, unknown>).window = { plausible: jest.fn() };
} else if (
  typeof (global as { window?: { plausible?: unknown } }).window?.plausible !== 'function'
) {
  (global as { window: { plausible?: unknown } }).window.plausible = jest.fn();
}

// NOTE: don't globally mock '@/lib/redis' here — tests that validate the
// attach/detach helpers need to import the real module so they can assert
// helpers are attached only in test environments. Use per-test mocks when
// specific behavior is required.

// Ensure the rate-limit utilities are mocked for all tests. Some suites import
// the module early; mock it explicitly here with a factory so the
// resulting exports are guaranteed to be `jest.fn()` and support
// `.mockReturnValue` / `.mockResolvedValue` regardless of CJS/ESM interop.
jest.mock('@/lib/rate-limit', () => {
  // Using the module-level `jest` import instead of requiring it.
  return {
    __esModule: true,
    getClientIp: jest.fn(() => '127.0.0.1'),
    isRateLimited: jest.fn(() => false),
    getRetryAfterMs: jest.fn(() => 60_000),
  };
});

// Ensure auth config is mocked early so tests can spy on helpers while keeping
// the production implementation as the default behaviour.
jest.mock('@/lib/auth/config', () => {
  const actual = jest.requireActual('@/lib/auth/config') as Record<string, unknown>;

  const wrap = <T extends (...args: unknown[]) => unknown>(key: string) => {
    const impl = actual[key] as T | undefined;
    if (typeof impl !== 'function') {
      return jest.fn();
    }
    const spy = jest.fn((...args: Parameters<T>) => (impl as T)(...args));
    spy.mockImplementation((...args: Parameters<T>) => (impl as T)(...args));
    return spy;
  };

  const isEmailVerificationRequired = wrap('isEmailVerificationRequired');
  const getAdminEmails = wrap('getAdminEmails');
  const isAdminEmail = wrap('isAdminEmail');

  const shared = {
    ...actual,
    isEmailVerificationRequired,
    getAdminEmails,
    isAdminEmail,
  } as Record<string, unknown>;

  return {
    __esModule: true,
    ...shared,
    default: {
      ...shared,
    },
  };
});

// Mock tokens utilities globally (generateToken, hashToken, minutesFromNow)
jest.mock('@/lib/tokens', () => {
  // Use module-level `jest` instead of require('@jest/globals')
  return {
    __esModule: true,
    generateToken: jest.fn(() => ({ raw: 'test-token-raw', hash: 'test-token-hash' })),
    hashToken: jest.fn(() => 'test-hash'),
    minutesFromNow: jest.fn(() => new Date(Date.now() + 60 * 60 * 1000)),
  };
});

// Mock email utilities globally
jest.mock('@/lib/email', () => {
  // Use module-level `jest` instead of require('@jest/globals')
  return {
    __esModule: true,
    buildVerifyEmail: jest.fn(() =>
      Promise.resolve({
        to: 'test@example.com',
        subject: 'Verify your email',
        html: '<p>Test</p>',
        text: 'Test',
      })
    ),
    sendMail: jest.fn(() => Promise.resolve({ messageId: 'test-message-id' })),
  };
});
