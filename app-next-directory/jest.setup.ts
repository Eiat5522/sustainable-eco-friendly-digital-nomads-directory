jest.mock('broadcast-channel', () => {
  class BroadcastChannel {
    name;
    #listeners = new Set();
    #onmessageHandler = null;
    
    constructor(name) {
      this.name = name;
    }
    
    postMessage(message) {
      const event = { data: message, type: 'message' };
      for (const l of this.#listeners) l(event);
      if (this.#onmessageHandler) this.#onmessageHandler(event);
    }
    
    addEventListener(type, listener) {
      if (type === 'message') this.#listeners.add(listener);
    }
    
    removeEventListener(type, listener) {
      if (type === 'message') this.#listeners.delete(listener);
    }
    
    set onmessage(fn) {
      this.#onmessageHandler = fn;
    }

    get onmessage() {
      return this.#onmessageHandler;
    }
    
    close() {
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

// MSW setup for tests that rely on HTTP mocks
try {
  const { server } = require('./__mocks__/server');
  beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());
} catch (e) {
  // MSW not used in some test suites
}

// Use `any` cast here to avoid TypeScript complaining about differences
// between Node's util TextEncoder and the DOM/global TextEncoder types.
// This is acceptable for test setup polyfills.
if (!(global as any).TextEncoder) (global as any).TextEncoder = TextEncoder;
if (!(global as any).TextDecoder) (global as any).TextDecoder = TextDecoder;

// Polyfill NEXT_PUBLIC_SANITY_PROJECT_ID and NEXT_PUBLIC_SANITY_DATASET for tests
process.env.NEXT_PUBLIC_SANITY_PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'test-project';
process.env.NEXT_PUBLIC_SANITY_DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET || 'test-dataset';

// Polyfill WHATWG Request/Response/Headers for Next.js 15
try {
  require('whatwg-fetch');
} catch (e) {
  console.warn('whatwg-fetch polyfill not applied:', e);
}

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

// Mock next/server globally for all tests  
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data: any, init?: { status?: number }) => ({
      status: init?.status || 200,
      json: () => Promise.resolve(data),
    })),
  },
}));

// Mock the internal NextResponse module that we're now importing from
jest.mock('next/dist/server/web/spec-extension/response', () => ({
  NextResponse: {
    json: jest.fn((data: any, init?: { status?: number }) => ({
      status: init?.status || 200,
      json: () => Promise.resolve(data),
    })),
  },
}));

// Ensure ApiResponseHandler is mockable across ESM boundaries for all tests
// Note: individual tests can override via jest.unmock('@/utils/api-response') before import
jest.mock('@/utils/api-response', () => {
  const actual = jest.requireActual('@/utils/api-response') as Record<string, any>;
  const res = (body: unknown, status: number = 200) => ({
    status,
    json: () => Promise.resolve(body),
  });
  return {
    ...actual,
    ApiResponseHandler: {
      success: jest.fn((data: unknown) => res({ success: true, data }, 200)),
      error:   jest.fn((message: string, status: number = 400) => res({ error: message }, status)),
      notFound:      jest.fn((message = 'Not Found')    => res({ error: message }, 404)),
      unauthorized:  jest.fn((message = 'Unauthorized')  => res({ error: message }, 401)),
      forbidden:     jest.fn((message = 'Forbidden')     => res({ error: message }, 403)),
    },
  } as Record<string, any>;
});