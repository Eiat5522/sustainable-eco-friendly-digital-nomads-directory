jest.mock('broadcast-channel', () => {
  type MessageEvent = { data: unknown; type: 'message' };
  type MessageListener = (event: MessageEvent) => void;

  class BroadcastChannel {
    public name: string;
    #listeners: Set<MessageListener> = new Set();
    #onmessageHandler: MessageListener | null = null;

    constructor(name: string) {
      this.name = name;
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
    }
  }

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
  ]),
];

const defaultWarnFilters: readonly ConsoleFilter[] = [
  createIncludesSomeFilter(['Missing optional environment variable: SANITY_API_TOKEN']),
  createIncludesSomeFilter(['[listing-view]']),
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

(globalThis as GlobalConsoleFilterRegistry).withConsoleFilters = withConsoleFilters;
(globalThis as GlobalConsoleFilterRegistry).withDefaultConsoleFilters = withDefaultConsoleFilters;

declare global {
  // eslint-disable-next-line no-var
  var withConsoleFilters: typeof withConsoleFilters;
  // eslint-disable-next-line no-var
  var withDefaultConsoleFilters: typeof withDefaultConsoleFilters;
  
  interface Console {
    originalConsoleError?: typeof console.error;
    originalConsoleWarn?: typeof console.warn;
  }
}

// Apply console filters globally by default to suppress noisy test errors
// Set JEST_CONSOLE_NO_FILTER=1 to disable filtering for debugging
if (process.env.JEST_CONSOLE_NO_FILTER !== '1') {
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  const originalConsoleLog = console.log;

  // Store originals for test access - tests can spy on these
  console.originalConsoleError = originalConsoleError;
  console.originalConsoleWarn = originalConsoleWarn;

  console.error = ((...args: unknown[]) => {
    // Check if this console.error has been spied on by a test
    // If it has a mock property, it's being tested, so always call through
    const isMocked = 'mock' in console.error;
    
    if (isMocked || !shouldFilterWithFilters(defaultErrorFilters, args)) {
      originalConsoleError(...args);
    }
  }) as typeof console.error;

  console.warn = ((...args: unknown[]) => {
    // Check if this console.warn has been spied on by a test
    const isMocked = 'mock' in console.warn;
    
    if (isMocked || !shouldFilterWithFilters(defaultWarnFilters, args)) {
      originalConsoleWarn(...args);
    }
  }) as typeof console.warn;

  console.log = ((...args: unknown[]) => {
    // Don't filter console.log by default, but make it available
    originalConsoleLog(...args);
  }) as typeof console.log;
}

import { TextDecoder, TextEncoder } from 'node:util';
// jest.setup.ts
import { jest } from '@jest/globals';
import '@testing-library/jest-dom';
import { createTestData } from './src/tests/helpers/test-data';

// Provide deterministic dataset for unit tests
(global as Record<string, unknown>).__TEST_DATA__ = createTestData();

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

// Ensure basic globals are available before any mocks that depend on them
// Use `Record<string, unknown>` cast here to avoid TypeScript complaining about differences
// between Node's util TextEncoder and the DOM/global TextEncoder types.
// This is acceptable for test setup polyfills.
if (!(global as Record<string, unknown>).TextEncoder)
  (global as Record<string, unknown>).TextEncoder = TextEncoder;
if (!(global as Record<string, unknown>).TextDecoder)
  (global as Record<string, unknown>).TextDecoder = TextDecoder;

// Polyfill WHATWG Request/Response/Headers for Next.js 15 - MUST be imported early for MSW Response.clone support
import 'whatwg-fetch';

// Only attempt a node-fetch fallback if WHATWG classes are missing (e.g., non-jsdom env)
if (
  process.env.JEST_RUN_INTEGRATION !== '1' &&
  ((global as Record<string, unknown>).Request == null ||
    (global as Record<string, unknown>).Response == null ||
    (global as Record<string, unknown>).Headers == null)
) {
  import('node-fetch')
    .then(nodeFetch => {
      global.Request = global.Request || nodeFetch.Request;
      global.Response = global.Response || nodeFetch.Response;
      global.Headers = global.Headers || nodeFetch.Headers;
    })
    .catch(() => {
      // If node-fetch is not available or is ESM-only under CJS jest runtime, skip silently
    });
}

// MSW setup for tests that rely on HTTP mocks
// Skip MSW setup for model/database tests that use real mongoose
const skipMSW = process.env.JEST_USE_REAL_MONGOOSE === '1';
if (!skipMSW) {
  const serverPromise = import('./src/mocks/server')
    .then(({ server }) => server)
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

  beforeAll(async () => {
    const server = await serverPromise;
    if (server) {
      server.listen({ onUnhandledRequest: 'bypass' });
    }
  });

  afterEach(async () => {
    const server = await serverPromise;
    if (server) server.resetHandlers();
  });

  afterAll(async () => {
    const server = await serverPromise;
    if (server) server.close();
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

// Mock next/navigation globally for all tests using jest.fn
jest.mock('next/navigation', () => ({
  __esModule: true,
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  })),
  useSearchParams: jest.fn(() => new URLSearchParams()),
  usePathname: jest.fn(() => '/'),
  useParams: jest.fn(() => ({})),
  notFound: jest.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
  redirect: jest.fn(() => {
    throw new Error('NEXT_REDIRECT');
  }),
}));

// Mock next/server globally for all tests
jest.mock('next/server', () => {
  const createHeaders = (init?: HeadersInit) => {
    const HeadersCtor = (globalThis as unknown as { Headers: typeof Headers }).Headers;
    if (typeof HeadersCtor === 'function') {
      return new HeadersCtor(init ?? {});
    }

    const map = new Map<string, string>();
    if (init) {
      if (Array.isArray(init)) {
        for (const [key, value] of init) map.set(key, String(value));
      } else if (init instanceof Map) {
        for (const [key, value] of init.entries()) map.set(key, String(value));
      } else if (typeof init === 'object') {
        for (const key of Object.keys(init))
          map.set(key, String((init as Record<string, unknown>)[key]));
      }
    }

    return {
      get: (key: string) => map.get(key) ?? null,
      set: (key: string, value: string) => {
        map.set(key, value);
        return undefined;
      },
      has: (key: string) => map.has(key),
      delete: (key: string) => map.delete(key),
      entries: () => map.entries(),
      [Symbol.iterator]: map[Symbol.iterator].bind(map),
    } as unknown as Headers;
  };

  class MockNextResponse {
    public status: number;
    public headers: Headers;
    public ok: boolean;
    #body: unknown;

    constructor(body?: unknown, init?: { status?: number; headers?: HeadersInit }) {
      this.#body = body;
      this.status = init?.status ?? 200;
      this.headers = createHeaders(init?.headers);
      this.ok = this.status >= 200 && this.status < 300;
    }

    static next(): MockNextResponse {
      return new MockNextResponse(null);
    }

    static redirect(url: string | URL, status = 307): MockNextResponse {
      const target = typeof url === 'string' ? url : url.toString();
      return new MockNextResponse(null, {
        status,
        headers: { Location: target },
      });
    }

    static json(
      data: unknown,
      init: { status?: number; headers?: HeadersInit } = {}
    ): MockNextResponse {
      const headers = createHeaders({
        'Content-Type': 'application/json',
        ...(init.headers ?? {}),
      });
      return new MockNextResponse(data, { status: init.status, headers });
    }

    async json() {
      if (typeof this.#body === 'string') {
        try {
          return JSON.parse(this.#body);
        } catch (_error) {
          return this.#body;
        }
      }
      return this.#body;
    }

    async text() {
      if (typeof this.#body === 'string') {
        return this.#body;
      }
      try {
        return JSON.stringify(this.#body);
      } catch {
        return String(this.#body);
      }
    }
  }

  class MockNextRequest {
    public nextUrl: URL;
    public url: string;
    public method: string;
    public headers: Headers;
    #json: unknown;

    constructor(
      input: string | { url: string; method?: string; headers?: HeadersInit; json?: unknown }
    ) {
      if (typeof input === 'string') {
        this.url = input;
        this.method = 'GET';
        this.headers = createHeaders();
        this.#json = undefined;
      } else {
        this.url = input.url;
        this.method = input.method ?? 'GET';
        this.headers = createHeaders(input.headers);
        this.#json = input.json;
      }
      this.nextUrl = new URL(
        this.url,
        this.url.startsWith('http') ? undefined : 'http://localhost'
      );
    }

    async json() {
      return this.#json ?? {};
    }
  }

  return {
    __esModule: true,
    NextResponse: MockNextResponse,
    NextRequest: MockNextRequest,
  };
});

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

// Defensive runtime patch: some module resolution paths (Bun/ts-jest/ESM interop)
// still end up with non-jest.fn exports. Ensure the exported helpers are jest.fn
// compatible so tests can call mockReturnValue / mockResolvedValue reliably.
(() => {
  import('@/lib/rate-limit')
    .then(rl => {
      if (
        !rl ||
        typeof rl.getClientIp !== 'function' ||
        typeof (rl.getClientIp as { mockReturnValue: unknown }).mockReturnValue !== 'function'
      ) {
        // Replace with jest.fn implementations
        (rl as { getClientIp: unknown }).getClientIp = jest.fn(() => '127.0.0.1');
      }
      if (
        typeof rl.isRateLimited !== 'function' ||
        typeof (rl.isRateLimited as { mockReturnValue: unknown }).mockReturnValue !== 'function'
      ) {
        (rl as { isRateLimited: unknown }).isRateLimited = jest.fn(() => false);
      }
      if (
        typeof rl.getRetryAfterMs !== 'function' ||
        typeof (rl.getRetryAfterMs as { mockReturnValue: unknown }).mockReturnValue !== 'function'
      ) {
        (rl as { getRetryAfterMs: unknown }).getRetryAfterMs = jest.fn(() => 60_000);
      }
    })
    .catch(() => {
      // If require fails (module not found), swallow — some suites don't import rate-limit at all
    });
})();

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

// Defensive runtime patch: ensure the auth config exports are jest.fn compatible
// Some module resolution/interop paths may produce non-mock functions; this
// guarantees tests can call `.mockReturnValue` / `.mockResolvedValue` safely.
(() => {
  import('@/lib/auth/config')
    .then(ac => {
      // Coerce both named and default exports to jest.fn compatible functions
      const ensureMock = (obj: Record<string, unknown>, key: string, fallback: unknown) => {
        if (!obj) return;
        if (
          typeof obj[key] !== 'function' ||
          typeof (obj[key] as { mockReturnValue: unknown }).mockReturnValue !== 'function'
        ) {
          obj[key] = jest.fn(fallback);
        }
      };

      const actual = jest.requireActual('@/lib/auth/config') as Record<string, unknown>;

      ensureMock(ac, 'isEmailVerificationRequired', (...args: unknown[]) =>
        (actual.isEmailVerificationRequired as (...fnArgs: unknown[]) => unknown)(...args)
      );
      ensureMock(ac, 'getAdminEmails', (...args: unknown[]) =>
        (actual.getAdminEmails as (...fnArgs: unknown[]) => unknown)(...args)
      );
      ensureMock(ac, 'isAdminEmail', (...args: unknown[]) =>
        (actual.isAdminEmail as (...fnArgs: unknown[]) => unknown)(...args)
      );

      if (ac.default) {
        ensureMock(
          ac.default as Record<string, unknown>,
          'isEmailVerificationRequired',
          (...args: unknown[]) =>
            (actual.isEmailVerificationRequired as (...fnArgs: unknown[]) => unknown)(...args)
        );
        ensureMock(ac.default as Record<string, unknown>, 'getAdminEmails', (...args: unknown[]) =>
          (actual.getAdminEmails as (...fnArgs: unknown[]) => unknown)(...args)
        );
        ensureMock(ac.default as Record<string, unknown>, 'isAdminEmail', (...args: unknown[]) =>
          (actual.isAdminEmail as (...fnArgs: unknown[]) => unknown)(...args)
        );
      }

      // Expose the actual jest.fn instances from the mocked module on global
      try {
        (global as Record<string, unknown>).__AUTH_IS_EMAIL_VERIFICATION_REQUIRED =
          ac.isEmailVerificationRequired;
        (global as Record<string, unknown>).__AUTH_GET_ADMIN_EMAILS = ac.getAdminEmails;
        (global as Record<string, unknown>).__AUTH_IS_ADMIN_EMAIL = ac.isAdminEmail;
        if (ac.default) {
          (global as Record<string, unknown>).__AUTH_IS_EMAIL_VERIFICATION_REQUIRED =
            (ac.default as { isEmailVerificationRequired: unknown }).isEmailVerificationRequired ||
            (global as Record<string, unknown>).__AUTH_IS_EMAIL_VERIFICATION_REQUIRED;
        }
      } catch (_e) {
        // ignore
      }
    })
    .catch(() => {
      // Ignore - some test suites may not resolve this module during setup
    });
})();

// Also defensively patch the source file path in case some tests import
// the module by resolved path rather than the mapped alias. This ensures
// the same mocked jest.fn instance is available on all module instances.
(() => {
  import('./src/lib/auth/config')
    .then(srcAuth => {
      if (srcAuth) {
        const actual = jest.requireActual('@/lib/auth/config') as Record<string, unknown>;
        const wrap = (key: string) => {
          const impl = actual[key];
          if (typeof impl !== 'function') {
            return jest.fn();
          }
          const spy = jest.fn((...args: unknown[]) =>
            (impl as (...fnArgs: unknown[]) => unknown)(...args)
          );
          spy.mockImplementation((...args: unknown[]) =>
            (impl as (...fnArgs: unknown[]) => unknown)(...args)
          );
          return spy;
        };

        const isEmailVerificationRequired = wrap('isEmailVerificationRequired');
        const getAdminEmails = wrap('getAdminEmails');
        const isAdminEmail = wrap('isAdminEmail');

        (srcAuth as { isEmailVerificationRequired: unknown }).isEmailVerificationRequired =
          isEmailVerificationRequired;
        (srcAuth as { getAdminEmails: unknown }).getAdminEmails = getAdminEmails;
        (srcAuth as { isAdminEmail: unknown }).isAdminEmail = isAdminEmail;

        if (srcAuth.default) {
          (
            srcAuth.default as { isEmailVerificationRequired: unknown }
          ).isEmailVerificationRequired = isEmailVerificationRequired;
          (srcAuth.default as { getAdminEmails: unknown }).getAdminEmails = getAdminEmails;
          (srcAuth.default as { isAdminEmail: unknown }).isAdminEmail = isAdminEmail;
        }
      }
    })
    .catch(() => {
      // ignore if file not present or require fails
    });
})();

// Defensive runtime patch for tokens/email modules in case of alternate import paths
(() => {
  import('@/lib/tokens')
    .then(tk => {
      if (tk) {
        const ensureJestFn = (key: string, impl: () => unknown) => {
          const current = (tk as Record<string, unknown>)[key];
          if (
            typeof current !== 'function' ||
            typeof (current as { mock?: unknown })?.mock === 'undefined'
          ) {
            (tk as Record<string, unknown>)[key] = jest.fn(impl);
          }
        };
        ensureJestFn('generateToken', () => ({ raw: 'test-token-raw', hash: 'test-token-hash' }));
        ensureJestFn('hashToken', () => 'test-hash');
        ensureJestFn('minutesFromNow', () => new Date(Date.now() + 60 * 60 * 1000));
        try {
          (global as Record<string, unknown>).__TOKENS_generateToken = tk.generateToken;
          (global as Record<string, unknown>).__TOKENS_hashToken = tk.hashToken;
          (global as Record<string, unknown>).__TOKENS_minutesFromNow = tk.minutesFromNow;
        } catch (_e) {
          //ignore
        }
      }
    })
    .catch(() => {
      // ignore
    });
})();

(() => {
  import('@/lib/email')
    .then(em => {
      if (em) {
        const ensureJestFn = (key: string, impl: () => unknown) => {
          const current = (em as Record<string, unknown>)[key];
          if (
            typeof current !== 'function' ||
            typeof (current as { mock?: unknown })?.mock === 'undefined'
          ) {
            (em as Record<string, unknown>)[key] = jest.fn(impl);
          }
        };
        ensureJestFn('buildVerifyEmail', () => Promise.resolve({ to: 'test@example.com' }));
        ensureJestFn('sendMail', () => Promise.resolve({ messageId: 'test-message-id' }));
        try {
          (global as Record<string, unknown>).__EMAIL_buildVerifyEmail = em.buildVerifyEmail;
          (global as Record<string, unknown>).__EMAIL_sendMail = em.sendMail;
        } catch (_e) {
          //ignore
        }
      }
    })
    .catch(() => {
      // ignore
    });
})();
// Ensure mongodb mock collection has jest.fn() methods
(() => {
  import('@/lib/mongodb')
    .then(mongodb => {
      if (mongodb?.default) {
        mongodb.default
          .then((client: { _mockCollection: Record<string, (...args: unknown[]) => unknown> }) => {
            if (client?._mockCollection) {
              const mockCol = client._mockCollection;
              // Replace all methods with jest.fn() versions that preserve behavior
              const methods = [
                'createIndexes',
                'createIndex',
                'findOne',
                'insertOne',
                'updateOne',
                'deleteOne',
                'findOneAndUpdate',
                'deleteMany',
              ];
              methods.forEach(method => {
                if (mockCol[method] && typeof mockCol[method] === 'function') {
                  const originalFn = mockCol[method];
                  mockCol[method] = jest.fn((...args: unknown[]) =>
                    originalFn.apply(mockCol, args)
                  );
                }
              });
            }
          })
          .catch(() => {
            // ignore if client promise fails
          });
      }
    })
    .catch(() => {
      // ignore
    });
})();
