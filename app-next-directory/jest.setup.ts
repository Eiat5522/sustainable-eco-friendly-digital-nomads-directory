// Mock global.fetch for NextAuth.js session requests
if (!global.fetch) {
  global.fetch = jest.fn(() => Promise.resolve({
    ok: true,
    status: 200,
    statusText: 'OK',
    headers: new Headers(),
    redirected: false,
    type: 'basic',
    url: '',
    clone: jest.fn(),
    text: () => Promise.resolve(''),
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    blob: () => Promise.resolve(new Blob()),
    formData: () => Promise.resolve(new FormData()),
    json: () => Promise.resolve({ user: { name: 'Test User', email: 'test@example.com' } })
  })) as jest.MockedFunction<typeof fetch>;
}

// Existing setup below
import { TextEncoder, TextDecoder } from 'util';

// Global Response mock for Next.js API routes
global.Response = class Response {
  status: number;
  statusText: string;
  headers: Headers;
  body: any;

  constructor(body?: BodyInit | null, init?: ResponseInit) {
    this.status = init?.status || 200;
    this.statusText = init?.statusText || 'OK';
    this.headers = new Headers(init?.headers);
    this.body = body;
  }

  static json(data: any, init?: ResponseInit) {
    return new Response(JSON.stringify(data), {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init?.headers,
      },
    });
  }

  json() {
    return Promise.resolve(JSON.parse(this.body));
  }
} as any;

// Mock Headers for global Response
global.Headers = class Headers {
  private headers: Record<string, string> = {};

  constructor(init?: HeadersInit) {
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

  set(name: string, value: string) {
    this.headers[name] = value;
  }

  get(name: string) {
    return this.headers[name];
  }
} as any;

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
