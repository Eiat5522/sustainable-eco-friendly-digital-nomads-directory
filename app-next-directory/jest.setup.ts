import { TextEncoder, TextDecoder } from 'util';

// Mock next/server globally for all tests
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, init) => ({
      status: init?.status || 200,
      json: () => Promise.resolve(data),
    })),
  },
}));

// Polyfill for TextEncoder and TextDecoder for Jest environment
Object.assign(global, { TextDecoder, TextEncoder });

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