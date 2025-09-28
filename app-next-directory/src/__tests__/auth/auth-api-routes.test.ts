// @ts-nocheck
/**
 * Jest Test Suite for Next Auth API Routes
 * 
 * Tests covering:
 * 1. Registration API route (/api/auth/register)
 * 2. Next Auth route handler (/api/auth/[...nextauth])
 * 3. Rate limiting on API routes
 * 4. Input validation and error handling
 * 5. Email verification flow
 */

import { jest } from '@jest/globals';
import type { NextRequest } from 'next/server';
import User from '@/models/User';
import EmailVerificationToken from '@/models/EmailVerificationToken';

const mockDbConnect = jest.fn();
const mockGenerateToken = jest.fn();
const mockHashToken = jest.fn();
const mockMinutesFromNow = jest.fn();
const mockBuildVerifyEmail = jest.fn();
const mockSendMail = jest.fn();
const mockGetClientIp = jest.fn();
const mockIsRateLimited = jest.fn();
const mockGetRetryAfterMs = jest.fn();
const mockIsEmailVerificationRequired = jest.fn();
const mockGetRequestContext = jest.fn();

const mockStructuredLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  emailError: jest.fn(),
  child: jest.fn(),
};

jest.unstable_mockModule('@/lib/dbConnect', () => ({
  default: mockDbConnect,
}));

jest.unstable_mockModule('@/lib/tokens', () => ({
  generateToken: mockGenerateToken,
  hashToken: mockHashToken,
  minutesFromNow: mockMinutesFromNow,
}));

jest.unstable_mockModule('@/lib/email', () => ({
  buildVerifyEmail: mockBuildVerifyEmail,
  sendMail: mockSendMail,
}));

jest.unstable_mockModule('@/lib/rate-limit', () => ({
  getClientIp: mockGetClientIp,
  isRateLimited: mockIsRateLimited,
  getRetryAfterMs: mockGetRetryAfterMs,
}));

jest.unstable_mockModule('@/lib/logger', () => ({
  structuredLogger: mockStructuredLogger,
  getRequestContext: mockGetRequestContext,
}));

jest.unstable_mockModule('@/lib/auth/config', () => ({
  isEmailVerificationRequired: mockIsEmailVerificationRequired,
}));

let registerPost: typeof import('@/app/api/auth/register/route').POST;

let mockUserFindOne: jest.SpyInstance<any, any>;
let mockUserCreate: jest.SpyInstance<any, any>;
let mockEmailVerificationTokenCreate: jest.SpyInstance<any, any>;
// NOTE: Avoid spying on non-getter value exports like `logger`; use structuredLogger mocks instead.

const validRegistrationData = {
  name: 'John Doe',
  email: 'john@example.com',
  password: 'password123',
};

function createMockRequest(data: any, options?: { jsonImpl?: jest.Mock }) {
  const headerMap = new Map([
    ['content-type', 'application/json'],
    ['user-agent', 'jest'],
  ]);

  const headers = {
    get: jest.fn((key: string) => headerMap.get(key.toLowerCase()) ?? null),
  };

  const json = options?.jsonImpl ?? jest.fn().mockResolvedValue(data);

  return {
    json,
    headers,
  } as unknown as NextRequest;
};

beforeAll(async () => {
  await import('@/lib/dbConnect');
  const tokensModule = await import('@/lib/tokens');
  const emailModule = await import('@/lib/email');
  const rateLimitModule = await import('@/lib/rate-limit');
  const loggerModule = await import('@/lib/logger');
  const authConfigModule = await import('@/lib/auth/config');
  console.log('mock matches',
    tokensModule.generateToken === mockGenerateToken,
    emailModule.buildVerifyEmail === mockBuildVerifyEmail,
    rateLimitModule.isRateLimited === mockIsRateLimited,
    loggerModule.getRequestContext === mockGetRequestContext,
    authConfigModule.isEmailVerificationRequired === mockIsEmailVerificationRequired,
  );
  ({ POST: registerPost } = await import('@/app/api/auth/register/route'));
});

describe('Authentication API Routes', () => {
  beforeEach(() => {
    mockDbConnect.mockReset();
    mockGenerateToken.mockReset();
    mockHashToken.mockReset();
    mockMinutesFromNow.mockReset();
    mockBuildVerifyEmail.mockReset();
    mockSendMail.mockReset();
    mockGetClientIp.mockReset();
    mockIsRateLimited.mockReset();
    mockGetRetryAfterMs.mockReset();
    mockIsEmailVerificationRequired.mockReset();
    mockGetRequestContext.mockReset();

    mockStructuredLogger.info.mockReset();
    mockStructuredLogger.warn.mockReset();
    mockStructuredLogger.error.mockReset();
    mockStructuredLogger.debug.mockReset();
    mockStructuredLogger.emailError.mockReset();
    mockStructuredLogger.child.mockReset();
    mockStructuredLogger.child.mockReturnValue(mockStructuredLogger as any);

    mockDbConnect.mockResolvedValue(undefined);
    mockGetClientIp.mockReturnValue('127.0.0.1');
    mockIsRateLimited.mockReturnValue(false);
    mockGetRetryAfterMs.mockReturnValue(60_000);
    mockIsEmailVerificationRequired.mockReturnValue(false);
    mockGenerateToken.mockReturnValue({ raw: 'test-token-raw', hash: 'test-token-hash' });
    mockMinutesFromNow.mockReturnValue(new Date(Date.now() + 60 * 60 * 1000));
    mockBuildVerifyEmail.mockResolvedValue({
      to: 'test@example.com',
      subject: 'Verify your email',
      html: '<p>Test email</p>',
      text: 'Test email',
    });
    mockSendMail.mockResolvedValue({ messageId: 'test-message-id' });
    mockGetRequestContext.mockReturnValue({
      ip: '127.0.0.1',
      method: 'POST',
      url: '/api/auth/register',
      userAgent: 'jest',
    });

    mockUserFindOne = jest.spyOn(User, 'findOne').mockImplementation();
    mockUserCreate = jest.spyOn(User, 'create').mockImplementation();
    mockEmailVerificationTokenCreate = jest.spyOn(EmailVerificationToken, 'create').mockImplementation();
  });

  const originalMongoUri = process.env.MONGODB_URI;

  beforeEach(() => {
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
  });

  afterEach(() => {
    jest.restoreAllMocks();
    if (originalMongoUri === undefined) {
      delete process.env.MONGODB_URI;
    } else {
      process.env.MONGODB_URI = originalMongoUri;
    }
  });

  describe('Registration API Route (/api/auth/register)', () => {
    describe('Successful Registration', () => {
      it('should successfully register a new user without email verification', async () => {
        const mockUser = {
          _id: 'user123',
          name: 'John Doe',
          email: 'john@example.com',
        };

        // Mock successful flow
        const mockQuery = {
          select: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue(null), // User doesn't exist
        };
        mockUserFindOne.mockReturnValue(mockQuery as any);
        mockUserCreate.mockResolvedValue(mockUser as any);
        mockIsEmailVerificationRequired.mockReturnValue(false);

        const request = createMockRequest(validRegistrationData);
        const response = await registerPost(request);
        const responseData = await response.json();

        expect(response.status).toBe(200);
        expect(responseData.success).toBe(true);
        expect(responseData.emailVerificationRequired).toBe(false);
        expect(mockUserCreate).toHaveBeenCalledWith({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password123',
          emailVerified: expect.any(Date),
        });
      });

      it('should successfully register a new user with email verification', async () => {
        const mockUser = {
          _id: 'user123',
          name: 'John Doe',
          email: 'john@example.com',
        };

        // Mock email verification required
        mockIsEmailVerificationRequired.mockReturnValue(true);
        
        const mockQuery = {
          select: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue(null),
        };
        mockUserFindOne.mockReturnValue(mockQuery as any);
        mockUserCreate.mockResolvedValue(mockUser as any);
        
        // Mock token generation
        mockGenerateToken.mockReturnValue({ raw: 'rawtoken', hash: 'hashedtoken' });
        mockMinutesFromNow.mockReturnValue(new Date(Date.now() + 24 * 60 * 60 * 1000));
        mockEmailVerificationTokenCreate.mockResolvedValue({} as any);
        
        // Mock email sending
        mockBuildVerifyEmail.mockResolvedValue({
          to: 'john@example.com',
          subject: 'Verify your email',
          html: '<p>Verify</p>',
        });
        mockSendMail.mockResolvedValue(undefined);

        const request = createMockRequest(validRegistrationData);
        const response = await registerPost(request);
        const responseData = await response.json();

        expect(response.status).toBe(200);
        expect(responseData.success).toBe(true);
        expect(responseData.emailVerificationRequired).toBe(true);
        expect(mockUserCreate).toHaveBeenCalledWith({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password123',
          emailVerified: null,
        });
        expect(mockEmailVerificationTokenCreate).toHaveBeenCalled();
        expect(mockSendMail).toHaveBeenCalled();
      });

      it('should handle email normalization during registration', async () => {
        const mockUser = {
          _id: 'user123',
          name: 'John Doe',
          email: 'john@example.com',
        };

        const mockQuery = {
          select: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue(null),
        };
        mockUserFindOne.mockReturnValue(mockQuery as any);
        mockUserCreate.mockResolvedValue(mockUser as any);

        const dataWithMixedCaseEmail = {
          ...validRegistrationData,
          email: 'JOHN@EXAMPLE.COM   ', // Mixed case with spaces
        };

        const request = createMockRequest(dataWithMixedCaseEmail);
        const response = await registerPost(request);
        const responseData = await response.json();

        expect(response.status).toBe(200);
        expect(responseData.success).toBe(true);

        expect(mockUserFindOne).toHaveBeenCalledWith({ email: 'john@example.com' });
        expect(mockUserCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            email: 'john@example.com',
          })
        );
      });
    });

    describe('Registration Validation', () => {
      it('should reject registration with invalid email', async () => {
        const invalidData = {
          ...validRegistrationData,
          email: 'invalid-email',
        };

        const request = createMockRequest(invalidData);
        const response = await registerPost(request);
        const responseData = await response.json();

        expect(response.status).toBe(400);
        expect(responseData.error).toBeDefined();
      });

      it('should reject registration with weak password', async () => {
        const invalidData = {
          ...validRegistrationData,
          password: '123', // Too short
        };

        const request = createMockRequest(invalidData);
        const response = await registerPost(request);
        const responseData = await response.json();

        expect(response.status).toBe(400);
        expect(responseData.error).toBeDefined();
      });

      it('should reject registration for existing user', async () => {
        const existingUser = {
          _id: 'existing123',
          email: 'john@example.com',
        };

        const mockQuery = {
          select: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue(existingUser),
        };
        mockUserFindOne.mockReturnValue(mockQuery as any);

        const request = createMockRequest(validRegistrationData);
        const response = await registerPost(request);
        const responseData = await response.json();

        expect(response.status).toBe(409);
        expect(responseData.error).toBe('Email already in use');
      });

      it('should handle database duplicate key error', async () => {
        const mockQuery = {
          select: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue(null),
        };
        mockUserFindOne.mockReturnValue(mockQuery as any);
        
        const duplicateKeyError = new Error('Duplicate key');
        (duplicateKeyError as any).code = 11000;
        mockUserCreate.mockRejectedValue(duplicateKeyError);

        const request = createMockRequest(validRegistrationData);
        const response = await registerPost(request);
        const responseData = await response.json();

        expect(response.status).toBe(409);
        expect(responseData.error).toBe('Email already in use');
      });
    });

    describe('Rate Limiting', () => {
      it('should enforce rate limiting on registration attempts', async () => {
        mockIsRateLimited.mockReturnValue(true);
        mockGetRetryAfterMs.mockReturnValue(30000); // 30 seconds

        const request = createMockRequest(validRegistrationData);
        const response = await registerPost(request);
        const responseData = await response.json();

        expect(response.status).toBe(429);
        expect(responseData.error).toBe('Too many requests');
        expect(response.headers.get('Retry-After')).toBe('30');
      });

      it('should allow registration when under rate limit', async () => {
        const mockUser = {
          _id: 'user123',
          name: 'John Doe',
          email: 'john@example.com',
        };

        mockIsRateLimited.mockReturnValue(false);
        const mockQuery = {
          select: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue(null),
        };
        mockUserFindOne.mockReturnValue(mockQuery as any);
        mockUserCreate.mockResolvedValue(mockUser as any);

        const request = createMockRequest(validRegistrationData);
        const response = await registerPost(request);

        expect(response.status).toBe(200);
        expect(mockIsRateLimited).toHaveBeenCalledWith('auth:register:127.0.0.1', 5, 60);
      });
    });

    describe('Error Handling', () => {
      it('should handle missing MongoDB URI', async () => {
        delete process.env.MONGODB_URI;

        const request = createMockRequest(validRegistrationData);
        const response = await registerPost(request);
        const responseData = await response.json();

        expect(response.status).toBe(500);
        expect(responseData.error).toBe('Server not configured (db)');
      });

      it('should handle database connection errors', async () => {
        mockDbConnect.mockRejectedValue(new Error('Database connection failed'));

        const request = createMockRequest(validRegistrationData);
        const response = await registerPost(request);
        const responseData = await response.json();

        expect(response.status).toBe(400);
        expect(responseData.error).toBeDefined();
      });

      it('should handle email sending failures gracefully', async () => {
        const mockUser = {
          _id: 'user123',
          name: 'John Doe',
          email: 'john@example.com',
        };

        mockIsEmailVerificationRequired.mockReturnValue(true);
        
        const mockQuery = {
          select: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue(null),
        };
        mockUserFindOne.mockReturnValue(mockQuery as any);
        mockUserCreate.mockResolvedValue(mockUser as any);
        
        mockGenerateToken.mockReturnValue({ raw: 'rawtoken', hash: 'hashedtoken' });
        mockMinutesFromNow.mockReturnValue(new Date(Date.now() + 24 * 60 * 60 * 1000));
        mockEmailVerificationTokenCreate.mockResolvedValue({} as any);
        
        // Mock email sending failure
        mockBuildVerifyEmail.mockResolvedValue({
          to: 'john@example.com',
          subject: 'Verify your email',
          html: '<p>Verify</p>',
        });
        mockSendMail.mockRejectedValue(new Error('Email service unavailable'));

        const request = createMockRequest(validRegistrationData);
        const response = await registerPost(request);
        const responseData = await response.json();

        // Should still succeed even if email fails
        expect(response.status).toBe(200);
        expect(responseData.success).toBe(true);
        expect(responseData.emailVerificationRequired).toBe(true);
      });
    });

    describe('Input Validation Edge Cases', () => {
      it('should handle missing required fields', async () => {
        const incompleteData = {
          name: 'John Doe',
          // missing email and password
        };

        const request = createMockRequest(incompleteData);
        const response = await registerPost(request);
        const responseData = await response.json();

        expect(response.status).toBe(400);
        expect(responseData.error).toBeDefined();
      });

      it('should handle excessively long inputs', async () => {
        const longNameData = {
          name: 'A'.repeat(200), // Very long name
          email: 'john@example.com',
          password: 'password123',
        };

        const request = createMockRequest(longNameData);
        const response = await registerPost(request);
        const responseData = await response.json();

        expect(response.status).toBe(400);
        expect(responseData.error).toBeDefined();
      });

      it('should handle empty strings', async () => {
        const emptyData = {
          name: '',
          email: 'john@example.com',
          password: 'password123',
        };

        const request = createMockRequest(emptyData);
        const response = await registerPost(request);
        const responseData = await response.json();

        expect(response.status).toBe(400);
        expect(responseData.error).toBeDefined();
      });

      it('should handle malformed JSON', async () => {
        const jsonImpl = jest.fn().mockRejectedValue(new Error('Invalid JSON'));
        const request = createMockRequest(validRegistrationData, { jsonImpl });

        const response = await registerPost(request);
        const responseData = await response.json();

        expect(response.status).toBe(400);
        expect(responseData.error).toBeDefined();
      });
    });
  });

  describe('Client IP Detection', () => {
    it('should correctly extract client IP for rate limiting', async () => {
      const mockUser = {
        _id: 'user123',
        name: 'John Doe',
        email: 'john@example.com',
      };

      mockGetClientIp.mockReturnValue('192.168.1.100');
      
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(null),
      };
      mockUserFindOne.mockReturnValue(mockQuery as any);
      mockUserCreate.mockResolvedValue(mockUser as any);

      const request = createMockRequest(validRegistrationData);
      await registerPost(request);

      expect(mockGetClientIp).toHaveBeenCalledWith(request);
      expect(mockIsRateLimited).toHaveBeenCalledWith('auth:register:192.168.1.100', 5, 60);
    });

    it('should handle missing IP address', async () => {
      const mockUser = {
        _id: 'user123',
        name: 'John Doe',
        email: 'john@example.com',
      };

      mockGetClientIp.mockReturnValue('');
      
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(null),
      };
      mockUserFindOne.mockReturnValue(mockQuery as any);
      mockUserCreate.mockResolvedValue(mockUser as any);

      const request = createMockRequest(validRegistrationData);
      const response = await registerPost(request);

      expect(response.status).toBe(200);
      // Should still work even with empty IP
    });
  });

  describe('Email Verification Flow Integration', () => {
    it('should create verification token when email verification is required', async () => {
      const mockUser = {
        _id: 'user123',
        name: 'John Doe',
        email: 'john@example.com',
      };

      mockIsEmailVerificationRequired.mockReturnValue(true);
      
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(null),
      };
      mockUserFindOne.mockReturnValue(mockQuery as any);
      mockUserCreate.mockResolvedValue(mockUser as any);
      
      const mockToken = { raw: 'verification-token', hash: 'hashed-token' };
      const mockExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
      
      mockGenerateToken.mockReturnValue(mockToken);
      mockMinutesFromNow.mockReturnValue(mockExpiry);
      mockEmailVerificationTokenCreate.mockResolvedValue({} as any);
      
      mockBuildVerifyEmail.mockResolvedValue({
        to: 'john@example.com',
        subject: 'Verify your email',
        html: '<p>Click to verify</p>',
      });
      mockSendMail.mockResolvedValue(undefined);

      const request = createMockRequest(validRegistrationData);
      const response = await registerPost(request);
      const responseData = await response.json();

      expect(responseData.emailVerificationRequired).toBe(true);
      expect(mockGenerateToken).toHaveBeenCalled();
      expect(mockEmailVerificationTokenCreate).toHaveBeenCalledWith({
        userId: 'user123',
        tokenHash: 'hashed-token',
        expiresAt: mockExpiry,
      });
      expect(mockBuildVerifyEmail).toHaveBeenCalledWith('john@example.com', 'verification-token');
      expect(mockSendMail).toHaveBeenCalled();
    });

    it('should skip verification token when email verification is not required', async () => {
      const mockUser = {
        _id: 'user123',
        name: 'John Doe',
        email: 'john@example.com',
      };

      mockIsEmailVerificationRequired.mockReturnValue(false);
      
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(null),
      };
      mockUserFindOne.mockReturnValue(mockQuery as any);
      mockUserCreate.mockResolvedValue(mockUser as any);

      const request = createMockRequest(validRegistrationData);
      const response = await registerPost(request);
      const responseData = await response.json();

      expect(responseData.emailVerificationRequired).toBe(false);
      expect(mockGenerateToken).not.toHaveBeenCalled();
      expect(mockEmailVerificationTokenCreate).not.toHaveBeenCalled();
      expect(mockSendMail).not.toHaveBeenCalled();
    });
  });
})
