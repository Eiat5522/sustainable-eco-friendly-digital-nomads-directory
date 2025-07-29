// jest.setup.ts

import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

// Polyfill for TextEncoder and TextDecoder for Jest environment
Object.assign(global, { TextDecoder, TextEncoder });

// Polyfill WHATWG Request/Response/Headers for Next.js 15
try {
  require('whatwg-fetch');
} catch (e) {
  console.warn('whatwg-fetch polyfill not applied:', e);
}

// Polyfill ReadableStream for Next.js 15 API routes
try {
  global.ReadableStream = require('web-streams-polyfill/ponyfill').ReadableStream;
} catch (e) {
  console.warn('web-streams-polyfill for ReadableStream not applied:', e);
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
// TEMPORARILY COMMENTED OUT FOR DEBUGGING useSearch tests
/*
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
*/

// Mock next/server globally for all tests  
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, init) => ({
      status: init?.status || 200,
      json: () => Promise.resolve(data),
    })),
  },
}));

// Mock the internal NextResponse module that we're now importing from
jest.mock('next/dist/server/web/spec-extension/response', () => ({
  NextResponse: {
    json: jest.fn((data, init) => ({
      status: init?.status || 200,
      json: () => Promise.resolve(data),
    })),
  },
}));
// ...existing code...
