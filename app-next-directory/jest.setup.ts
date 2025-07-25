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

// Existing setup below
const { TextEncoder, TextDecoder } = require('util');

// Global Response mock for Next.js API routes
global.Response = class Response {
  constructor(body, init) {
    this.status = (init && init.status) || 200;
    this.statusText = (init && init.statusText) || 'OK';
    this.headers = new Headers(init && init.headers);
    this.body = body;
  }

  static json(data, init) {
    return new Response(JSON.stringify(data), {
      ...(init || {}),
      headers: {
        'Content-Type': 'application/json',
        ...(init && init.headers ? init.headers : {}),
      },
    });
  }
  json() {
    return Promise.resolve(JSON.parse(this.body));
  }
}

// Mock Headers for global Response
global.Headers = class Headers {
  constructor(init) {
    this.headers = {};
    if (init) {
      if (Array.isArray(init)) {
        init.forEach(([key, value]) => this.headers[key] = value);
      } else if (init instanceof Headers) {
        // Copy headers if Headers instance
      } else {
        Object.entries(init).forEach(([key, value]) => this.headers[key] = value);
      }
    }
  }

  set(name, value) {
    this.headers[name] = value;
  }

  get(name) {
    return this.headers[name];
  }
}

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
