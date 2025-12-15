import { NextRequest } from 'next/server';
import type { Session } from 'next-auth';
import { structuredLogger } from '@/lib/logger';

jest.mock('@/lib/logger');

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

import bcrypt from 'bcryptjs';
import { auth } from '@/lib/auth';
import connect from '@/lib/dbConnect';
import User from '@/models/User';
import { GET as authGET } from '../test/route';
import { POST as registerPOST } from './route';

const mockConnect = connect as jest.MockedFunction<typeof connect>;
const mockUserFindOne = User.findOne as jest.MockedFunction<typeof User.findOne>;
const mockUserCreate = User.create as jest.MockedFunction<typeof User.create>;
const mockBcryptHash = bcrypt.hash as jest.MockedFunction<
  (data: string | Buffer, saltOrRounds: string | number) => Promise<string>
>;
const mockAuth = auth as jest.MockedFunction<() => Promise<Session | null>>;

/**
 * Helper to extract response body from API route handler result
 */
async function getResponseBody(response: Response) {
  if (typeof response.json === 'function') {
    return await response.json();
  }
  return response;
}

describe('Registration API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConnect.mockReset();
    mockUserFindOne.mockReset();
    mockUserCreate.mockReset();
    mockBcryptHash.mockReset();
    mockConnect.mockResolvedValue(undefined);
    mockUserFindOne.mockResolvedValue(null);
    mockBcryptHash.mockResolvedValue('hashedpassword');
    mockUserCreate.mockResolvedValue({
      _id: 'new-id',
      name: 'Test User',
      email: 'test@example.com',
      role: 'user',
    } as ReturnType<typeof User.create>);
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
      } as Partial<NextRequest> as NextRequest;

      mockConnect.mockResolvedValue(undefined);
      mockUserFindOne.mockResolvedValue(null);
      mockBcryptHash.mockResolvedValue('hashedpassword');
      mockUserCreate.mockResolvedValue({
        _id: 'someid',
        name: 'Test User',
        email: 'test@example.com',
        role: 'user',
      } as ReturnType<typeof User.create>);

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
      } as Partial<NextRequest> as NextRequest;

      mockConnect.mockResolvedValue(undefined);
      mockUserFindOne.mockResolvedValue({ email: 'test@example.com' } as ReturnType<typeof User.findOne>);

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
      } as Partial<NextRequest> as NextRequest;

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
      } as Partial<NextRequest> as NextRequest;

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

    test('should return 400 if the body cannot be parsed', async () => {
      const req = {
        json: jest.fn().mockRejectedValue(new Error('invalid json')),
      } as Partial<NextRequest> as NextRequest;

      const response = await registerPOST(req);
      const body = await getResponseBody(response);

      expect(response.status).toBe(400);
      expect(body.error.code).toBe('INVALID_INPUT');
      expect(structuredLogger.warn).toHaveBeenCalledWith(
        '[register] Failed to parse request body',
        {
          component: 'auth',
          error: 'invalid json',
        }
      );
    });

    test('should return 503 when database configuration is missing', async () => {
      delete process.env.MONGODB_URI;

      const req = {
        json: jest.fn().mockResolvedValue({
          name: 'Tester',
          email: 'tester@example.com',
          password: 'password123',
        }),
      } as Partial<NextRequest> as NextRequest;

      const response = await registerPOST(req);
      const body = await getResponseBody(response);

      expect(response.status).toBe(503);
      expect(body.error.code).toBe('MISSING_DB_CONFIG');
      expect(body.success).toBe(false);
    });

    test('should return 400 if request body is missing', async () => {
      // Arrange
      const req = {
        json: jest.fn().mockResolvedValue(undefined),
      } as Partial<NextRequest> as NextRequest;

      // Act
      const response = await registerPOST(req);
      const body = await getResponseBody(response);

      // Assert
      expect(response.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.error.message).toMatch(/Invalid request body/i);
      expect(body.error.code).toBe('INVALID_INPUT');
    });

    test('uses document toObject method when available', async () => {
      const reqBody = {
        name: 'To Object User',
        email: 'toobject@example.com',
        password: 'password123',
      };
      const req = {
        json: jest.fn().mockResolvedValue(reqBody),
      } as Partial<NextRequest> as NextRequest;

      const doc = {
        toObject: jest.fn().mockReturnValue({
          _id: 'obj-id',
          name: 'To Object User',
          email: 'toobject@example.com',
          role: 'user',
        }),
      };

      mockUserFindOne.mockResolvedValue(null);
      mockBcryptHash.mockResolvedValue('hashed');
      mockUserCreate.mockResolvedValue(doc as ReturnType<typeof User.create>);

      const response = await registerPOST(req);
      const body = await getResponseBody(response);

      expect(doc.toObject).toHaveBeenCalled();
      expect(body.data?.user).toMatchObject({ _id: 'obj-id', name: 'To Object User' });
    });

    test('falls back to provided values when created document lacks fields', async () => {
      const reqBody = {
        name: 'Fallback User',
        email: 'fallback@example.com',
        password: 'password123',
      };
      const req = {
        json: jest.fn().mockResolvedValue(reqBody),
      } as Partial<NextRequest> as NextRequest;

      mockUserFindOne.mockResolvedValue(null);
      mockBcryptHash.mockResolvedValue('hashed');
      mockUserCreate.mockResolvedValue({ _id: 'created-id' } as ReturnType<typeof User.create>);

      const response = await registerPOST(req);
      const body = await getResponseBody(response);

      expect(body.data?.user).toMatchObject({
        _id: 'created-id',
        name: 'Fallback User',
        email: 'fallback@example.com',
        role: 'user',
      });
    });

    test('should return 400 if email is missing', async () => {
      // Arrange
      const reqBody = {
        name: 'Test User',
        password: 'password123',
      };
      const req = {
        json: jest.fn().mockResolvedValue(reqBody),
      } as Partial<NextRequest> as NextRequest;

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
      } as Partial<NextRequest> as NextRequest;

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
      } as Partial<NextRequest> as NextRequest;

      // Act
      const response = await registerPOST(req);
      const body = await getResponseBody(response);

      // Assert
      expect(response.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.error.message).toMatch(/Invalid request body/i);
      expect(body.error.code).toBe('INVALID_INPUT');
    });

    test('rejects non-object request bodies', async () => {
      const req = {
        json: jest.fn().mockResolvedValue('not-an-object'),
      } as Partial<NextRequest> as NextRequest;

      const response = await registerPOST(req);
      const body = await getResponseBody(response);

      expect(response.status).toBe(400);
      expect(body.error.code).toBe('INVALID_INPUT');
      expect(mockUserFindOne).not.toHaveBeenCalled();
    });

    test('rejects whitespace-only fields', async () => {
      const req = {
        json: jest.fn().mockResolvedValue({ name: '   ', email: '   ', password: '   ' }),
      } as Partial<NextRequest> as NextRequest;

      const response = await registerPOST(req);
      const body = await getResponseBody(response);

      expect(response.status).toBe(400);
      expect(body.error.code).toBe('INVALID_INPUT');
      expect(mockUserFindOne).not.toHaveBeenCalled();
      expect(mockBcryptHash).not.toHaveBeenCalled();
    });

    test('returns 500 when password hashing fails', async () => {
      const reqBody = {
        name: 'Hash Failure',
        email: 'hash@example.com',
        password: 'password123',
      };
      const req = {
        json: jest.fn().mockResolvedValue(reqBody),
      } as Partial<NextRequest> as NextRequest;

      mockUserFindOne.mockResolvedValue(null);
      mockBcryptHash.mockRejectedValue(new Error('hash failed'));

      const response = await registerPOST(req);
      const body = await getResponseBody(response);

      expect(response.status).toBe(500);
      expect(body.error.code).toBe('SERVER_ERROR');
      expect(body.error.message).toMatch(/hash failed/i);
      expect(mockUserCreate).not.toHaveBeenCalled();
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
        },
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
        },
      });

      const response = await authGET(new NextRequest('http://localhost/api/auth/test'));
      const body = await getResponseBody(response);

      expect(body.tests.edgeRuntime.passed).toBe(true);
      expect(body.runtime).toBe('edge');
    });
  });
});
