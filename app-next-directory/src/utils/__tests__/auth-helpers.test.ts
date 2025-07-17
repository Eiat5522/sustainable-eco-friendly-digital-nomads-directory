// 1) Pull in the real Session type up front
import type { Session } from 'next-auth';

// 2) Auto-mock the auth module (no factory, so TS stays happy)
jest.mock('@/lib/auth');
import { auth } from '@/lib/auth';
// 3) Give TS the proper call signature
const mockAuth = auth as unknown as jest.MockedFunction<() => Promise<Session | null>>;

// 4) Same pattern for your ApiResponseHandler
jest.mock('../api-response');
import { ApiResponseHandler } from '../api-response';
const {
  unauthorized: mockUnauthorized,
  forbidden:   mockForbidden,
  error:       mockError,
  success:     mockSuccess,
  notFound:    mockNotFound,
} = ApiResponseHandler as jest.Mocked<typeof ApiResponseHandler>;

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { requireAuth, requireRole, handleAuthError } from '../auth-helpers';
import { UserRole } from '../../types/auth';

// Helper function to create a mock NextResponse object
const mockNextResponse = (response: { status: number; body?: any }) => ({
  status: response.status,
  body: response.body,
  json: jest.fn(() => Promise.resolve(response.body)),
  // Add other properties/methods of NextResponse that might be used
});

describe('Auth Helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUnauthorized.mockClear();
    mockForbidden.mockClear();
    mockError.mockClear();
    mockSuccess.mockClear();
    mockNotFound.mockClear();
  });

  describe('requireAuth', () => {
    it('should return session when user is authenticated', async () => {
      const mockSession = {
        user: {
          id: 'user-1',
          email: 'test@example.com',
          role: 'user',
        },
        expires: '2024-12-31',
      };

      mockAuth.mockResolvedValue(mockSession);

      const result = await requireAuth();

      expect(result).toEqual(mockSession);
      expect(mockAuth).toHaveBeenCalledTimes(1);
    });

    it('should throw UNAUTHORIZED error when user is not authenticated', async () => {
      mockAuth.mockResolvedValue(null);

      await expect(requireAuth()).rejects.toThrow('UNAUTHORIZED');
      expect(mockAuth).toHaveBeenCalledTimes(1);
    });

    it('should throw UNAUTHORIZED error when session is undefined', async () => {
      mockAuth.mockResolvedValue(undefined as any);

      await expect(requireAuth()).rejects.toThrow('UNAUTHORIZED');
    });
  });

  describe('requireRole', () => {
    const mockSession = {
      user: {
        id: 'user-1',
        email: 'test@example.com',
        role: 'user',
      },
      expires: '2024-12-31',
    };

    it('should return session when user has required role', async () => {
      mockAuth.mockResolvedValue(mockSession);

      const result = await requireRole(['user', 'admin']);

      expect(result).toEqual(mockSession);
    });

    it('should return session when user has one of multiple allowed roles', async () => {
      const adminSession = {
        ...mockSession,
        user: { ...mockSession.user, role: 'admin' },
      };

      mockAuth.mockResolvedValue(adminSession);

      const result = await requireRole(['admin', 'superadmin']);

      expect(result).toEqual(adminSession);
    });

    it('should throw FORBIDDEN error when user does not have required role', async () => {
      mockAuth.mockResolvedValue(mockSession);

      await expect(requireRole(['admin', 'moderator'])).rejects.toThrow('FORBIDDEN');
    });

    it('should throw UNAUTHORIZED error when user is not authenticated', async () => {
      mockAuth.mockResolvedValue(null);

      await expect(requireRole(['user'])).rejects.toThrow('UNAUTHORIZED');
    });

    it('should handle empty allowed roles array', async () => {
      mockAuth.mockResolvedValue(mockSession);

      await expect(requireRole([])).rejects.toThrow('FORBIDDEN');
    });

    it('should handle case-sensitive role matching', async () => {
      const userSession = {
        ...mockSession,
        user: { ...mockSession.user, role: 'User' }, // Capital U
      };

      mockAuth.mockResolvedValue(userSession);

      await expect(requireRole(['user'])).rejects.toThrow('FORBIDDEN');
    });

    it('should handle missing role in session', async () => {
      const sessionWithoutRole = {
        ...mockSession,
        user: { 
          id: 'user-1',
          email: 'test@example.com',
          // role property missing
        },
      };

      mockAuth.mockResolvedValue(sessionWithoutRole as any);

      await expect(requireRole(['user'])).rejects.toThrow('FORBIDDEN');
    });
  });

  describe('handleAuthError', () => {
   it('should return unauthorized response for UNAUTHORIZED error', () => {
     const unauthorizedResponse = { status: 401, body: { error: 'Unauthorized access', success: false } };
     mockUnauthorized.mockReturnValue(mockNextResponse(unauthorizedResponse) as any);

     const error = new Error('UNAUTHORIZED');
     const result = handleAuthError(error);

     expect(result.status).toEqual(unauthorizedResponse.status);
     expect(result.body).toEqual(unauthorizedResponse.body);
   });

    it('should return forbidden response for FORBIDDEN error', () => {
      const forbiddenResponse = { status: 403, body: { error: 'Forbidden', success: false } };
      mockForbidden.mockReturnValue(mockNextResponse(forbiddenResponse) as any);

      const error = new Error('FORBIDDEN');
      const result = handleAuthError(error);

      expect(result.status).toEqual(forbiddenResponse.status);
      expect(result.body).toEqual(forbiddenResponse.body);
    });

    it('should return generic error response for other errors', () => {
      const genericErrorResponse = { status: 400, body: { error: 'Authentication error', success: false } };
      mockError.mockReturnValue(mockNextResponse(genericErrorResponse) as any);

      const error = new Error('Some other error');
      const result = handleAuthError(error);

      expect(result.status).toEqual(genericErrorResponse.status);
      expect(result.body).toEqual(genericErrorResponse.body);
    });

    it('should handle errors with different message formats', () => {
      const genericErrorResponse = { status: 400, body: { error: 'Authentication error', success: false } };
      mockError.mockReturnValue(mockNextResponse(genericErrorResponse) as any);

      const error = new Error('Network timeout');
      const result = handleAuthError(error);

      expect(result.status).toEqual(genericErrorResponse.status);
      expect(result.body).toEqual(genericErrorResponse.body);
    });

    it('should handle error objects without message', () => {
      const genericErrorResponse = { status: 400, body: { error: 'Authentication error', success: false } };
      mockError.mockReturnValue(mockNextResponse(genericErrorResponse) as any);

      const error = {} as Error;
      const result = handleAuthError(error);

      expect(result.status).toEqual(genericErrorResponse.status);
      expect(result.body).toEqual(genericErrorResponse.body);
    });

    it('should handle null or undefined error gracefully', () => {
      const genericErrorResponse = { status: 400, body: { error: 'Authentication error', success: false } };
      mockError.mockReturnValue(mockNextResponse(genericErrorResponse) as any);

      const result = handleAuthError(null as any);

      expect(result.status).toEqual(genericErrorResponse.status);
      expect(result.body).toEqual(genericErrorResponse.body);
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete auth flow for valid admin user', async () => {
      const adminSession = {
        user: {
          id: 'admin-1',
          email: 'admin@example.com',
          role: 'admin',
        },
        expires: '2024-12-31',
      };

      mockAuth.mockResolvedValue(adminSession);

      const authResult = await requireAuth();
      const roleResult = await requireRole(['admin']);

      expect(authResult).toEqual(adminSession);
      expect(roleResult).toEqual(adminSession);
    });

    it('should return a 401 Unauthorized response and handle error correctly when requireAuth is called without a session', async () => {
      mockAuth.mockResolvedValue(null);

      const unauthorizedResponse = { status: 401, body: { error: 'Unauthorized access', success: false } };
      mockUnauthorized.mockReturnValue(mockNextResponse(unauthorizedResponse) as any);

      await expect(requireAuth()).rejects.toThrow('UNAUTHORIZED');

      const error = new Error('UNAUTHORIZED');
      const result = handleAuthError(error);
      expect(result.status).toEqual(unauthorizedResponse.status);
      expect(result.body).toEqual(unauthorizedResponse.body);
    });

    it('should handle auth error handling for forbidden access', async () => {
      const userSession = {
        user: {
          id: 'user-1',
          email: 'user@example.com',
          role: 'user',
        },
        expires: '2024-12-31',
      };

      mockAuth.mockResolvedValue(userSession);

      const forbiddenResponse = { status: 403, body: { error: 'Forbidden', success: false } };
      mockForbidden.mockReturnValue(mockNextResponse(forbiddenResponse) as any);

      try {
        await requireRole(['admin']);
      } catch (error) {
        const result = handleAuthError(error as Error);
        expect(result.status).toEqual(forbiddenResponse.status);
        expect(result.body).toEqual(forbiddenResponse.body);
      }
    });


  });
});
