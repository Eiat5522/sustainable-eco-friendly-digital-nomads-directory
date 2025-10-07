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

// React 19 compatibility fix for act function - must be before other imports
import React from 'react';

// Set React 19 act environment
(global as any).IS_REACT_ACT_ENVIRONMENT = true;

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
  
  console.log('React 19: Installed act polyfill for testing compatibility');
}

// Suppress the deprecation warning about ReactDOMTestUtils.act
const originalConsoleError = console.error;
console.error = (...args: any[]) => {
  if (
    typeof args[0] === 'string' &&
    args[0].includes('ReactDOMTestUtils.act') &&
    args[0].includes('deprecated')
  ) {
    // Suppress this specific warning
    return;
  }
  originalConsoleError.call(console, ...args);
};

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

// Ensure a safe default `window` and `window.plausible` exists to avoid
// module-load time errors in modules that access `window.plausible` during
// import. Individual tests may still delete or override `global.window`.
if (!(global as any).window) {
  (global as any).window = { plausible: jest.fn() };
} else if (typeof (global as any).window.plausible !== 'function') {
  (global as any).window.plausible = jest.fn();
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
        for (const key of Object.keys(init)) map.set(key, String((init as Record<string, unknown>)[key]));
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

  class MockNextResponse {
    public status: number;
    public headers: any;
    public ok: boolean;
    #body: unknown;

    constructor(body?: unknown, init?: { status?: number; headers?: any }) {
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

    static json(data: unknown, init: { status?: number; headers?: any } = {}): MockNextResponse {
      const headers = createHeaders({ 'Content-Type': 'application/json', ...(init.headers ?? {}) });
      return new MockNextResponse(data, { status: init.status, headers });
    }

    async json() {
      if (typeof this.#body === 'string') {
        try {
          return JSON.parse(this.#body);
        } catch (error) {
          console.warn('MockNextResponse.json failed to parse body', error);
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
    public headers: any;
    #json: unknown;

    constructor(input: string | { url: string; method?: string; headers?: any; json?: unknown }) {
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
      this.nextUrl = new URL(this.url, this.url.startsWith('http') ? undefined : 'http://localhost');
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

// Ensure the rate-limit utilities are mocked for all tests.
// Ensure the rate-limit utilities are mocked for all tests. Some test files
// import the module early; mock it explicitly here with a factory so the
// exported functions are guaranteed to be `jest.fn()` and support
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

// Ensure auth config is mocked early so tests can spy on helpers while keeping
// the production implementation as the default behaviour.
jest.mock('@/lib/auth/config', () => {
  const actual = jest.requireActual('@/lib/auth/config') as Record<string, unknown>;

  const wrap = <T extends (...args: any[]) => any>(key: string) => {
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
    buildVerifyEmail: jest.fn(() => Promise.resolve({ to: 'test@example.com', subject: 'Verify your email', html: '<p>Test</p>', text: 'Test' })),
    sendMail: jest.fn(() => Promise.resolve({ messageId: 'test-message-id' })),
  };
});

// Defensive runtime patch: ensure the auth config exports are jest.fn compatible
// Some module resolution/interop paths may produce non-mock functions; this
// guarantees tests can call `.mockReturnValue` / `.mockResolvedValue` safely.
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const ac = require('@/lib/auth/config');
  // Coerce both named and default exports to jest.fn compatible functions
  const ensureMock = (obj: any, key: string, fallback: any) => {
    if (!obj) return;
    if (typeof obj[key] !== 'function' || typeof obj[key]?.mockReturnValue !== 'function') {
      obj[key] = jest.fn(fallback);
    }
  };

  const actual = jest.requireActual('@/lib/auth/config') as Record<string, unknown>;

  ensureMock(ac, 'isEmailVerificationRequired', (...args: unknown[]) => (actual.isEmailVerificationRequired as (...fnArgs: unknown[]) => unknown)(...args));
  ensureMock(ac, 'getAdminEmails', (...args: unknown[]) => (actual.getAdminEmails as (...fnArgs: unknown[]) => unknown)(...args));
  ensureMock(ac, 'isAdminEmail', (...args: unknown[]) => (actual.isAdminEmail as (...fnArgs: unknown[]) => unknown)(...args));

  if (ac.default) {
    ensureMock(ac.default, 'isEmailVerificationRequired', (...args: unknown[]) => (actual.isEmailVerificationRequired as (...fnArgs: unknown[]) => unknown)(...args));
    ensureMock(ac.default, 'getAdminEmails', (...args: unknown[]) => (actual.getAdminEmails as (...fnArgs: unknown[]) => unknown)(...args));
    ensureMock(ac.default, 'isAdminEmail', (...args: unknown[]) => (actual.isAdminEmail as (...fnArgs: unknown[]) => unknown)(...args));
  }

  // Expose the actual jest.fn instances from the mocked module on global
  try {
    (global as any).__AUTH_IS_EMAIL_VERIFICATION_REQUIRED = ac.isEmailVerificationRequired;
    (global as any).__AUTH_GET_ADMIN_EMAILS = ac.getAdminEmails;
    (global as any).__AUTH_IS_ADMIN_EMAIL = ac.isAdminEmail;
    if (ac.default) {
      (global as any).__AUTH_IS_EMAIL_VERIFICATION_REQUIRED = ac.default.isEmailVerificationRequired || (global as any).__AUTH_IS_EMAIL_VERIFICATION_REQUIRED;
    }
  } catch (e) {
    // ignore
  }
} catch (e) {
  // Ignore - some test suites may not resolve this module during setup
}

// Also defensively patch the source file path in case some tests import
// the module by resolved path rather than the mapped alias. This ensures
// the same mocked jest.fn instance is available on all module instances.
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const srcAuth = require('./src/lib/auth/config');
  if (srcAuth) {
    const actual = jest.requireActual('@/lib/auth/config') as Record<string, unknown>;
    const wrap = (key: string) => {
      const impl = actual[key];
      if (typeof impl !== 'function') {
        return jest.fn();
      }
      const spy = jest.fn((...args: any[]) => (impl as (...fnArgs: any[]) => unknown)(...args));
      spy.mockImplementation((...args: any[]) => (impl as (...fnArgs: any[]) => unknown)(...args));
      return spy;
    };

    const isEmailVerificationRequired = wrap('isEmailVerificationRequired');
    const getAdminEmails = wrap('getAdminEmails');
    const isAdminEmail = wrap('isAdminEmail');

    srcAuth.isEmailVerificationRequired = isEmailVerificationRequired;
    srcAuth.getAdminEmails = getAdminEmails;
    srcAuth.isAdminEmail = isAdminEmail;

    if (srcAuth.default) {
      srcAuth.default.isEmailVerificationRequired = isEmailVerificationRequired;
      srcAuth.default.getAdminEmails = getAdminEmails;
      srcAuth.default.isAdminEmail = isAdminEmail;
    }

    // eslint-disable-next-line no-console
    console.log('DEBUG jest.setup: patched ./src/lib/auth/config exports');
  }
} catch (e) {
  // ignore if file not present or require fails
}

// Defensive runtime patch for tokens/email modules in case of alternate import paths
try {
  const tk = require('@/lib/tokens');
  if (tk) {
    const ensureJestFn = (key: string, impl: () => any) => {
      const current = tk[key];
      if (typeof current !== 'function' || typeof current?.mock === 'undefined') {
        tk[key] = jest.fn(impl);
      }
    };
    ensureJestFn('generateToken', () => ({ raw: 'test-token-raw', hash: 'test-token-hash' }));
    ensureJestFn('hashToken', () => 'test-hash');
    ensureJestFn('minutesFromNow', () => new Date(Date.now() + 60 * 60 * 1000));
    try {
      (global as any).__TOKENS_generateToken = tk.generateToken;
      (global as any).__TOKENS_hashToken = tk.hashToken;
      (global as any).__TOKENS_minutesFromNow = tk.minutesFromNow;
    } catch (e) {}
  }
} catch (e) {
  // ignore
}

try {
  const em = require('@/lib/email');
  if (em) {
    const ensureJestFn = (key: string, impl: () => any) => {
      const current = em[key];
      if (typeof current !== 'function' || typeof current?.mock === 'undefined') {
        em[key] = jest.fn(impl);
      }
    };
    ensureJestFn('buildVerifyEmail', () => Promise.resolve({ to: 'test@example.com' }));
    ensureJestFn('sendMail', () => Promise.resolve({ messageId: 'test-message-id' }));
    try {
      (global as any).__EMAIL_buildVerifyEmail = em.buildVerifyEmail;
      (global as any).__EMAIL_sendMail = em.sendMail;
    } catch (e) {}
  }
} catch (e) {
  // ignore
}
