/**
 * Tests for /api/auth/register and /api/auth/test endpoints
 */

// Mock global Response class for test environment
(global as any).Response = class MockResponse {
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
  
  async json() {
    return JSON.parse(this._body);
  }
  
  get ok() {
    return this.status >= 200 && this.status < 300;
  }
};

// Mock NextResponse to use our global Response
jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: any, init?: { status?: number; headers?: Record<string, string> }) => {
      return new (global as any).Response(JSON.stringify(body), init);
    },
  },
}));

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

jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));

import { POST } from './route';
import { GET } from '../test/route';
import connect from '@/lib/dbConnect';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { auth } from '@/lib/auth';

// Type the mocks properly
const mockConnect = connect as jest.Mock;
const mockUserFindOne = User.findOne as jest.Mock;
const mockUserCreate = User.create as jest.Mock;
const mockBcryptHash = bcrypt.hash as jest.Mock;
const mockAuth = auth as jest.Mock;

/**
 * Helper to extract response body from API route handler result
 */
async function getResponseBody(response: any) {
  if (typeof response.json === 'function') {
    return await response.json();
  }
  return response.body || response;
}

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

    mockConnect.mockResolvedValue(undefined);
    mockUserFindOne.mockResolvedValue(null);
    mockBcryptHash.mockResolvedValue('hashedpassword');
    mockUserCreate.mockResolvedValue({
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
    expect(mockConnect).toHaveBeenCalledTimes(1);
    expect(mockUserFindOne).toHaveBeenCalledWith({ email: 'test@example.com' });
    expect(mockUserCreate).toHaveBeenCalledTimes(1);
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

    mockConnect.mockResolvedValue(undefined);
    mockUserFindOne.mockResolvedValue({ email: 'test@example.com' });

    // Act
    const response = await POST(req);
    const body = await getResponseBody(response);

    // Assert
    expect(response.status).toBe(409);
    expect(body.success).toBe(false);
    expect(body.error.message).toBe('User already exists');
    expect(body.error.code).toBe('CONFLICT');
    expect(mockUserCreate).not.toHaveBeenCalled();
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

    mockConnect.mockResolvedValue(undefined);
    mockUserFindOne.mockResolvedValue(null);
    mockBcryptHash.mockRejectedValue(new Error('Hash error'));

    // Act
    const response = await POST(req);
    const body = await getResponseBody(response);

    // Assert
    expect(response.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error.message).toMatch(/hash error/i);
    expect(body.error.code).toBe('SERVER_ERROR');
    expect(mockUserCreate).not.toHaveBeenCalled();
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

    mockConnect.mockResolvedValue(undefined);
    mockUserFindOne.mockResolvedValue(null);
    mockBcryptHash.mockResolvedValue('hashedpassword');
    mockUserCreate.mockRejectedValue(new Error('DB error'));

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

    mockConnect.mockRejectedValue(new Error('Connection error'));

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

describe('GET /api/auth/test', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...OLD_ENV, NEXTAUTH_SECRET: 'testsecret' };
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  function mockRequest() {
    return {} as any;
  }

  test('returns 200 and correct test results when JWT is present', async () => {
    mockAuth.mockResolvedValue({
      user: {
        id: '123',
        email: 'test@example.com',
        role: 'user',
        name: 'Test User',
      }
    });

    const response = await GET(mockRequest());
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.tests.jwtVerification.passed).toBe(true);
    expect(json.tests.jwtVerification.details.isAuthenticated).toBe(true);
    expect(json.tests.jwtVerification.details.user.email).toBe('test@example.com');
    expect(json.tests.sessionStrategy.passed).toBe(true);
  });

  test('returns 200 and isAuthenticated false if no JWT token', async () => {
    mockAuth.mockResolvedValue(null);

    const response = await GET(mockRequest());
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.tests.jwtVerification.details.isAuthenticated).toBe(false);
    expect(json.tests.jwtVerification.details.user).toBeNull();
    expect(json.tests.sessionStrategy.passed).toBe(true);
  });

  test('returns 500 and error message if auth throws', async () => {
    mockAuth.mockRejectedValue(new Error('JWT error'));

    const response = await GET(mockRequest());
    expect(response.status).toBe(500);

    const json = await response.json();
    expect(json.error).toBe('Auth.js test failed');
    expect(json.message).toBe('JWT error');
  });

  test('detects edge runtime via process.env.EDGE_RUNTIME', async () => {
    process.env.EDGE_RUNTIME = '1';
    mockAuth.mockResolvedValue({
      user: {
        id: '123',
        email: 'test@example.com',
        role: 'user',
        name: 'Test User',
      }
    });

    const response = await GET(mockRequest());
    const json = await response.json();
    expect(json.tests.edgeRuntime.passed).toBe(true);
    expect(json.runtime).toBe('edge');
  });
});