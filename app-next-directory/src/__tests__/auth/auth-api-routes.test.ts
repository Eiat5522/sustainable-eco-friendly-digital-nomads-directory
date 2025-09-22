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
import { NextRequest, NextResponse } from 'next/server';

// Mock dependencies - these are now properly mocked in jest.setup.ts
// jest.mock('@/lib/dbConnect');
// jest.mock('@/models/User');
// jest.mock('@/models/EmailVerificationToken');
// jest.mock('@/lib/tokens');
// jest.mock('@/lib/email');
// jest.mock('@/lib/rate-limit');
// jest.mock('@/lib/logger');
// jest.mock('@/lib/auth/config');

// Import the API route handler after mocking dependencies
import { POST as registerPost } from '@/app/api/auth/register/route';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import EmailVerificationToken from '@/models/EmailVerificationToken';
import { generateToken, minutesFromNow } from '@/lib/tokens';
import { buildVerifyEmail, sendMail } from '@/lib/email';
import { getClientIp, isRateLimited, getRetryAfterMs } from '@/lib/rate-limit';
import { structuredLogger, getRequestContext } from '@/lib/logger';
import { isEmailVerificationRequired } from '@/lib/auth/config';

// Type the mocks - ensure they're jest.fn
const mockDbConnect = dbConnect as jest.MockedFunction<typeof dbConnect>;
const mockUserFindOne = User.findOne as jest.MockedFunction<typeof User.findOne>;
const mockUserCreate = User.create as jest.MockedFunction<typeof User.create>;
const mockEmailVerificationTokenCreate = EmailVerificationToken.create as jest.MockedFunction<typeof EmailVerificationToken.create>;
const mockGenerateToken = generateToken as jest.MockedFunction<typeof generateToken>;
const mockMinutesFromNow = minutesFromNow as jest.MockedFunction<typeof minutesFromNow>;
const mockBuildVerifyEmail = buildVerifyEmail as jest.MockedFunction<typeof buildVerifyEmail>;
const mockSendMail = sendMail as jest.MockedFunction<typeof sendMail>;
const mockGetClientIp = getClientIp as jest.MockedFunction<typeof getClientIp>;
const mockIsRateLimited = isRateLimited as jest.MockedFunction<typeof isRateLimited>;
const mockGetRetryAfterMs = getRetryAfterMs as jest.MockedFunction<typeof getRetryAfterMs>;
const mockIsEmailVerificationRequired = isEmailVerificationRequired as jest.MockedFunction<typeof isEmailVerificationRequired>;

describe('Authentication API Routes', () => {
  // Create fresh mock functions before each test
  let mockDbConnect: jest.MockedFunction<any>;
  let mockGetClientIp: jest.MockedFunction<any>;
  let mockIsRateLimited: jest.MockedFunction<any>;
  let mockIsEmailVerificationRequired: jest.MockedFunction<any>;
  let mockUserFindOne: jest.MockedFunction<any>;
  let mockUserCreate: jest.MockedFunction<any>;
  let mockEmailVerificationTokenCreate: jest.MockedFunction<any>;
  let mockGenerateToken: jest.MockedFunction<any>;
  let mockMinutesFromNow: jest.MockedFunction<any>;
  let mockBuildVerifyEmail: jest.MockedFunction<any>;
  let mockSendMail: jest.MockedFunction<any>;
  let mockGetRetryAfterMs: jest.MockedFunction<any>;

  beforeEach(() => {
    // Reset all mocks and create fresh ones
    jest.clearAllMocks();
    
    // Create new mock functions
    mockDbConnect = jest.fn().mockResolvedValue(undefined);
    mockGetClientIp = jest.fn().mockReturnValue('127.0.0.1');
    mockIsRateLimited = jest.fn().mockReturnValue(false);
    mockIsEmailVerificationRequired = jest.fn().mockReturnValue(false);
    mockUserFindOne = jest.fn();
    mockUserCreate = jest.fn();
    mockEmailVerificationTokenCreate = jest.fn();
    mockGenerateToken = jest.fn().mockReturnValue({ raw: 'test-token-raw', hash: 'test-token-hash' });
    mockMinutesFromNow = jest.fn().mockReturnValue(new Date(Date.now() + 60 * 60 * 1000));
    mockBuildVerifyEmail = jest.fn().mockResolvedValue({
      to: 'test@example.com',
      subject: 'Verify your email',
      html: '<p>Test email</p>',
      text: 'Test email'
    });
    mockSendMail = jest.fn().mockResolvedValue({ messageId: 'test-message-id' });
    mockGetRetryAfterMs = jest.fn().mockReturnValue(60000);
    
    // Override the imported functions with our mocks
    Object.defineProperty(dbConnect, 'mockResolvedValue', {
      value: mockDbConnect.mockResolvedValue.bind(mockDbConnect),
      writable: true
    });
    Object.defineProperty(getClientIp, 'mockReturnValue', {
      value: mockGetClientIp.mockReturnValue.bind(mockGetClientIp),
      writable: true
    });
    Object.defineProperty(isRateLimited, 'mockReturnValue', {
      value: mockIsRateLimited.mockReturnValue.bind(mockIsRateLimited),
      writable: true
    });
    Object.defineProperty(isEmailVerificationRequired, 'mockReturnValue', {
      value: mockIsEmailVerificationRequired.mockReturnValue.bind(mockIsEmailVerificationRequired),
      writable: true
    });
    
    // Mock environment
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
  });

  afterEach(() => {
    delete process.env.MONGODB_URI;
  });

  describe('Registration API Route (/api/auth/register)', () => {
    const validRegistrationData = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
    };

    const createMockRequest = (data: any) => {
      return {
        json: jest.fn().mockResolvedValue(data),
        headers: {
          get: jest.fn().mockReturnValue('127.0.0.1'),
        },
      } as unknown as NextRequest;
    };

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
        const request = {
          json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
          headers: {
            get: jest.fn().mockReturnValue('127.0.0.1'),
          },
        } as unknown as NextRequest;

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
});