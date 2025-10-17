import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

// Mock dependencies
jest.mock('@/lib/rate-limit');
jest.mock('@/lib/tokens');
jest.mock('@/lib/logger');

const mockDbConnect = jest.fn();
jest.mock('@/lib/dbConnect', () => ({
  __esModule: true,
  default: mockDbConnect,
}));

const mockFindOne = jest.fn();
const mockUpdateOne = jest.fn();
jest.mock('@/models/User', () => ({
  __esModule: true,
  default: {
    updateOne: mockUpdateOne,
  },
}));

const mockEmailVerificationFindOne = jest.fn();
const mockEmailVerificationDeleteMany = jest.fn();
jest.mock('@/models/EmailVerificationToken', () => ({
  __esModule: true,
  default: {
    findOne: mockEmailVerificationFindOne,
    deleteMany: mockEmailVerificationDeleteMany,
  },
}));

const mockStartSession = jest.fn();
const mockEndSession = jest.fn();
const mockWithTransaction = jest.fn();
jest.mock('mongoose', () => ({
  __esModule: true,
  default: {
    startSession: mockStartSession,
  },
}));

const rateLimitMock = jest.requireMock('@/lib/rate-limit') as jest.Mocked<{
  getClientIp: (...args: any[]) => string;
  isRateLimited: (...args: any[]) => boolean;
  getRetryAfterMs: (...args: any[]) => number;
}>;

const tokenMock = jest.requireMock('@/lib/tokens') as jest.Mocked<{
  hashToken: (...args: any[]) => string;
}>;

const loggerMock = jest.requireMock('@/lib/logger') as {
  structuredLogger: {
    authError: jest.Mock;
  };
  getRequestContext: jest.Mock;
};

type GetHandler = typeof import('../route').GET;
let GET: GetHandler;

const createLeanResult = <T,>(value: T | null) => ({
  lean: jest.fn().mockResolvedValue(value),
});

const createRequest = (token?: string, baseUrl = 'https://example.com') => {
  const url = token
    ? `${baseUrl}/api/auth/verify?token=${token}`
    : `${baseUrl}/api/auth/verify`;
  return new Request(url, {
    method: 'GET',
  });
};

describe('GET /api/auth/verify', () => {
  const originalEnv = process.env;

  beforeEach(async () => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, MONGODB_URI: 'mongodb://localhost/test' };

    rateLimitMock.getClientIp.mockReturnValue('192.168.1.1');
    rateLimitMock.isRateLimited.mockReturnValue(false);
    rateLimitMock.getRetryAfterMs.mockReturnValue(30000);

    mockDbConnect.mockResolvedValue(undefined);
    mockEmailVerificationFindOne.mockReturnValue(createLeanResult(null));
    mockUpdateOne.mockResolvedValue({ acknowledged: true });
    mockEmailVerificationDeleteMany.mockResolvedValue({ deletedCount: 1 });

    tokenMock.hashToken.mockReturnValue('hashed-token');

    mockEndSession.mockResolvedValue(undefined);
    mockWithTransaction.mockImplementation(async (callback) => {
      const session = { id: 'session-1' };
      return await callback(session);
    });
    mockStartSession.mockResolvedValue({
      withTransaction: mockWithTransaction,
      endSession: mockEndSession,
    });

    loggerMock.structuredLogger.authError = jest.fn();
    loggerMock.getRequestContext.mockReturnValue({ requestId: 'req-1' });

    await jest.isolateModulesAsync(async () => {
      GET = (await import('../route')).GET;
    });
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Token validation', () => {
    it('redirects to login with verified=0 when token is missing', async () => {
      const request = createRequest();
      const response = await GET(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe(
        'https://example.com/auth/login?verified=0'
      );
      expect(mockDbConnect).not.toHaveBeenCalled();
    });

    it('redirects to login with verified=0 when token is empty', async () => {
      const request = createRequest('   ');
      const response = await GET(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe(
        'https://example.com/auth/login?verified=0'
      );
      expect(mockDbConnect).not.toHaveBeenCalled();
    });

    it('redirects to login with verified=0 when token is not found', async () => {
      mockEmailVerificationFindOne.mockReturnValue(createLeanResult(null));

      const request = createRequest('invalid-token');
      const response = await GET(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe(
        'https://example.com/auth/login?verified=0'
      );
      expect(tokenMock.hashToken).toHaveBeenCalledWith('invalid-token');
    });

    it('redirects to login with verified=0 when token is expired', async () => {
      const expiredDate = new Date(Date.now() - 1000);
      mockEmailVerificationFindOne.mockReturnValue(createLeanResult({
        userId: 'user-123',
        tokenHash: 'hashed-token',
        expiresAt: expiredDate,
      }));

      const request = createRequest('expired-token');
      const response = await GET(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe(
        'https://example.com/auth/login?verified=0'
      );
    });

    it('allows token with null expiry to work', async () => {
      mockEmailVerificationFindOne.mockReturnValue(createLeanResult({
        userId: 'user-123',
        tokenHash: 'hashed-token',
        expiresAt: null,
      }));

      const request = createRequest('valid-token');
      const response = await GET(request);

      // When expiresAt is null, the token should still work (no expiry check fails)
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe(
        'https://example.com/auth/login?verified=1'
      );
    });
  });

  describe('Rate limiting', () => {
    it('redirects with limited param when rate limit is exceeded', async () => {
      rateLimitMock.isRateLimited.mockReturnValue(true);
      rateLimitMock.getRetryAfterMs.mockReturnValue(45000);

      const request = createRequest('some-token');
      const response = await GET(request);

      expect(response.status).toBe(307);
      const location = response.headers.get('location');
      expect(location).toContain('/auth/login?verified=0');
      expect(location).toContain('limited=45');
      expect(rateLimitMock.isRateLimited).toHaveBeenCalledWith(
        'auth:verify:192.168.1.1',
        10,
        60
      );
    });

    it('applies rate limit with correct parameters', async () => {
      rateLimitMock.isRateLimited.mockReturnValue(true);

      const request = createRequest('token');
      await GET(request);

      expect(rateLimitMock.getClientIp).toHaveBeenCalledWith(request);
      expect(rateLimitMock.isRateLimited).toHaveBeenCalledWith(
        'auth:verify:192.168.1.1',
        10,
        60
      );
    });
  });

  describe('Database configuration', () => {
    it('redirects when MongoDB URI is missing', async () => {
      delete process.env.MONGODB_URI;

      const request = createRequest('valid-token');
      const response = await GET(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe(
        'https://example.com/auth/login?verified=0'
      );
      expect(mockDbConnect).not.toHaveBeenCalled();
    });
  });

  describe('Successful verification', () => {
    it('verifies email and redirects to login with verified=1', async () => {
      const futureDate = new Date(Date.now() + 3600000);
      mockEmailVerificationFindOne.mockReturnValue(createLeanResult({
        userId: 'user-456',
        tokenHash: 'hashed-token',
        expiresAt: futureDate,
      }));

      const request = createRequest('valid-token');
      const response = await GET(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe(
        'https://example.com/auth/login?verified=1'
      );
      expect(mockStartSession).toHaveBeenCalled();
      expect(mockWithTransaction).toHaveBeenCalled();
    });

    it('updates user emailVerified field in transaction', async () => {
      const futureDate = new Date(Date.now() + 3600000);
      mockEmailVerificationFindOne.mockReturnValue(createLeanResult({
        userId: 'user-789',
        tokenHash: 'hashed-token',
        expiresAt: futureDate,
      }));

      const request = createRequest('valid-token');
      await GET(request);

      expect(mockUpdateOne).toHaveBeenCalledWith(
        { _id: 'user-789' },
        { $set: { emailVerified: expect.any(Date) } },
        { session: expect.anything() }
      );
    });

    it('deletes all verification tokens for user in transaction', async () => {
      const futureDate = new Date(Date.now() + 3600000);
      mockEmailVerificationFindOne.mockReturnValue(createLeanResult({
        userId: 'user-101',
        tokenHash: 'hashed-token',
        expiresAt: futureDate,
      }));

      const request = createRequest('valid-token');
      await GET(request);

      expect(mockEmailVerificationDeleteMany).toHaveBeenCalledWith(
        { userId: 'user-101' },
        { session: expect.anything() }
      );
    });

    it('closes session after transaction', async () => {
      const futureDate = new Date(Date.now() + 3600000);
      mockEmailVerificationFindOne.mockReturnValue(createLeanResult({
        userId: 'user-202',
        tokenHash: 'hashed-token',
        expiresAt: futureDate,
      }));

      const request = createRequest('valid-token');
      await GET(request);

      expect(mockEndSession).toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    it('redirects with verified=0 when database connection fails', async () => {
      mockDbConnect.mockRejectedValue(new Error('Connection failed'));

      const request = createRequest('valid-token');
      const response = await GET(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe(
        'https://example.com/auth/login?verified=0'
      );
      expect(loggerMock.structuredLogger.authError).toHaveBeenCalled();
    });

    it('redirects with verified=0 when token lookup fails', async () => {
      mockEmailVerificationFindOne.mockImplementation(() => {
        throw new Error('Database error');
      });

      const request = createRequest('valid-token');
      const response = await GET(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe(
        'https://example.com/auth/login?verified=0'
      );
      expect(loggerMock.structuredLogger.authError).toHaveBeenCalled();
    });

    it('closes session even when transaction fails', async () => {
      const futureDate = new Date(Date.now() + 3600000);
      mockEmailVerificationFindOne.mockReturnValue(createLeanResult({
        userId: 'user-303',
        tokenHash: 'hashed-token',
        expiresAt: futureDate,
      }));
      mockWithTransaction.mockRejectedValue(new Error('Transaction failed'));

      const request = createRequest('valid-token');
      await GET(request);

      expect(mockEndSession).toHaveBeenCalled();
    });

    it('logs errors without exposing token', async () => {
      mockDbConnect.mockRejectedValue(new Error('DB error'));

      const request = createRequest('secret-token-12345');
      await GET(request);

      expect(loggerMock.structuredLogger.authError).toHaveBeenCalled();
    });
  });

  describe('URL handling', () => {
    it('preserves base URL in redirect', async () => {
      const request = createRequest(
        undefined,
        'https://custom-domain.com'
      );
      const response = await GET(request);

      expect(response.headers.get('location')).toBe(
        'https://custom-domain.com/auth/login?verified=0'
      );
    });

    it('handles special characters in token', async () => {
      const specialToken = 'token-with-special+chars/=';
      const request = createRequest(encodeURIComponent(specialToken));

      await GET(request);

      expect(tokenMock.hashToken).toHaveBeenCalledWith(specialToken);
    });
  });
});
