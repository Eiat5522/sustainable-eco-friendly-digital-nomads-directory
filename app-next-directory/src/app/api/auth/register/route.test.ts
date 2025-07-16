/**
 * NOTE: If you see "SyntaxError: Cannot use import statement outside a module" from ESM dependencies (e.g. @panva/hkdf),
 * update your Jest config to allow transforming ESM modules:
 * 
 * // jest.config.js
 * module.exports = {
 *   // ...existing config...
 *   transformIgnorePatterns: [
 *     '/node_modules/(?!(@panva|next-auth|@next-auth|@babel|uuid|@sanity|@portabletext|nanoid|lodash-es)/)',
 *   ],
 * };
 * 
 * This allows Jest to transpile ESM dependencies used by next-auth and others.
 */

//    - Error handling (auth throws)
(global as any).Request = class {};
(global as any).NextResponse = {
  json: jest.fn((data, init) => ({ data, ...init })),
};

// Mock Next.js server globals before any imports
jest.mock('next/dist/server/web/spec-extension/response', () => ({
  NextResponse: {
    json: jest.fn((data, init) => ({ data, ...init })),
  },
}));

// Mock global Response for tests that use the GET handler returning a native Response
(global as any).Response = class {
  private _body: string;
  public status: number;
  public headers: Map<string, string>;
  constructor(body: string, init: { status?: number; headers?: Record<string, string> } = {}) {
    this._body = body;
    this.status = init.status ?? 200;
    this.headers = new Map<string, string>();
    if (init.headers) {
      for (const [k, v] of Object.entries(init.headers)) {
        this.headers.set(k, v);
      }
    }
  }
  async text() {
    return this._body;
  }
  get ok() {
    return this.status >= 200 && this.status < 300;
  }
  // Minimal .json() for compatibility if needed
  async json() {
    return JSON.parse(this._body);
  }
  // Mimic Headers.get()
  get headersObj() {
    return this.headers;
  }
  get headersKeys() {
    return Array.from(this.headers.keys());
  }
  get headersValues() {
    return Array.from(this.headers.values());
  }
  get headersRaw() {
    return this.headers;
  }
  get headersAll() {
    return this.headers;
  }
  get headersCount() {
    return this.headers.size;
  }
  get headersArray() {
    return Array.from(this.headers.entries());
  }
  get headersMap() {
    return this.headers;
  }
  get headersObject() {
    const obj: Record<string, string> = {};
    for (const [k, v] of this.headers.entries()) obj[k] = v;
    return obj;
  }
  get headersList() {
    return Array.from(this.headers.entries());
  }
  get headersSet() {
    return new Set(this.headers.values());
  }
  get headersGet() {
    return (key: string) => this.headers.get(key);
  }
  get headersGetAll() {
    return (key: string) => [this.headers.get(key)];
  }
  get headersHas() {
    return (key: string) => this.headers.has(key);
  }
  get headersDelete() {
    return (key: string) => this.headers.delete(key);
  }
  get headersClear() {
    return () => this.headers.clear();
  }
  get headersSize() {
    return this.headers.size;
  }
  get headersForEach() {
    return this.headers.forEach.bind(this.headers);
  }
  get headersEntries() {
    return this.headers.entries();
  }
  get headersKeysIter() {
    return this.headers.keys();
  }
  get headersValuesIter() {
    return this.headers.values();
  }
  get headersSymbolIterator() {
    return this.headers[Symbol.iterator]();
  }
  get headersToString() {
    return () => JSON.stringify(this.headersObject);
  }
  get headersGetRaw() {
    return this.headers;
  }
  get headersSetRaw() {
    return (map: Map<string, string>) => { this.headers = map; };
  }
  get headersGetMap() {
    return () => this.headers;
  }
  get headersSetMap() {
    return (map: Map<string, string>) => { this.headers = map; };
  }
  get headersGetObject() {
    return () => this.headersObject;
  }
  get headersSetObject() {
    return (obj: Record<string, string>) => {
      this.headers.clear();
      for (const [k, v] of Object.entries(obj)) this.headers.set(k, v);
    };
  }
  get headersGetList() {
    return () => this.headersList;
  }
  get headersSetList() {
    return (list: [string, string][]) => {
      this.headers.clear();
      for (const [k, v] of list) this.headers.set(k, v);
    };
  }
  get headersGetSet() {
    return () => this.headersSet;
  }
  get headersSetSet() {
    return (set: Set<string>) => {
      this.headers.clear();
      for (const v of set) this.headers.set(v, v);
    };
  }
  get headersGetSize() {
    return () => this.headers.size;
  }
  get headersSetSize() {
    return (size: number) => { /* no-op */ };
  }
  get headersGetForEach() {
    return this.headers.forEach.bind(this.headers);
  }
  get headersSetForEach() {
    return (fn: (value: string, key: string, map: Map<string, string>) => void) => this.headers.forEach(fn);
  }
  get headersGetEntries() {
    return this.headers.entries();
  }
  get headersSetEntries() {
    return (entries: Iterable<[string, string]>) => {
      this.headers.clear();
      for (const [k, v] of entries) this.headers.set(k, v);
    };
  }
  get headersGetKeys() {
    return this.headers.keys();
  }
  get headersSetKeys() {
    return (keys: Iterable<string>) => {
      // Not meaningful for Map, so no-op
    };
  }
  get headersGetValues() {
    return this.headers.values();
  }
  get headersSetValues() {
    return (values: Iterable<string>) => {
      // Not meaningful for Map, so no-op
    };
  }
  get headersGetSymbolIterator() {
    return this.headers[Symbol.iterator]();
  }
  get headersSetSymbolIterator() {
    return (iter: Iterable<[string, string]>) => {
      this.headers.clear();
      for (const [k, v] of iter) this.headers.set(k, v);
    };
  }
  get headersGetToString() {
    return () => JSON.stringify(this.headersObject);
  }
  get headersSetToString() {
    return (str: string) => {
      try {
        const obj = JSON.parse(str);
        this.headers.clear();
        for (const [k, v] of Object.entries(obj as Record<string, string>)) this.headers.set(k, v);
      } catch {}
    };
  }
  get headersGetRawMap() {
    return this.headers;
  }
  get headersSetRawMap() {
    return (map: Map<string, string>) => { this.headers = map; };
  }
  get headersGetRawObject() {
    return this.headersObject;
  }
  get headersSetRawObject() {
    return (obj: Record<string, string>) => {
      this.headers.clear();
      for (const [k, v] of Object.entries(obj as Record<string, string>)) this.headers.set(k, v);
    };
  }
  get headersGetRawList() {
    return this.headersList;
  }
  get headersSetRawList() {
    return (list: [string, string][]) => {
      this.headers.clear();
      for (const [k, v] of list) this.headers.set(k, v);
    };
  }
  get headersGetRawSet() {
    return this.headersSet;
  }
  get headersSetRawSet() {
    return (set: Set<string>) => {
      this.headers.clear();
      for (const v of set) this.headers.set(v, v);
    };
  }
  get headersGetRawSize() {
    return this.headers.size;
  }
  get headersSetRawSize() {
    return (size: number) => { /* no-op */ };
  }
  get headersGetRawForEach() {
    return this.headers.forEach.bind(this.headers);
  }
  get headersSetRawForEach() {
    return (fn: (value: string, key: string, map: Map<string, string>) => void) => this.headers.forEach(fn);
  }
  get headersGetRawEntries() {
    return this.headers.entries();
  }
  get headersSetRawEntries() {
    return (entries: Iterable<[string, string]>) => {
      this.headers.clear();
      for (const [k, v] of entries) this.headers.set(k, v);
    };
  }
  get headersGetRawKeys() {
    return this.headers.keys();
  }
  get headersSetRawKeys() {
    return (keys: Iterable<string>) => {
      // Not meaningful for Map, so no-op
    };
  }
  get headersGetRawValues() {
    return this.headers.values();
  }
  get headersSetRawValues() {
    return (values: Iterable<string>) => {
      // Not meaningful for Map, so no-op
    };
  }
  get headersGetRawSymbolIterator() {
    return this.headers[Symbol.iterator]();
  }
  get headersSetRawSymbolIterator() {
    return (iter: Iterable<[string, string]>) => {
      this.headers.clear();
      for (const [k, v] of iter) this.headers.set(k, v);
    };
  }
  get headersGetRawToString() {
    return () => JSON.stringify(this.headersObject);
  }
};

import { POST } from './route';
import connect from '@/lib/dbConnect';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { GET } from '../test/route';
import { auth } from '@/lib/auth';

// Mock NextResponse from next/server
jest.mock('next/server', () => {
  return {
    NextResponse: {
      json: (body: any, init?: any) => {
        const response = {
          status: init?.status ?? 200,
          headers: new Map<string, string>(),
          json: async () => body,
          text: async () => JSON.stringify(body),
          ok: (init?.status ?? 200) >= 200 && (init?.status ?? 200) < 300,
          // Add direct access to body for testing
          _bodyData: body,
          // Make the body directly accessible for easier testing
          data: body,
        };
        
        // Set headers if provided
        if (init?.headers) {
          Object.entries(init.headers).forEach(([key, value]) => {
            response.headers.set(key, value as string);
          });
        }
        
        return response;
      },
    },
  };
});

// Mock dependencies
jest.mock('@/lib/dbConnect', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('@/models/User', () => ({
  findOne: jest.fn(),
  create: jest.fn(),
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
}));

/**
 * Helper to extract response body from Next.js API route handler result.
 * Handles both Response-like objects and plain objects.
 */
async function getResponseBody(response: any) {
  // For our mocked NextResponse, try direct access first
  if (response._bodyData) {
    return response._bodyData;
  }
  
  // Try the data property we added
  if (response.data) {
    return response.data;
  }
  
  // Then try the standard json() method
  if (typeof response.json === 'function') {
    return await response.json();
  }
  
  // Fallback to other possible structures
  if (response._body) return response._body;
  if (response.body) return response.body;
  return response;
}

describe('POST /api/auth/register', () => {
  let nextResponseJsonSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    // Ensure global Response is defined for GET handler tests
    if (!(global as any).Response) {
      (global as any).Response = class {
        private _body: string;
        public status: number;
        public headers: Map<string, string>;
        constructor(body: string, init: { status?: number; headers?: Record<string, string> } = {}) {
          this._body = body;
          this.status = init.status ?? 200;
          this.headers = new Map<string, string>();
          if (init.headers) {
            for (const [k, v] of Object.entries(init.headers)) {
              this.headers.set(k, v);
            }
          }
        }
        async text() {
          return this._body;
        }
        get ok() {
          return this.status >= 200 && this.status < 300;
        }
        async json() {
          return JSON.parse(this._body);
        }
      };
    }
  });

  test('should register a user successfully', async () => {
    // Arrange
    const reqBody = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    };
    const req = {
      json: jest.fn().mockResolvedValue(reqBody),
    } as any;

    (User.findOne as jest.Mock).mockResolvedValue(null);
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpassword');
    (User.create as jest.Mock).mockResolvedValue({
      _id: 'someid',
      name: 'Test User',
      email: 'test@example.com',
      role: 'user',
    });

    // Act
    const response = await POST(req);
    const body = await getResponseBody(response);

    // Assert
    expect(response.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.user.email).toBe('test@example.com');
    expect(body.data.user).not.toHaveProperty('password');
    expect(connect).toHaveBeenCalledTimes(1);
    expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
    expect(User.create).toHaveBeenCalledTimes(1);
  });

  test('should return 409 if user already exists', async () => {
    // Arrange
    const reqBody = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    };
    const req = {
      json: jest.fn().mockResolvedValue(reqBody),
    } as any;

    (User.findOne as jest.Mock).mockResolvedValue({ email: 'test@example.com' });

    // Act
    const response = await POST(req);
    const body = await getResponseBody(response);

    // Assert
    expect(response.status).toBe(409);
    expect(body.success).toBe(false);
    expect(body.error.message).toBe('User already exists');
    expect(body.error.code).toBe('CONFLICT');
    expect(User.create).not.toHaveBeenCalled();
  });

  test('should return 400 for invalid request body', async () => {
    // Arrange
    const reqBody = {
      name: 'Test User',
      email: 'test@example.com',
      // password missing
    };
    const req = {
      json: jest.fn().mockResolvedValue(reqBody),
    } as any;

    // Act
    const response = await POST(req);
    const body = await getResponseBody(response);

    // Assert
    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.message).toMatch(/Invalid request body/i);
    expect(body.error.code).toBe('INVALID_INPUT');
  });

  test('should return 500 if hashing password fails', async () => {
    // Arrange
    const reqBody = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    };
    const req = {
      json: jest.fn().mockResolvedValue(reqBody),
    } as any;

    (User.findOne as jest.Mock).mockResolvedValue(null);
    (bcrypt.hash as jest.Mock).mockRejectedValue(new Error('Hash error'));

    // Act
    const response = await POST(req);
    const body = await getResponseBody(response);

    // Assert
    expect(response.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error.message).toMatch(/hash error/i);
    expect(body.error.code).toBe('SERVER_ERROR');
    expect(User.create).not.toHaveBeenCalled();
  });

  test('should return 500 if User.create throws', async () => {
    // Arrange
    const reqBody = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    };
    const req = {
      json: jest.fn().mockResolvedValue(reqBody),
    } as any;

    (User.findOne as jest.Mock).mockResolvedValue(null);
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpassword');
    (User.create as jest.Mock).mockRejectedValue(new Error('DB error'));

    // Act
    const response = await POST(req);
    const body = await getResponseBody(response);

    // Assert
    expect(response.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error.message).toMatch(/db error/i);
    expect(body.error.code).toBe('SERVER_ERROR');
  });

  test('should return 500 if dbConnect throws', async () => {
    // Arrange
    const reqBody = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    };
    const req = {
      json: jest.fn().mockResolvedValue(reqBody),
    } as any;

    (connect as jest.Mock).mockRejectedValue(new Error('Connection error'));

    // Act
    const response = await POST(req);
    const body = await getResponseBody(response);

    // Assert
    expect(response.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error.message).toMatch(/connection error/i);
    expect(body.error.code).toBe('SERVER_ERROR');
  });

  test('should return 400 if request body is missing', async () => {
    // Arrange
    const req = {
      json: jest.fn().mockResolvedValue(undefined),
    } as any;

    // Act
    const response = await POST(req);
    const body = await getResponseBody(response);

    // Assert
    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.message).toMatch(/Invalid request body/i);
    expect(body.error.code).toBe('INVALID_INPUT');
  });

  test('should return 400 if email is missing', async () => {
    // Arrange
    const reqBody = {
      name: 'Test User',
      password: 'password123',
    };
    const req = {
      json: jest.fn().mockResolvedValue(reqBody),
    } as any;

    // Act
    const response = await POST(req);
    const body = await getResponseBody(response);

    // Assert
    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.message).toMatch(/Invalid request body/i);
    expect(body.error.code).toBe('INVALID_INPUT');
  });

  test('should return 400 if name is missing', async () => {
    // Arrange
    const reqBody = {
      email: 'test@example.com',
      password: 'password123',
    };
    const req = {
      json: jest.fn().mockResolvedValue(reqBody),
    } as any;

    // Act
    const response = await POST(req);
    const body = await getResponseBody(response);

    // Assert
    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.message).toMatch(/Invalid request body/i);
    expect(body.error.code).toBe('INVALID_INPUT');
  });

  test('should return 400 if password is missing', async () => {
    // Arrange
    const reqBody = {
      name: 'Test User',
      email: 'test@example.com',
    };
    const req = {
      json: jest.fn().mockResolvedValue(reqBody),
    } as any;

    // Act
    const response = await POST(req);
    const body = await getResponseBody(response);

    // Assert
    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.message).toMatch(/Invalid request body/i);
    expect(body.error.code).toBe('INVALID_INPUT');
  });
});
// Pseudocode plan:




jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));

const mockAuth = auth as jest.MockedFunction<typeof auth>;


// Move GET /api/auth/test tests to a top-level describe block to avoid nesting
describe('GET /api/auth/test', () => {
  const OLD_ENV = process.env;
  let originalConsoleLog: any;
  let originalConsoleError: any;

  beforeAll(() => {
    originalConsoleLog = console.log;
    originalConsoleError = console.error;
    // Silence console output during tests
    console.log = jest.fn();
    console.error = jest.fn();
  });

  afterAll(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    process.env = OLD_ENV;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...OLD_ENV, NEXTAUTH_SECRET: 'testsecret', EDGE_RUNTIME: '1' };
  });

  function mockRequest() {
    return {} as any;
  }

  it('returns 200 and correct test results when JWT is present', async () => {
    mockAuth.mockResolvedValue({ user: {
      id: '123',
      email: 'test@example.com',
      role: 'user',
      name: 'Test User',
    } });

    const response = await GET(mockRequest());
    expect(response.status).toBe(200);

    const json = JSON.parse(await response.text());
    expect(json.isAuthenticated).toBe(true);
    expect(json.user.email).toBe('test@example.com');
    expect(json.runtime).toBe('edge');

    // Security headers
    expect(response.headers.get('X-Frame-Options')).toBe('DENY');
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(response.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
  });

  it('returns 200 and isAuthenticated false if no JWT token', async () => {
    mockAuth.mockResolvedValue(null);

    const response = await GET(mockRequest());
    expect(response.status).toBe(200);

    const json = JSON.parse(await response.text());
    expect(json.isAuthenticated).toBe(false);
    expect(json.user).toBeNull();
  });

  it('returns 500 and error message if auth throws', async () => {
    mockAuth.mockRejectedValue(new Error('Auth error'));

    const response = await GET(mockRequest());
    expect(response.status).toBe(500);

    const json = JSON.parse(await response.text());
    expect(json.error).toBe('Authentication check failed');
    expect(json.message).toBe('Auth error');
  });

  it('detects edge runtime via process.env.EDGE_RUNTIME', async () => {
    mockAuth.mockResolvedValue({ user: {
      id: '123',
      email: 'test@example.com',
      role: 'user',
      name: 'Test User',
    } });
    process.env.EDGE_RUNTIME = '1';

    const response = await GET(mockRequest());
    const json = JSON.parse(await response.text());
    expect(json.runtime).toBe('edge');
  });

  it('sets all security headers in the response', async () => {
    mockAuth.mockResolvedValue({ user: {
      id: '123',
      email: 'test@example.com',
      role: 'user',
      name: 'Test User',
    } });

    const response = await GET(mockRequest());
    expect(response.headers.get('X-Frame-Options')).toBe('DENY');
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(response.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
  });
});
