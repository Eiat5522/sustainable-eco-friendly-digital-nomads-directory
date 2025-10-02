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

// Explicitly mock modules before importing them
jest.mock('@/lib/dbConnect');
jest.mock('@/lib/tokens');
jest.mock('@/lib/email');
jest.mock('@/lib/rate-limit');
jest.mock('@/lib/logger');
jest.mock('@/lib/auth/config');

// Import mocked modules - Jest will use the __mocks__ versions
import dbConnect from '@/lib/dbConnect';
import * as tokensModule from '@/lib/tokens';
import * as emailModule from '@/lib/email';
import * as rateLimitModule from '@/lib/rate-limit';
import * as loggerModule from '@/lib/logger';
import * as authConfigModule from '@/lib/auth/config';

// Import User and EmailVerificationToken models
import User from '@/models/User';
import EmailVerificationToken from '@/models/EmailVerificationToken';

// Import the route handler after mocks are set up
import { POST as registerPost } from '@/app/api/auth/register/route';

// Get the mocked functions with proper typing
const mockDbConnect = dbConnect as jest.MockedFunction<typeof dbConnect>;
const mockGenerateToken = tokensModule.generateToken as jest.MockedFunction<typeof tokensModule.generateToken>;
const mockHashToken = tokensModule.hashToken as jest.MockedFunction<typeof tokensModule.hashToken>;
const mockMinutesFromNow = tokensModule.minutesFromNow as jest.MockedFunction<typeof tokensModule.minutesFromNow>;
const mockBuildVerifyEmail = emailModule.buildVerifyEmail as jest.MockedFunction<typeof emailModule.buildVerifyEmail>;
const mockSendMail = emailModule.sendMail as jest.MockedFunction<typeof emailModule.sendMail>;
const mockGetClientIp = rateLimitModule.getClientIp as jest.MockedFunction<typeof rateLimitModule.getClientIp>;
const mockIsRateLimited = rateLimitModule.isRateLimited as jest.MockedFunction<typeof rateLimitModule.isRateLimited>;
const mockGetRetryAfterMs = rateLimitModule.getRetryAfterMs as jest.MockedFunction<typeof rateLimitModule.getRetryAfterMs>;
let mockIsEmailVerificationRequired: jest.MockedFunction<typeof authConfigModule.isEmailVerificationRequired>;
const mockGetRequestContext = loggerModule.getRequestContext as jest.MockedFunction<typeof loggerModule.getRequestContext>;
const mockStructuredLogger = loggerModule.structuredLogger as jest.Mocked<typeof loggerModule.structuredLogger>;

let mockUserFindOne: jest.SpyInstance<any, any>;
let mockUserCreate: jest.SpyInstance<any, any>;
let mockEmailVerificationTokenCreate: jest.SpyInstance<any, any>;

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

describe('Authentication API Routes', () => {
  const originalMongoUri = process.env.MONGODB_URI;

  beforeEach(() => {
    // Setup environment
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    
    // Reset all mocks completely
    jest.clearAllMocks();
    
    // Reset User model spies first
    if (mockUserFindOne) mockUserFindOne.mockRestore();
    if (mockUserCreate) mockUserCreate.mockRestore();
    if (mockEmailVerificationTokenCreate) mockEmailVerificationTokenCreate.mockRestore();
    
    // Setup fresh User model spies
    mockUserFindOne = jest.spyOn(User, 'findOne').mockImplementation();
    mockUserCreate = jest.spyOn(User, 'create').mockImplementation();
    mockEmailVerificationTokenCreate = jest.spyOn(EmailVerificationToken, 'create').mockImplementation();
    
    // DON'T reset the auth config mock - it's not working and we'll rely on the default value
    // mockIsEmailVerificationRequired.mockReturnValue(false);
    
    // Setup default mock implementations using the imported mocks
    mockDbConnect.mockResolvedValue(undefined);
    mockGetClientIp.mockReturnValue('127.0.0.1');
    mockIsRateLimited.mockReturnValue(false);
    mockGetRetryAfterMs.mockReturnValue(60_000);
    // Ensure we reference the mocked module instance produced by Jest's module system
    // This uses jest.requireMock to get the factory/mock created in jest.setup.ts so
    // the function is guaranteed to be a jest.fn with .mockReturnValue available.
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const acMock = jest.requireMock('@/lib/auth/config') as any;
      mockIsEmailVerificationRequired = acMock.isEmailVerificationRequired as jest.MockedFunction<any>;
    } catch (e) {
      // Fallback to the imported reference if requireMock isn't available in this env
      mockIsEmailVerificationRequired = authConfigModule.isEmailVerificationRequired as jest.MockedFunction<any>;
    }
    mockIsEmailVerificationRequired.mockReturnValue(false);
    // mockGenerateToken already has default return value set in __mocks__/lib/tokens.js
    // mockMinutesFromNow already has default implementation set in __mocks__/lib/tokens.js
    // mockBuildVerifyEmail already has default return value set in __mocks__/lib/email.js
    // mockSendMail already has default return value set in __mocks__/lib/email.js
    // mockGetRequestContext already has default return value set in __mocks__/lib/logger.js
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

        console.log('Debug - isEmailVerificationRequired was called:', mockIsEmailVerificationRequired.mock.calls);
        console.log('Debug - Response data:', responseData);

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
        mockGetRetryAfterMs.mockReturnValue(60000); // 60 seconds

        const request = createMockRequest(validRegistrationData);
        const response = await registerPost(request);
        const responseData = await response.json();

        expect(response.status).toBe(429);
        expect(responseData.error).toBe('Too many requests');
        expect(response.headers.get('Retry-After')).toBe('60');
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
