/**
 * Jest Test Suite for Email Verification API Route
 * Tests covering:
 * 1. GET /api/auth/verify?token=... - Email verification
 * 2. Rate limiting
 * 3. Token validation and expiration
 * 4. Database transactions
 * 5. Error handling
 */

import { jest } from '@jest/globals';
import { NextResponse } from 'next/server';

// Mock dependencies
const mockDbConnect = jest.fn();
const mockHashToken = jest.fn((token) => `hashed_${token}`);
const mockGetClientIp = jest.fn(() => '127.0.0.1');
const mockIsRateLimited = jest.fn(() => false);
const mockGetRetryAfterMs = jest.fn(() => 30000);
const mockStructuredLogger = {
  authError: jest.fn(),
};
const mockGetRequestContext = jest.fn(() => ({}));

// Mock Mongoose session
const mockSession = {
  withTransaction: jest.fn((fn) => fn()),
  endSession: jest.fn(),
};
const mockStartSession = jest.fn(() => mockSession);

// Mock User model
const mockUserUpdateOne = jest.fn();
const User = {
  updateOne: mockUserUpdateOne,
  startSession: mockStartSession,
};

// Mock EmailVerificationToken model
const mockTokenFindOne = jest.fn();
const mockTokenDeleteMany = jest.fn();
const EmailVerificationToken = {
  findOne: mockTokenFindOne,
  deleteMany: mockTokenDeleteMany,
};

jest.mock('@/lib/dbConnect', () => ({
  default: mockDbConnect,
}));

jest.mock('@/models/User', () => ({
  default: User,
}));

jest.mock('@/models/EmailVerificationToken', () => ({
  default: EmailVerificationToken,
}));

jest.mock('@/lib/tokens', () => ({
  hashToken: mockHashToken,
}));

jest.mock('@/lib/rate-limit', () => ({
  getClientIp: mockGetClientIp,
  isRateLimited: mockIsRateLimited,
  getRetryAfterMs: mockGetRetryAfterMs,
}));

jest.mock('@/lib/logger', () => ({
  structuredLogger: mockStructuredLogger,
  getRequestContext: mockGetRequestContext,
}));

jest.mock('mongoose', () => ({
  default: {
    startSession: mockStartSession,
  },
}));

// Import the route handler after mocks are set up
import { GET } from '@/app/api/auth/verify/route';

describe('Email Verification API - GET /api/auth/verify', () => {
  const originalMongoUri = process.env.MONGODB_URI;

  beforeEach(() => {
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    jest.clearAllMocks();
    mockDbConnect.mockResolvedValue(undefined);
    mockIsRateLimited.mockReturnValue(false);
  });

  afterEach(() => {
    process.env.MONGODB_URI = originalMongoUri;
  });

  describe('Successful Verification', () => {
    it('should verify email and redirect to login with success', async () => {
      const token = 'valid-token-123';
      const mockDoc = {
        userId: 'user-123',
        tokenHash: 'hashed_valid-token-123',
        expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
      };

      mockTokenFindOne.mockResolvedValueOnce(mockDoc);
      mockUserUpdateOne.mockResolvedValueOnce({ modifiedCount: 1 });
      mockTokenDeleteMany.mockResolvedValueOnce({ deletedCount: 1 });

      const mockRequest = {
        url: `http://localhost:3000/api/auth/verify?token=${token}`,
      } as Request;

      const response = await GET(mockRequest);

      expect(response).toBeInstanceOf(NextResponse);
      expect(mockHashToken).toHaveBeenCalledWith(token);
      expect(mockTokenFindOne).toHaveBeenCalledWith({ tokenHash: `hashed_${token}` });
      expect(mockUserUpdateOne).toHaveBeenCalledWith(
        { _id: 'user-123' },
        { $set: { emailVerified: expect.any(Date) } },
        { session: mockSession }
      );
      expect(mockTokenDeleteMany).toHaveBeenCalledWith(
        { userId: 'user-123' },
        { session: mockSession }
      );
    });

    it('should use database transaction for atomicity', async () => {
      const mockDoc = {
        userId: 'user-123',
        tokenHash: 'hashed_token',
        expiresAt: new Date(Date.now() + 3600000),
      };

      mockTokenFindOne.mockResolvedValueOnce(mockDoc);

      const mockRequest = {
        url: 'http://localhost:3000/api/auth/verify?token=test-token',
      } as Request;

      await GET(mockRequest);

      expect(mockStartSession).toHaveBeenCalled();
      expect(mockSession.withTransaction).toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();
    });
  });

  describe('Missing Token', () => {
    it('should redirect to login with error when token is missing', async () => {
      const mockRequest = {
        url: 'http://localhost:3000/api/auth/verify',
      } as Request;

      const response = await GET(mockRequest);

      expect(response).toBeInstanceOf(NextResponse);
      expect(mockHashToken).not.toHaveBeenCalled();
      expect(mockTokenFindOne).not.toHaveBeenCalled();
    });

    it('should redirect when token is empty string', async () => {
      const mockRequest = {
        url: 'http://localhost:3000/api/auth/verify?token=',
      } as Request;

      const response = await GET(mockRequest);

      expect(mockHashToken).not.toHaveBeenCalled();
    });

    it('should redirect when token is only whitespace', async () => {
      const mockRequest = {
        url: 'http://localhost:3000/api/auth/verify?token=   ',
      } as Request;

      const response = await GET(mockRequest);

      expect(mockHashToken).not.toHaveBeenCalled();
    });
  });

  describe('Rate Limiting', () => {
    it('should apply rate limiting by IP address', async () => {
      mockIsRateLimited.mockReturnValueOnce(true);
      mockGetRetryAfterMs.mockReturnValueOnce(45000); // 45 seconds

      const mockRequest = {
        url: 'http://localhost:3000/api/auth/verify?token=test-token',
      } as Request;

      const response = await GET(mockRequest);

      expect(mockGetClientIp).toHaveBeenCalledWith(mockRequest);
      expect(mockIsRateLimited).toHaveBeenCalledWith('auth:verify:127.0.0.1', 10, 60);
      expect(mockTokenFindOne).not.toHaveBeenCalled();
    });

    it('should include retry-after in redirect when rate limited', async () => {
      mockIsRateLimited.mockReturnValueOnce(true);
      mockGetRetryAfterMs.mockReturnValueOnce(30000);

      const mockRequest = {
        url: 'http://localhost:3000/api/auth/verify?token=test-token',
      } as Request;

      await GET(mockRequest);

      expect(mockGetRetryAfterMs).toHaveBeenCalledWith('auth:verify:127.0.0.1');
    });
  });

  describe('Invalid Token', () => {
    it('should redirect when token does not exist in database', async () => {
      mockTokenFindOne.mockResolvedValueOnce(null);

      const mockRequest = {
        url: 'http://localhost:3000/api/auth/verify?token=invalid-token',
      } as Request;

      const response = await GET(mockRequest);

      expect(mockUserUpdateOne).not.toHaveBeenCalled();
    });

    it('should redirect when token is expired', async () => {
      const mockDoc = {
        userId: 'user-123',
        tokenHash: 'hashed_token',
        expiresAt: new Date(Date.now() - 3600000), // 1 hour ago
      };

      mockTokenFindOne.mockResolvedValueOnce(mockDoc);

      const mockRequest = {
        url: 'http://localhost:3000/api/auth/verify?token=expired-token',
      } as Request;

      const response = await GET(mockRequest);

      expect(mockUserUpdateOne).not.toHaveBeenCalled();
    });

    it('should handle token without expiration date', async () => {
      const mockDoc = {
        userId: 'user-123',
        tokenHash: 'hashed_token',
        expiresAt: null,
      };

      mockTokenFindOne.mockResolvedValueOnce(mockDoc);
      mockUserUpdateOne.mockResolvedValueOnce({ modifiedCount: 1 });
      mockTokenDeleteMany.mockResolvedValueOnce({ deletedCount: 1 });

      const mockRequest = {
        url: 'http://localhost:3000/api/auth/verify?token=valid-token',
      } as Request;

      const response = await GET(mockRequest);

      expect(mockUserUpdateOne).toHaveBeenCalled();
    });
  });

  describe('Environment Validation', () => {
    it('should redirect when MONGODB_URI is not set', async () => {
      delete process.env.MONGODB_URI;

      const mockRequest = {
        url: 'http://localhost:3000/api/auth/verify?token=test-token',
      } as Request;

      const response = await GET(mockRequest);

      expect(mockDbConnect).not.toHaveBeenCalled();
      expect(mockTokenFindOne).not.toHaveBeenCalled();
    });

    it('should not process verification without database connection', async () => {
      process.env.MONGODB_URI = '';

      const mockRequest = {
        url: 'http://localhost:3000/api/auth/verify?token=test-token',
      } as Request;

      await GET(mockRequest);

      expect(mockDbConnect).not.toHaveBeenCalled();
    });
  });

  describe('Database Errors', () => {
    it('should handle database connection errors', async () => {
      mockDbConnect.mockRejectedValueOnce(new Error('Connection failed'));

      const mockRequest = {
        url: 'http://localhost:3000/api/auth/verify?token=test-token',
      } as Request;

      const response = await GET(mockRequest);

      expect(mockStructuredLogger.authError).toHaveBeenCalledWith(
        'email verification',
        expect.any(Error),
        expect.any(Object)
      );
    });

    it('should handle token lookup errors', async () => {
      mockTokenFindOne.mockRejectedValueOnce(new Error('Database query failed'));

      const mockRequest = {
        url: 'http://localhost:3000/api/auth/verify?token=test-token',
      } as Request;

      const response = await GET(mockRequest);

      expect(mockStructuredLogger.authError).toHaveBeenCalled();
    });

    it('should handle transaction errors', async () => {
      const mockDoc = {
        userId: 'user-123',
        tokenHash: 'hashed_token',
        expiresAt: new Date(Date.now() + 3600000),
      };

      mockTokenFindOne.mockResolvedValueOnce(mockDoc);
      mockSession.withTransaction.mockRejectedValueOnce(new Error('Transaction failed'));

      const mockRequest = {
        url: 'http://localhost:3000/api/auth/verify?token=test-token',
      } as Request;

      const response = await GET(mockRequest);

      expect(mockSession.endSession).toHaveBeenCalled();
      expect(mockStructuredLogger.authError).toHaveBeenCalled();
    });

    it('should ensure session cleanup on error', async () => {
      mockDbConnect.mockRejectedValueOnce(new Error('Connection failed'));

      const mockRequest = {
        url: 'http://localhost:3000/api/auth/verify?token=test-token',
      } as Request;

      await GET(mockRequest);

      // Session should not be started if dbConnect fails
      expect(mockSession.endSession).not.toHaveBeenCalled();
    });
  });

  describe('Logging', () => {
    it('should log errors with request context', async () => {
      mockTokenFindOne.mockRejectedValueOnce(new Error('Test error'));
      const mockContext = { ip: '127.0.0.1', userAgent: 'test' };
      mockGetRequestContext.mockReturnValueOnce(mockContext);

      const mockRequest = {
        url: 'http://localhost:3000/api/auth/verify?token=test-token',
      } as Request;

      await GET(mockRequest);

      expect(mockGetRequestContext).toHaveBeenCalledWith(mockRequest);
      expect(mockStructuredLogger.authError).toHaveBeenCalledWith(
        'email verification',
        expect.any(Error),
        expect.objectContaining(mockContext)
      );
    });

    it('should redact token in logs', async () => {
      mockTokenFindOne.mockRejectedValueOnce(new Error('Test error'));

      const mockRequest = {
        url: 'http://localhost:3000/api/auth/verify?token=sensitive-token-123',
      } as Request;

      await GET(mockRequest);

      expect(mockStructuredLogger.authError).toHaveBeenCalledWith(
        'email verification',
        expect.any(Error),
        expect.objectContaining({
          token: '[REDACTED]',
        })
      );
    });
  });
});
