// First, unmock the auth-helpers module that's globally mocked
// Use the same relative path used by the import below so jest.unmock works reliably.
jest.unmock('../auth-helpers');

// Mock only the dependencies, not the functions we're testing.
// Provide explicit factories so the mocked functions are jest.fn() and usable in assertions.
jest.mock('../../lib/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('../api-response', () => ({
  ApiResponseHandler: {
    unauthorized: jest.fn(),
    forbidden: jest.fn(),
    error: jest.fn(),
  },
}));

// Import the mocked dependencies
import { auth } from '../../lib/auth';
import { ApiResponseHandler } from '../api-response';
// Import the actual module without mocking it
import { handleAuthError, requireAuth, requireRole } from '../auth-helpers';

// Type the mocked functions
const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockApiResponseHandler = ApiResponseHandler as unknown as {
  unauthorized: jest.Mock;
  forbidden: jest.Mock;
  error: jest.Mock;
};

// Helper function to create mock response objects
const createMockResponse = (status: number, data: any) => ({
  status,
  json: () => Promise.resolve(data),
});

describe('Auth Helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test data
  const mockSession = {
    user: { id: 'user-1', email: 'test@example.com', role: 'user' },
    expires: '2024-12-31',
  };

  const adminSession = {
    user: { id: 'admin-1', email: 'admin@example.com', role: 'admin' },
    expires: '2024-12-31',
  };

  describe('requireAuth', () => {
    it('should return session when user is authenticated', async () => {
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
    it('should return session when user has required role', async () => {
      mockAuth.mockResolvedValue(mockSession);

      const result = await requireRole(['user', 'admin']);

      expect(result).toEqual(mockSession);
    });

    it('should return session when user has one of multiple allowed roles', async () => {
      mockAuth.mockResolvedValue(adminSession);

      const result = await requireRole(['admin', 'superAdmin']);

      expect(result).toEqual(adminSession);
    });

    it('should throw FORBIDDEN error when user does not have required role', async () => {
      mockAuth.mockResolvedValue(mockSession);

      // TODO: 'moderator' role replaced with 'admin' for test - verify this permission mapping is correct
      await expect(requireRole(['admin', 'superAdmin'])).rejects.toThrow('FORBIDDEN');
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
        user: { id: 'user-1', email: 'test@example.com', role: 'User' },
        expires: '2024-12-31',
      };
      mockAuth.mockResolvedValue(userSession);

      await expect(requireRole(['user'])).rejects.toThrow('FORBIDDEN');
    });

    it('should handle missing role in session', async () => {
      const sessionWithoutRole = {
        user: { id: 'user-1', email: 'test@example.com' },
        expires: '2024-12-31',
      };
      mockAuth.mockResolvedValue(sessionWithoutRole);

      await expect(requireRole(['user'])).rejects.toThrow('FORBIDDEN');
    });
  });

  describe('handleAuthError', () => {
    it('should return unauthorized response for UNAUTHORIZED error', () => {
      const error = new Error('UNAUTHORIZED');
      // Create expected response object directly since NextResponse.json may not work in test environment
      const expectedResponse = {
        status: 401,
        json: () => Promise.resolve({ success: false, error: 'Unauthorized access' }),
      };

      mockApiResponseHandler.unauthorized.mockReturnValue(expectedResponse);

      const result = handleAuthError(error);

      expect(result).toEqual(expectedResponse);
      expect(mockApiResponseHandler.unauthorized).toHaveBeenCalledTimes(1);
    });

    it('should return forbidden response for FORBIDDEN error', () => {
      const error = new Error('FORBIDDEN');
      const expectedResponse = createMockResponse(403, { success: false, error: 'Forbidden' });

      mockApiResponseHandler.forbidden.mockReturnValue(expectedResponse);

      const result = handleAuthError(error);

      expect(result).toEqual(expectedResponse);
      expect(mockApiResponseHandler.forbidden).toHaveBeenCalledTimes(1);
    });

    it('should return generic error response for other errors', () => {
      const error = new Error('Some other error');
      const expectedResponse = createMockResponse(400, {
        success: false,
        error: 'Authentication error',
      });

      mockApiResponseHandler.error.mockReturnValue(expectedResponse);

      const result = handleAuthError(error);

      expect(result).toEqual(expectedResponse);
      expect(mockApiResponseHandler.error).toHaveBeenCalledWith('Authentication error');
    });

    it('should handle errors with different message formats', () => {
      const error = { message: 'Custom error format' };
      const expectedResponse = createMockResponse(400, {
        success: false,
        error: 'Authentication error',
      });

      mockApiResponseHandler.error.mockReturnValue(expectedResponse);

      const result = handleAuthError(error);

      expect(result).toEqual(expectedResponse);
      expect(mockApiResponseHandler.error).toHaveBeenCalledWith('Authentication error');
    });

    it('should handle error objects without message', () => {
      const error = { someProperty: 'value' };
      const expectedResponse = createMockResponse(400, {
        success: false,
        error: 'Authentication error',
      });

      mockApiResponseHandler.error.mockReturnValue(expectedResponse);

      const result = handleAuthError(error);

      expect(result).toEqual(expectedResponse);
      expect(mockApiResponseHandler.error).toHaveBeenCalledWith('Authentication error');
    });

    it('should handle null or undefined error gracefully', () => {
      const expectedResponse = createMockResponse(400, {
        success: false,
        error: 'Authentication error',
      });

      mockApiResponseHandler.error.mockReturnValue(expectedResponse);

      const result = handleAuthError(null as any);

      expect(result).toEqual(expectedResponse);
      expect(mockApiResponseHandler.error).toHaveBeenCalledWith('Authentication error');
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete auth flow for valid admin user', async () => {
      mockAuth.mockResolvedValue(adminSession);

      const authResult = await requireAuth();
      const roleResult = await requireRole(['admin']);

      expect(authResult).toEqual(adminSession);
      expect(roleResult).toEqual(adminSession);
    });

    it('should return a 401 Unauthorized response and handle error correctly when requireAuth is called without a session', async () => {
      mockAuth.mockResolvedValue(null);
      const expectedResponse = createMockResponse(401, {
        success: false,
        error: 'Unauthorized access',
      });
      mockApiResponseHandler.unauthorized.mockReturnValue(expectedResponse);

      await expect(requireAuth()).rejects.toThrow('UNAUTHORIZED');

      const error = new Error('UNAUTHORIZED');
      const result = handleAuthError(error);

      expect(result).toEqual(expectedResponse);
    });

    it('should handle auth error handling for forbidden access', async () => {
      mockAuth.mockResolvedValue(mockSession);
      const expectedResponse = createMockResponse(403, { success: false, error: 'Forbidden' });
      mockApiResponseHandler.forbidden.mockReturnValue(expectedResponse);

      await expect(requireRole(['admin'])).rejects.toThrow('FORBIDDEN');

      const error = new Error('FORBIDDEN');
      const result = handleAuthError(error);

      expect(result).toEqual(expectedResponse);
    });
  });
});
