// jest.setup.ts

import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

// Polyfill for TextEncoder and TextDecoder for Jest environment
Object.assign(global, { TextDecoder, TextEncoder });

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

// Mock problematic ESM import before anything else
jest.mock('mongodb', () => {
  const mDb = { collection: jest.fn().mockReturnValue('mockCollection') };
  const mClient = { db: jest.fn().mockReturnValue(mDb) };
  return {
    MongoClient: Object.assign(jest.fn(() => mClient), {
      connect: jest.fn().mockResolvedValue(mClient)
    })
  };
});

jest.mock('@/lib/mongodb', () => ({
  __esModule: true,
  default: {},
}));

// Mock external dependencies
jest.mock('@/utils/db-helpers');
jest.mock('@/utils/auth-helpers');
jest.mock('@/utils/api-response');

require('@testing-library/jest-dom');