// Mock global Request and NextResponse for Jest
(global as any).Request = class {};
(global as any).NextResponse = {
  json: jest.fn((data, init) => ({ data, ...init })),
};
import { POST } from './route';
import connect from '@/lib/dbConnect';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { GET } from '../test/route';
import { getToken } from 'next-auth/jwt';

// Mock NextResponse from next/server to return a Response-like object with .json()
jest.mock('next/server', () => {
  return {
    NextResponse: {
      json: (body: any, init?: any) => {
        // Mimic a Response object with .json() and .status
        return {
          ...init,
          status: init?.status ?? 200,
          json: async () => body,
        };
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
  if (typeof response.json === 'function') {
    return await response.json();
  }
  // NextResponse returns body as ._getJSON() or ._body, fallback to .body or itself
  if (typeof response._getJSON === 'function') {
    return await response._getJSON();
  }
  if (response._body) return response._body;
  if (response.body) return response.body;
  return response;
}

describe('POST /api/auth/register', () => {
  let nextResponseJsonSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should register a user successfully', async () => {
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

  it('should return 409 if user already exists', async () => {
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

  it('should return 400 for invalid request body', async () => {
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

  it('should return 500 if hashing password fails', async () => {
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

  it('should return 500 if User.create throws', async () => {
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

  it('should return 500 if dbConnect throws', async () => {
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

  it('should return 400 if request body is missing', async () => {
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

  it('should return 400 if email is missing', async () => {
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

  it('should return 400 if name is missing', async () => {
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

  it('should return 400 if password is missing', async () => {
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
// 1. Mock next-auth/jwt's getToken to simulate JWT verification.
// 2. Mock process.env.NEXTAUTH_SECRET and process.env.EDGE_RUNTIME as needed.
// 3. Call the GET function with a mock NextRequest.
// 4. Assert the returned Response status and JSON body for both success and error cases.
// 5. Test: 
//    - Successful JWT verification (token present)
//    - JWT verification fails (token missing)
//    - Edge runtime detection
//    - Security headers present
//    - Error handling (getToken throws)


jest.mock('next-auth/jwt', () => ({
  getToken: jest.fn(),
}));

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
    (getToken as jest.Mock).mockResolvedValue({
      sub: '123',
      email: 'test@example.com',
      role: 'user',
      name: 'Test User',
    });

    const response = await GET(mockRequest());
    expect(response.status).toBe(200);

    const json = JSON.parse(await response.text());
    expect(json.tests.jwtVerification.passed).toBe(true);
    expect(json.tests.jwtVerification.details.isAuthenticated).toBe(true);
    expect(json.tests.jwtVerification.details.user.email).toBe('test@example.com');
    expect(json.tests.sessionStrategy.passed).toBe(true);
    expect(json.tests.edgeRuntime.passed).toBe(true);
    expect(json.tests.securityHeaders.passed).toBe(true);
    expect(json.tests.authFlow.passed).toBe(true);
    expect(json.summary.allTestsPassed).toBe(true);

    // Security headers
    expect(response.headers.get('X-Frame-Options')).toBe('DENY');
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(response.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
  });

  it('returns 200 and isAuthenticated false if no JWT token', async () => {
    (getToken as jest.Mock).mockResolvedValue(null);

    const response = await GET(mockRequest());
    expect(response.status).toBe(200);

    const json = JSON.parse(await response.text());
    expect(json.tests.jwtVerification.details.isAuthenticated).toBe(false);
    expect(json.tests.jwtVerification.details.user).toBeNull();
    expect(json.tests.sessionStrategy.passed).toBe(true); // still true, as .sub is undefined
  });

  it('returns 500 and error message if getToken throws', async () => {
    (getToken as jest.Mock).mockRejectedValue(new Error('JWT error'));

    const response = await GET(mockRequest());
    expect(response.status).toBe(500);

    const json = JSON.parse(await response.text());
    expect(json.error).toBe('Auth.js test failed');
    expect(json.message).toBe('JWT error');
  });

  it('detects edge runtime via process.env.EDGE_RUNTIME', async () => {
    (getToken as jest.Mock).mockResolvedValue({
      sub: '123',
      email: 'test@example.com',
      role: 'user',
      name: 'Test User',
    });
    process.env.EDGE_RUNTIME = '1';

    const response = await GET(mockRequest());
    const json = JSON.parse(await response.text());
    expect(json.tests.edgeRuntime.passed).toBe(true);
    expect(json.runtime).toBe('edge');
  });

  it('sets all security headers in the response', async () => {
    (getToken as jest.Mock).mockResolvedValue({
      sub: '123',
      email: 'test@example.com',
      role: 'user',
      name: 'Test User',
    });

    const response = await GET(mockRequest());
    expect(response.headers.get('X-Frame-Options')).toBe('DENY');
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(response.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
  });


});
