import { NextRequest } from 'next/server';

// Mock stable dependencies at the top level
jest.mock('next/server', () => ({
  __esModule: true,
  NextResponse: {
    json: jest.fn((body: any, init?: { status?: number }) => ({
      status: init?.status || 200,
      json: () => Promise.resolve(body),
    })),
  },
}));

// Mock dependencies first to avoid hoisting issues
jest.mock('@/lib/dbConnect');
jest.mock('@/models/User');
jest.mock('bcryptjs');
jest.mock('@/lib/auth');

import { testApiHandler } from 'next-test-api-route-handler';
import { POST as registerPOST } from './route';
import { GET as authGET } from '../test/route';
import connect from '@/lib/dbConnect';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { auth } from '@/lib/auth';

const mockConnect = connect as jest.MockedFunction<typeof connect>;
const mockUserFindOne = User.findOne as jest.MockedFunction<typeof User.findOne>;
const mockUserCreate = User.create as jest.MockedFunction<typeof User.create>;
const mockBcryptHash = bcrypt.hash as jest.MockedFunction<(data: string | Buffer, saltOrRounds: string | number) => Promise<string>>;
const mockAuth = auth as jest.MockedFunction<() => Promise<any>>;

/**
 * Helper to extract response body from API route handler result
 */
async function getResponseBody(response: any) {
  if (typeof response.json === 'function') {
    return await response.json();
  }
  return response.body || response;
}

describe('Registration API Routes', () => {
  // Reset modules before each test to ensure a clean state
  beforeEach(() => {
    jest.resetModules();
  });

  describe('POST /api/auth/register', () => {
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

      mockBcryptHash.mockResolvedValue('hashedpassword');
      mockUserCreate.mockResolvedValue({
        _id: 'someid',
        name: 'Test User',
        email: 'test@example.com',
        role: 'user',
      });

      // Act
      const response = await registerPOST(req);
      const body = await getResponseBody(response);

      // Assert
      expect(response.status).toBe(201);
      expect(body.success).toBe(true);
      expect(mockUserCountDocuments).toHaveBeenCalledWith({ email: 'test@example.com' });
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

      mockUserFindOne.mockResolvedValue({ email: 'test@example.com' });

      // Act
      const response = await registerPOST(req);
      const body = await getResponseBody(response);

      // Assert
      expect(response.status).toBe(409);
      expect(body.success).toBe(false);
      expect(body.error.message).toBe('User already exists');
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
      const response = await registerPOST(req);
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
      const response = await registerPOST(req);
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
      const response = await registerPOST(req);
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
      const response = await registerPOST(req);
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
      const response = await registerPOST(req);
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
      const response = await registerPOST(req);
      const body = await getResponseBody(response);

      // Assert
      expect(response.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.error.message).toMatch(/Invalid request body/i);
      expect(body.error.code).toBe('INVALID_INPUT');
      });
});

describe('GET /api/auth/test', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns 200 and correct test results when JWT is present', async () => {
    mockAuth.mockResolvedValue({
      user: {
        id: '123',
        email: 'test@example.com',
        role: 'user',
        name: 'Test User',
      }
    });

    await testApiHandler({
      handler: authGET,
      test: async ({ fetch }) => {
        const res = await fetch();
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.tests.jwtVerification.passed).toBe(true);
        expect(json.tests.jwtVerification.details.isAuthenticated).toBe(true);
        expect(json.tests.jwtVerification.details.user.email).toBe('test@example.com');
        expect(json.tests.sessionStrategy.passed).toBe(true);
      },
    });
  });

  it('returns 200 and isAuthenticated false if no JWT token', async () => {
    mockAuth.mockResolvedValue(null);

    await testApiHandler({
      handler: authGET,
      test: async ({ fetch }) => {
        const res = await fetch();
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.tests.jwtVerification.details.isAuthenticated).toBe(false);
        expect(json.tests.jwtVerification.details.user).toBeNull();
        expect(json.tests.sessionStrategy.passed).toBe(true);
      },
    });
  });

  it('returns 500 and error message if auth throws', async () => {
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

  it('detects edge runtime via process.env.edgeRuntime', async () => {
    process.env.EDGE_RUNTIME = '1';
    mockAuth.mockResolvedValue({
      user: {
        id: '123',
        email: 'test@example.com',
        role: 'user',
        name: 'Test User',
      }
    });

    await testApiHandler({
      handler: authGET,
      test: async ({ fetch }) => {
        const res = await fetch();
        const json = await res.json();
        expect(json.tests.edgeRuntime.passed).toBe(true);
        expect(json.runtime).toBe(process.env.EDGE_RUNTIME ? 'edge' : 'node');
      },
    });
  });
});