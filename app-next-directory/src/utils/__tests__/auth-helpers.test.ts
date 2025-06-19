import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { getServerSession } from 'next-auth';
import { requireAuth, requireRole, handleAuthError } from '../auth-helpers';
import { ApiResponseHandler } from '../api-response';

// Mock next-auth
jest.mock('next-auth');
const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;

// Mock api-response
jest.mock('../api-response');
const mockApiResponseHandler = ApiResponseHandler as jest.Mocked<typeof ApiResponseHandler>;

describe('Auth Helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

      mockGetServerSession.mockResolvedValue(mockSession);

      const result = await requireAuth();

      expect(result).toEqual(mockSession);
      expect(mockGetServerSession).toHaveBeenCalledTimes(1);
    });

    it('should throw UNAUTHORIZED error when user is not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null);

      await expect(requireAuth()).rejects.toThrow('UNAUTHORIZED');
      expect(mockGetServerSession).toHaveBeenCalledTimes(1);
    });

    it('should throw UNAUTHORIZED error when session is undefined', async () => {
      mockGetServerSession.mockResolvedValue(undefined as any);

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
      mockGetServerSession.mockResolvedValue(mockSession);

      const result = await requireRole(['user', 'admin']);

      expect(result).toEqual(mockSession);
    });

    it('should return session when user has one of multiple allowed roles', async () => {
      const adminSession = {
        ...mockSession,
        user: { ...mockSession.user, role: 'admin' },
      };

      mockGetServerSession.mockResolvedValue(adminSession);

      const result = await requireRole(['admin', 'superadmin']);

      expect(result).toEqual(adminSession);
    });

    it('should throw FORBIDDEN error when user does not have required role', async () => {
      mockGetServerSession.mockResolvedValue(mockSession);

      await expect(requireRole(['admin', 'moderator'])).rejects.toThrow('FORBIDDEN');
    });

    it('should throw UNAUTHORIZED error when user is not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null);

      await expect(requireRole(['user'])).rejects.toThrow('UNAUTHORIZED');
    });

    it('should handle empty allowed roles array', async () => {
      mockGetServerSession.mockResolvedValue(mockSession);

      await expect(requireRole([])).rejects.toThrow('FORBIDDEN');
    });

    it('should handle case-sensitive role matching', async () => {
      const userSession = {
        ...mockSession,
        user: { ...mockSession.user, role: 'User' }, // Capital U
      };

      mockGetServerSession.mockResolvedValue(userSession);

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

      mockGetServerSession.mockResolvedValue(sessionWithoutRole as any);

      await expect(requireRole(['user'])).rejects.toThrow('FORBIDDEN');
    });
  });

  describe('handleAuthError', () => {
    it('should return unauthorized response for UNAUTHORIZED error', () => {
      const unauthorizedResponse = { status: 401, body: 'Unauthorized' };
      mockApiResponseHandler.unauthorized.mockReturnValue(unauthorizedResponse as any);

      const error = new Error('UNAUTHORIZED');
      const result = handleAuthError(error);

      expect(mockApiResponseHandler.unauthorized).toHaveBeenCalledTimes(1);
      expect(result).toEqual(unauthorizedResponse);
    });

    it('should return forbidden response for FORBIDDEN error', () => {
      const forbiddenResponse = { status: 403, body: 'Forbidden' };
      mockApiResponseHandler.forbidden.mockReturnValue(forbiddenResponse as any);

      const error = new Error('FORBIDDEN');
      const result = handleAuthError(error);

      expect(mockApiResponseHandler.forbidden).toHaveBeenCalledTimes(1);
      expect(result).toEqual(forbiddenResponse);
    });

    it('should return generic error response for other errors', () => {
      const genericErrorResponse = { status: 400, body: 'Error' };
      mockApiResponseHandler.error.mockReturnValue(genericErrorResponse as any);

      const error = new Error('Some other error');
      const result = handleAuthError(error);

      expect(mockApiResponseHandler.error).toHaveBeenCalledWith('Authentication error');
      expect(result).toEqual(genericErrorResponse);
    });

    it('should handle errors with different message formats', () => {
      const genericErrorResponse = { status: 400, body: 'Error' };
      mockApiResponseHandler.error.mockReturnValue(genericErrorResponse as any);

      const error = new Error('Network timeout');
      const result = handleAuthError(error);

      expect(mockApiResponseHandler.error).toHaveBeenCalledWith('Authentication error');
      expect(result).toEqual(genericErrorResponse);
    });

    it('should handle error objects without message', () => {
      const genericErrorResponse = { status: 400, body: 'Error' };
      mockApiResponseHandler.error.mockReturnValue(genericErrorResponse as any);

      const error = {} as Error;
      const result = handleAuthError(error);

      expect(mockApiResponseHandler.error).toHaveBeenCalledWith('Authentication error');
      expect(result).toEqual(genericErrorResponse);
    });

    it('should handle null or undefined error gracefully', () => {
      const genericErrorResponse = { status: 400, body: 'Error' };
      mockApiResponseHandler.error.mockReturnValue(genericErrorResponse as any);

      const result = handleAuthError(null as any);

      expect(mockApiResponseHandler.error).toHaveBeenCalledWith('Authentication error');
      expect(result).toEqual(genericErrorResponse);
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

      mockGetServerSession.mockResolvedValue(adminSession);

      const authResult = await requireAuth();
      const roleResult = await requireRole(['admin']);

      expect(authResult).toEqual(adminSession);
      expect(roleResult).toEqual(adminSession);
    });

    it('should handle auth error handling for unauthorized access', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const unauthorizedResponse = { status: 401 };
      mockApiResponseHandler.unauthorized.mockReturnValue(unauthorizedResponse as any);

      try {
        await requireAuth();
      } catch (error) {
        const result = handleAuthError(error as Error);
        expect(result).toEqual(unauthorizedResponse);
      }
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

      mockGetServerSession.mockResolvedValue(userSession);

      const forbiddenResponse = { status: 403 };
      mockApiResponseHandler.forbidden.mockReturnValue(forbiddenResponse as any);

      try {
        await requireRole(['admin']);
      } catch (error) {
        const result = handleAuthError(error as Error);
        expect(result).toEqual(forbiddenResponse);
      }
    });
  });
});
