import { jest } from '@jest/globals';
import { testApiHandler } from 'next-test-api-route-handler';

type HeaderRecord = Record<string, string>;

type MockHeaders = {
  get: (key: string) => string | null;
  set: (key: string, value: string) => void;
  has: (key: string) => boolean;
  delete: (key: string) => boolean;
  entries: () => IterableIterator<[string, string]>;
  [Symbol.iterator]: () => IterableIterator<[string, string]>;
};

type MockResponse<T> = {
  status: number;
  headers: MockHeaders;
  body: T;
  json: () => Promise<T>;
};

const createHeaders = (init: HeaderRecord = {}): MockHeaders => {
  const store = new Map<string, string>();
  for (const [key, value] of Object.entries(init)) {
    store.set(key.toLowerCase(), String(value));
  }
  return {
    get: (key: string) => store.get(key.toLowerCase()) ?? null,
    set: (key: string, value: string) => {
      store.set(key.toLowerCase(), String(value));
    },
    has: (key: string) => store.has(key.toLowerCase()),
    delete: (key: string) => store.delete(key.toLowerCase()),
    entries: () => store.entries(),
    [Symbol.iterator]: () => store[Symbol.iterator](),
  };
};

const createResponse = <T>(payload: T, init: { status?: number; headers?: HeaderRecord } = {}): MockResponse<T> => {
  const headers = createHeaders(init.headers);
  const status = init.status ?? 200;
  return {
    status,
    headers,
    body: payload,
    json: async () => payload,
  };
};

const nextResponseJson = jest.fn(createResponse);
const nextResponseNext = jest.fn(() => createResponse(null));
const nextResponseRedirect = jest.fn((url: string | URL, statusOrInit?: number | { status?: number; headers?: HeaderRecord }) => {
  const status = typeof statusOrInit === 'number' ? statusOrInit : statusOrInit?.status ?? 307;
  const headers = typeof statusOrInit === 'object' && statusOrInit?.headers
    ? statusOrInit.headers
    : { Location: typeof url === 'string' ? url : url.toString() };
  return createResponse(null, { status, headers });
});

class MockNextRequest {
  public url: string;
  public method: string;
  #jsonValue: unknown;

  constructor(input: { url: string; method?: string; json?: unknown }) {
    this.url = input.url;
    this.method = input.method ?? 'GET';
    this.#jsonValue = input.json;
  }

  async json() {
    return this.#jsonValue ?? {};
  }
}

await jest.unstable_mockModule('next/server', () => ({
  __esModule: true,
  NextResponse: {
    json: nextResponseJson,
    next: nextResponseNext,
    redirect: nextResponseRedirect,
  },
  NextRequest: MockNextRequest,
}));

const mockDbConnect = jest.fn();
await jest.unstable_mockModule('@/lib/dbConnect', () => ({
  __esModule: true,
  default: mockDbConnect,
}));

const mockUserFindOne = jest.fn();
const mockUserCreate = jest.fn();
const mockUserCountDocuments = jest.fn();
const userModel = {
  findOne: mockUserFindOne,
  create: mockUserCreate,
  countDocuments: mockUserCountDocuments,
};
await jest.unstable_mockModule('@/models/User', () => ({
  __esModule: true,
  default: userModel,
}));

const mockBcryptHash = jest.fn();
await jest.unstable_mockModule('bcryptjs', () => ({
  __esModule: true,
  default: { hash: mockBcryptHash },
  hash: mockBcryptHash,
}));

const mockAuth = jest.fn();
await jest.unstable_mockModule('@/lib/auth', () => ({
  __esModule: true,
  auth: mockAuth,
  default: { auth: mockAuth },
}));

const { POST: registerPOST } = await import('./route');
const { GET: authGET } = await import('../test/route');

const getResponseBody = async <T = any>(response: any): Promise<T> => {
  if (typeof response?.json === 'function') {
    return response.json();
  }
  return response?.body ?? response;
};

const createRequest = (body: unknown) => ({
  json: jest.fn().mockResolvedValue(body),
});

describe('Registration API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDbConnect.mockReset();
    mockUserFindOne.mockReset();
    mockUserCreate.mockReset();
    mockUserCountDocuments.mockReset();
    mockBcryptHash.mockReset();
    mockAuth.mockReset();
    nextResponseJson.mockImplementation(createResponse);
    nextResponseNext.mockImplementation(() => createResponse(null));
    nextResponseRedirect.mockImplementation((url: string | URL, statusOrInit?: number | { status?: number; headers?: HeaderRecord }) => {
      const status = typeof statusOrInit === 'number' ? statusOrInit : statusOrInit?.status ?? 307;
      const headers = typeof statusOrInit === 'object' && statusOrInit?.headers
        ? statusOrInit.headers
        : { Location: typeof url === 'string' ? url : url.toString() };
      return createResponse(null, { status, headers });
    });
    process.env.MONGODB_URI = 'mongodb://localhost:27017/tests';
    delete process.env.EDGE_RUNTIME;
  });

  afterEach(() => {
    delete process.env.MONGODB_URI;
    delete process.env.EDGE_RUNTIME;
  });

  describe('POST /api/auth/register', () => {
    it('registers a user successfully', async () => {
      const reqBody = { name: 'Test User', email: 'test@example.com', password: 'password123' };
      const req = createRequest(reqBody);

      mockDbConnect.mockResolvedValue(undefined);
      mockUserFindOne.mockResolvedValue(null);
      mockBcryptHash.mockResolvedValue('hashed');
      mockUserCreate.mockResolvedValue({
        _id: 'user-1',
        name: 'Test User',
        email: 'test@example.com',
        role: 'user',
        toObject: () => ({
          _id: 'user-1',
          name: 'Test User',
          email: 'test@example.com',
          role: 'user',
        }),
      });

      const response = await registerPOST(req as any);
      const body = await getResponseBody(response);

      expect(response.status).toBe(201);
      expect(body.success).toBe(true);
      expect(body.data.user).toEqual({
        _id: 'user-1',
        name: 'Test User',
        email: 'test@example.com',
        role: 'user',
      });

      expect(mockDbConnect).toHaveBeenCalledTimes(1);
      expect(mockUserFindOne).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(mockBcryptHash).toHaveBeenCalledWith('password123', 10);
      expect(mockUserCreate).toHaveBeenCalledTimes(1);
    });

    it('returns 503 when MONGODB_URI is missing', async () => {
      delete process.env.MONGODB_URI;
      const response = await registerPOST(createRequest({ name: 'User', email: 'user@example.com', password: 'test123' }) as any);
      const body = await getResponseBody(response);

      expect(response.status).toBe(503);
      expect(body.error.code).toBe('MISSING_DB_CONFIG');
      expect(mockDbConnect).not.toHaveBeenCalled();
    });

    it('returns 409 when user already exists', async () => {
      const req = createRequest({ name: 'User', email: 'test@example.com', password: 'pass' });

      mockDbConnect.mockResolvedValue(undefined);
      mockUserFindOne.mockResolvedValue({ _id: 'existing' });

      const response = await registerPOST(req as any);
      const body = await getResponseBody(response);

      expect(response.status).toBe(409);
      expect(body.success).toBe(false);
      expect(body.error.message).toBe('User already exists');
      expect(mockUserCreate).not.toHaveBeenCalled();
    });

    it('returns 500 when create throws', async () => {
      const req = createRequest({ name: 'User', email: 'test@example.com', password: 'pass' });

      mockDbConnect.mockResolvedValue(undefined);
      mockUserFindOne.mockResolvedValue(null);
      mockBcryptHash.mockResolvedValue('hashed');
      mockUserCreate.mockRejectedValue(new Error('DB error'));

      const response = await registerPOST(req as any);
      const body = await getResponseBody(response);

      expect(response.status).toBe(500);
      expect(body.error.code).toBe('SERVER_ERROR');
      expect(body.error.message).toMatch(/db error/i);
    });

    it('returns 500 when dbConnect fails', async () => {
      const req = createRequest({ name: 'User', email: 'test@example.com', password: 'pass' });
      mockDbConnect.mockRejectedValue(new Error('Connection error'));

      const response = await registerPOST(req as any);
      const body = await getResponseBody(response);

      expect(response.status).toBe(500);
      expect(body.error.code).toBe('SERVER_ERROR');
      expect(body.error.message).toMatch(/connection error/i);
    });

    it.each([
      ['body is undefined', undefined],
      ['body is not an object', 'string-body'],
      ['missing email', { name: 'User', password: 'pass' }],
      ['missing name', { email: 'user@example.com', password: 'pass' }],
      ['missing password', { name: 'User', email: 'user@example.com' }],
      ['empty name', { name: ' ', email: 'user@example.com', password: 'pass' }],
      ['empty email', { name: 'User', email: ' ', password: 'pass' }],
      ['empty password', { name: 'User', email: 'user@example.com', password: ' ' }],
    ])('returns 400 when %s', async (_label, payload) => {
      const req = createRequest(payload);

      const response = await registerPOST(req as any);
      const body = await getResponseBody(response);

      expect(response.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('INVALID_INPUT');
    });

    it('returns 400 when request.json throws', async () => {
      const req = {
        json: jest.fn().mockRejectedValue(new Error('bad json')),
      };

      const response = await registerPOST(req as any);
      const body = await getResponseBody(response);

      expect(response.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('INVALID_INPUT');
    });
  });
});

describe('GET /api/auth/test', () => {
  afterEach(() => {
    mockAuth.mockReset();
    delete process.env.EDGE_RUNTIME;
  });

  it('returns session diagnostics when authenticated', async () => {
    mockAuth.mockResolvedValue({
      user: { id: '123', email: 'test@example.com', role: 'user', name: 'Test User' },
    });

    await testApiHandler({
      handler: authGET,
      test: async ({ fetch }) => {
        const res = await fetch();
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.tests.jwtVerification.passed).toBe(true);
        expect(json.tests.jwtVerification.details.isAuthenticated).toBe(true);
        expect(json.user.email).toBe('test@example.com');
        expect(json.tests.sessionStrategy.passed).toBe(true);
      },
    });
  });

  it('handles unauthenticated sessions', async () => {
    mockAuth.mockResolvedValue(null);

    await testApiHandler({
      handler: authGET,
      test: async ({ fetch }) => {
        const res = await fetch();
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.tests.jwtVerification.details.isAuthenticated).toBe(false);
        expect(json.tests.jwtVerification.details.user).toBeNull();
      },
    });
  });

  it('propagates auth errors', async () => {
    mockAuth.mockRejectedValue(new Error('JWT error'));

    await testApiHandler({
      handler: authGET,
      test: async ({ fetch }) => {
        const res = await fetch();
        expect(res.status).toBe(500);
        const json = await res.json();
        expect(json.error).toBe('Auth.js test failed');
        expect(json.message).toBe('JWT error');
      },
    });
  });

  it('reports edge runtime when flag is set', async () => {
    process.env.EDGE_RUNTIME = '1';
    mockAuth.mockResolvedValue({
      user: { id: '123', email: 'test@example.com', role: 'user', name: 'Test User' },
    });

    await testApiHandler({
      handler: authGET,
      test: async ({ fetch }) => {
        const res = await fetch();
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.tests.edgeRuntime.passed).toBe(true);
        expect(json.runtime).toBe('edge');
      },
    });
  });
});
