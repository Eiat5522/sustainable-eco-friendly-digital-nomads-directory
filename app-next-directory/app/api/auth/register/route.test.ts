import { NextRequest } from 'next/server';

// Mock dependencies first to avoid hoisting issues
jest.mock('@/lib/dbConnect', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('@/models/User', () => {
  const findOne = jest.fn();
  const create = jest.fn();
  return {
    __esModule: true,
    default: { findOne, create },
  };
});

jest.mock('bcryptjs', () => {
  const hash = jest.fn();
  return {
    __esModule: true,
    default: { hash },
    hash,
  };
});

jest.mock('@/lib/auth', () => ({
  __esModule: true,
  auth: jest.fn(),
}));

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
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.MONGODB_URI = 'mongodb://localhost/test-db';
    delete process.env.EDGE_RUNTIME;
  });

  afterEach(() => {
    delete process.env.MONGODB_URI;
    delete process.env.EDGE_RUNTIME;
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
      mockUserFindOne.mockResolvedValue(null);
      mockBcryptHash.mockResolvedValue('hashedpassword');
      mockUserCreate.mockResolvedValue({
        _id: 'someid',
        name: 'Test User',
        email: 'test@example.com',
        role: 'user',
      } as any);

      // Act
      const response = await registerPOST(req);
      const body = await getResponseBody(response);

      // Assert
      expect(response.status).toBe(201);
      expect(body.success).toBe(true);
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
  mockUserFindOne.mockResolvedValue({ email: 'test@example.com' } as any);

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
      jest.clearAllMocks();
    });

    test('returns 200 and correct test results when JWT is present', async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: '123',
          email: 'test@example.com',
          role: 'user',
          name: 'Test User',
        }
      });

      const response = await authGET(new NextRequest('http://localhost/api/auth/test'));
      const body = await getResponseBody(response);

      expect(response.status).toBe(200);
      expect(body.tests.jwtVerification.passed).toBe(true);
      expect(body.tests.jwtVerification.details.isAuthenticated).toBe(true);
      expect(body.tests.jwtVerification.details.user.email).toBe('test@example.com');
      expect(body.tests.sessionStrategy.passed).toBe(true);
    });

    test('returns 200 and isAuthenticated false if no JWT token', async () => {
      mockAuth.mockResolvedValue(null);

      const response = await authGET(new NextRequest('http://localhost/api/auth/test'));
      const body = await getResponseBody(response);

      expect(response.status).toBe(200);
      expect(body.tests.jwtVerification.details.isAuthenticated).toBe(false);
      expect(body.tests.jwtVerification.details.user).toBeNull();
      expect(body.tests.sessionStrategy.passed).toBe(true);
    });

    test('returns 500 and error message if auth throws', async () => {
      mockAuth.mockRejectedValue(new Error('JWT error'));

      const response = await authGET(new NextRequest('http://localhost/api/auth/test'));
      const body = await getResponseBody(response);

      expect(response.status).toBe(500);
      expect(body.error).toBe('Auth.js test failed');
      expect(body.message).toBe('JWT error');
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

      const response = await authGET(new NextRequest('http://localhost/api/auth/test'));
      const body = await getResponseBody(response);

      expect(body.tests.edgeRuntime.passed).toBe(true);
      expect(body.runtime).toBe('edge');
    });
  });
});