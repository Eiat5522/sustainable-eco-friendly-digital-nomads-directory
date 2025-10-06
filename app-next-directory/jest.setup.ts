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

// jest.setup.ts
import { jest } from '@jest/globals';
import './jest.polyfills';
import { TextEncoder, TextDecoder } from 'util';
import '@testing-library/jest-dom';
import { createTestData } from './src/tests/helpers/test-data';

// Provide deterministic dataset for unit tests
;(global as any).__TEST_DATA__ = createTestData();

// Ensure basic globals are available before any mocks that depend on them
// Use `any` cast here to avoid TypeScript complaining about differences
// between Node's util TextEncoder and the DOM/global TextEncoder types.
// This is acceptable for test setup polyfills.
if (!(global as any).TextEncoder) (global as any).TextEncoder = TextEncoder;
if (!(global as any).TextDecoder) (global as any).TextDecoder = TextDecoder;

// Polyfill WHATWG Request/Response/Headers for Next.js 15 - MUST be imported early for MSW Response.clone support
import 'whatwg-fetch';

// Polyfill for Request, Response, Headers for Next.js API route tests (node-fetch fallback)
try {
  const nodeFetch = require('node-fetch');
  global.Request = global.Request || nodeFetch.Request;
  global.Response = global.Response || nodeFetch.Response;
  global.Headers = global.Headers || nodeFetch.Headers;
} catch (e) {
  // If node-fetch is not available, warn
  console.warn('node-fetch polyfill for Request/Response/Headers not applied:', e);
}

// MSW setup for tests that rely on HTTP mocks
try {
  const { server } = require('./__mocks__/server');
  beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());
} catch (e) {
  const code = (e as any)?.code;
  const msg = (e as Error)?.message ?? '';
  const isModuleNotFound =
    code === 'MODULE_NOT_FOUND' || code === 'ERR_MODULE_NOT_FOUND';
  // Swallow only if the unresolved module is the MSW server shim itself
  if (
    isModuleNotFound &&
    (msg.includes('__mocks__/server') || msg.includes('./__mocks__/server'))
  ) {
    // MSW not used in some test suites
  } else {
    throw e;
  }
}

// Polyfill NEXT_PUBLIC_SANITY_PROJECT_ID and NEXT_PUBLIC_SANITY_DATASET for tests
process.env.NEXT_PUBLIC_SANITY_PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'test-project';
process.env.NEXT_PUBLIC_SANITY_DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET || 'test-dataset';

// Mock global.fetch for NextAuth.js session requests
if (!global.fetch) {
  global.fetch = function () {
    return Promise.resolve(new global.Response(
      JSON.stringify({ user: { name: 'Test User', email: 'test@example.com' } }),
      {
        status: 200,
        statusText: 'OK',
        headers: { 'Content-Type': 'application/json' }
      }
    ));
  };
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
  const createHeaders = (init?: any) => {
    const HeadersCtor = (globalThis as any).Headers;
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
        for (const key of Object.keys(init)) map.set(key, String(init[key]));
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
    } as any;
  };

  return {
    NextResponse: {
      json: jest.fn((data: any, init?: { status?: number; headers?: any }) => {
        const status = init?.status ?? 200;
        const headers = createHeaders(init?.headers);

        return {
          status,
          headers,
          ok: status >= 200 && status < 300,
          json: () => Promise.resolve(data),
          text: () => Promise.resolve(JSON.stringify(data)),
        };
      }),
    },
  };
});

jest.mock('@/lib/redis', () => {
  const mockRedisClient = {
    incr: jest.fn(async () => 1),
    expire: jest.fn(async () => 1),
    evalSha: jest.fn(async () => ['1', '1'] as const),
    script: jest.fn(() => ({
      load: jest.fn(async () => 'script-hash'),
    })),
  };

  return {
    __esModule: true,
    getRedisClient: jest.fn(() => mockRedisClient),
  };
});

// Ensure the rate-limit utilities are mocked for all tests.
// Ensure the rate-limit utilities are mocked for all tests. Some test files
// import the module early; mock it explicitly here with a factory so the
// exported functions are guaranteed to be `jest.fn()` and support
// `.mockReturnValue` / `.mockResolvedValue` regardless of CJS/ESM interop.
jest.mock('@/lib/rate-limit', () => {
  // Using a factory keeps the mock creation in Jest's module system
  // and avoids runtime require()/interop surprises.
  const { jest } = require('@jest/globals');
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
try {
  // Use require to avoid static ESM resolution issues in the test environment
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const rl = require('@/lib/rate-limit');
  if (!rl || typeof rl.getClientIp !== 'function' || typeof rl.getClientIp?.mockReturnValue !== 'function') {
    // Replace with jest.fn implementations
    rl.getClientIp = jest.fn(() => '127.0.0.1');
  }
  if (typeof rl.isRateLimited !== 'function' || typeof rl.isRateLimited?.mockReturnValue !== 'function') {
    rl.isRateLimited = jest.fn(() => false);
  }
  if (typeof rl.getRetryAfterMs !== 'function' || typeof rl.getRetryAfterMs?.mockReturnValue !== 'function') {
    rl.getRetryAfterMs = jest.fn(() => 60_000);
  }
} catch (e) {
  // If require fails (module not found), swallow — some suites don't import rate-limit at all
}

// Ensure auth config is mocked early so tests can call .mockReturnValue
jest.mock('@/lib/auth/config', () => {
  const { jest } = require('@jest/globals');
  return {
    __esModule: true,
    default: {
      isEmailVerificationRequired: jest.fn(() => false),
    },
    isEmailVerificationRequired: jest.fn(() => false),
  };
});

// Defensive runtime patch: ensure the auth config exports are jest.fn compatible
// Some module resolution/interop paths may produce non-mock functions; this
// guarantees tests can call `.mockReturnValue` / `.mockResolvedValue` safely.
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const ac = require('@/lib/auth/config');
  if (!ac) throw new Error('auth config not found');

  if (typeof ac.isEmailVerificationRequired !== 'function' || typeof ac.isEmailVerificationRequired?.mockReturnValue !== 'function') {
    ac.isEmailVerificationRequired = jest.fn(() => false);
  }

  if (ac.default) {
    if (typeof ac.default.isEmailVerificationRequired !== 'function' || typeof ac.default.isEmailVerificationRequired?.mockReturnValue !== 'function') {
      ac.default.isEmailVerificationRequired = jest.fn(() => false);
    }
  }
} catch (e) {
  // Ignore - some test suites may not resolve this module during setup
}
