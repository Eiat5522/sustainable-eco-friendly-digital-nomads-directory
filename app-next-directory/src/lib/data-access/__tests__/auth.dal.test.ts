/**
 * Unit tests for auth.dal.ts
 * Tests the Data Access Layer for authentication-related data
 */

import { jest } from '@jest/globals';
import type { Session } from 'next-auth';
import {
  checkUserAdminRole,
  getAuthStatus,
  getCurrentUserId,
  getIsUserAdmin,
  getUserDisplayInfo,
  hasPrivilege,
  isValidRole,
} from '../auth.dal';

// Mock dependencies
jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  structuredLogger: {
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

jest.mock('next/cache', () => ({
  cacheLife: jest.fn(),
  cacheTag: jest.fn(),
}));

import { cookies } from 'next/headers';
// Import mocked modules
import { auth } from '@/lib/auth';
import { structuredLogger } from '@/lib/logger';

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockCookies = cookies as jest.MockedFunction<typeof cookies>;

describe('auth.dal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isValidRole', () => {
    it('should return true for valid roles', () => {
      expect(isValidRole('user')).toBe(true);
      expect(isValidRole('admin')).toBe(true);
      expect(isValidRole('superAdmin')).toBe(true);
      expect(isValidRole('venueOwner')).toBe(true);
      expect(isValidRole('premium')).toBe(true);
    });

    it('should return false for invalid roles', () => {
      expect(isValidRole('invalid')).toBe(false);
      expect(isValidRole('')).toBe(false);
      expect(isValidRole(null)).toBe(false);
      expect(isValidRole(undefined)).toBe(false);
      expect(isValidRole(123)).toBe(false);
    });
  });

  describe('checkUserAdminRole', () => {
    it('should return true for admin roles', () => {
      expect(checkUserAdminRole('admin')).toBe(true);
      expect(checkUserAdminRole('superAdmin')).toBe(true);
    });

    it('should return false for non-admin roles', () => {
      expect(checkUserAdminRole('user')).toBe(false);
      expect(checkUserAdminRole('venueOwner')).toBe(false);
      expect(checkUserAdminRole('premium')).toBe(false);
      expect(checkUserAdminRole('invalid')).toBe(false);
    });
  });

  describe('hasPrivilege', () => {
    it('should correctly check admin privilege', () => {
      expect(hasPrivilege('admin', 'admin')).toBe(true);
      expect(hasPrivilege('superAdmin', 'admin')).toBe(true);
      expect(hasPrivilege('user', 'admin')).toBe(false);
      expect(hasPrivilege('venueOwner', 'admin')).toBe(false);
    });

    it('should return false for unknown privileges', () => {
      expect(hasPrivilege('admin', 'unknown')).toBe(false);
      expect(hasPrivilege('user', 'unknown')).toBe(false);
    });

    it('should return false for invalid roles', () => {
      expect(hasPrivilege('invalid', 'admin')).toBe(false);
    });
  });

  describe('getAuthStatus', () => {
    it('should return authenticated status for valid session', async () => {
      const mockCookieStore = {
        get: jest.fn().mockReturnValue({ value: 'session-token' }),
      };
      mockCookies.mockResolvedValue(mockCookieStore as any);

      const mockSession: Partial<Session> = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          image: 'https://example.com/avatar.jpg',
          role: 'user',
        },
      };
      mockAuth.mockResolvedValue(mockSession as Session);

      const result = await getAuthStatus();

      expect(result.isAuthenticated).toBe(true);
      expect(result.isAdmin).toBe(false);
      expect(result.user).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        image: 'https://example.com/avatar.jpg',
        role: 'user',
      });
    });

    it('should return authenticated status with admin flag for admin user', async () => {
      const mockCookieStore = {
        get: jest.fn().mockReturnValue({ value: 'session-token' }),
      };
      mockCookies.mockResolvedValue(mockCookieStore as any);

      const mockSession: Partial<Session> = {
        user: {
          id: 'admin-123',
          email: 'admin@example.com',
          name: 'Admin User',
          image: null,
          role: 'admin',
        },
      };
      mockAuth.mockResolvedValue(mockSession as Session);

      const result = await getAuthStatus();

      expect(result.isAuthenticated).toBe(true);
      expect(result.isAdmin).toBe(true);
      expect(result.user?.role).toBe('admin');
    });

    it('should return unauthenticated if no session cookie', async () => {
      const mockCookieStore = {
        get: jest.fn().mockReturnValue(undefined),
      };
      mockCookies.mockResolvedValue(mockCookieStore as any);

      const result = await getAuthStatus();

      expect(result.isAuthenticated).toBe(false);
      expect(result.isAdmin).toBe(false);
      expect(result.user).toBeNull();
      expect(mockAuth).not.toHaveBeenCalled();
    });

    it('should handle secure cookie token', async () => {
      const mockCookieStore = {
        get: jest
          .fn()
          .mockReturnValueOnce(undefined) // First call returns undefined
          .mockReturnValueOnce({ value: 'secure-session-token' }), // Second call returns secure token
      };
      mockCookies.mockResolvedValue(mockCookieStore as any);

      const mockSession: Partial<Session> = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          role: 'user',
        },
      };
      mockAuth.mockResolvedValue(mockSession as Session);

      const result = await getAuthStatus();

      expect(result.isAuthenticated).toBe(true);
      expect(mockCookieStore.get).toHaveBeenCalledWith('authjs.session-token');
      expect(mockCookieStore.get).toHaveBeenCalledWith('__Secure-authjs.session-token');
    });

    it('should return unauthenticated if session has no user', async () => {
      const mockCookieStore = {
        get: jest.fn().mockReturnValue({ value: 'session-token' }),
      };
      mockCookies.mockResolvedValue(mockCookieStore as any);

      const mockSession: Partial<Session> = {
        user: undefined,
      };
      mockAuth.mockResolvedValue(mockSession as Session);

      const result = await getAuthStatus();

      expect(result.isAuthenticated).toBe(false);
      expect(result.isAdmin).toBe(false);
      expect(result.user).toBeNull();
    });

    it('should return unauthenticated if session user has no id', async () => {
      const mockCookieStore = {
        get: jest.fn().mockReturnValue({ value: 'session-token' }),
      };
      mockCookies.mockResolvedValue(mockCookieStore as any);

      const mockSession: Partial<Session> = {
        user: {
          email: 'test@example.com',
          name: 'Test User',
        } as any,
      };
      mockAuth.mockResolvedValue(mockSession as Session);

      const result = await getAuthStatus();

      expect(result.isAuthenticated).toBe(false);
    });

    it('should default to user role if role is invalid', async () => {
      const mockCookieStore = {
        get: jest.fn().mockReturnValue({ value: 'session-token' }),
      };
      mockCookies.mockResolvedValue(mockCookieStore as any);

      const mockSession: Partial<Session> = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          role: 'invalidRole' as any,
        },
      };
      mockAuth.mockResolvedValue(mockSession as Session);

      const result = await getAuthStatus();

      expect(result.isAuthenticated).toBe(true);
      expect(result.user?.role).toBe('user');
    });

    it('should handle cookies() throwing during static generation', async () => {
      mockCookies.mockRejectedValue(new Error('cookies() not available'));

      const result = await getAuthStatus();

      expect(result.isAuthenticated).toBe(false);
      expect(result.isAdmin).toBe(false);
      expect(result.user).toBeNull();
    });

    it('should handle auth() errors gracefully', async () => {
      const mockCookieStore = {
        get: jest.fn().mockReturnValue({ value: 'session-token' }),
      };
      mockCookies.mockResolvedValue(mockCookieStore as any);
      mockAuth.mockRejectedValue(new Error('Auth error'));

      const result = await getAuthStatus();

      expect(result.isAuthenticated).toBe(false);
      expect(result.isAdmin).toBe(false);
      expect(result.user).toBeNull();
      expect(structuredLogger.error).toHaveBeenCalledWith(
        'Failed to get auth status',
        expect.any(Error),
        expect.objectContaining({ component: 'auth.dal' })
      );
    });
  });

  describe('getUserDisplayInfo', () => {
    it('should return display info for authenticated user with name', async () => {
      const mockCookieStore = {
        get: jest.fn().mockReturnValue({ value: 'session-token' }),
      };
      mockCookies.mockResolvedValue(mockCookieStore as any);

      const mockSession: Partial<Session> = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'John Doe',
          role: 'user',
        },
      };
      mockAuth.mockResolvedValue(mockSession as Session);

      const result = await getUserDisplayInfo();

      expect(result.displayName).toBe('John Doe');
      expect(result.shortName).toBe('John');
      expect(result.initials).toBe('JD');
    });

    it('should use email as display name if name is not available', async () => {
      const mockCookieStore = {
        get: jest.fn().mockReturnValue({ value: 'session-token' }),
      };
      mockCookies.mockResolvedValue(mockCookieStore as any);

      const mockSession: Partial<Session> = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: null,
          role: 'user',
        },
      };
      mockAuth.mockResolvedValue(mockSession as Session);

      const result = await getUserDisplayInfo();

      expect(result.displayName).toBe('test@example.com');
      expect(result.shortName).toBe('');
      expect(result.initials).toBe('??');
    });

    it('should handle single-word names', async () => {
      const mockCookieStore = {
        get: jest.fn().mockReturnValue({ value: 'session-token' }),
      };
      mockCookies.mockResolvedValue(mockCookieStore as any);

      const mockSession: Partial<Session> = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Madonna',
          role: 'user',
        },
      };
      mockAuth.mockResolvedValue(mockSession as Session);

      const result = await getUserDisplayInfo();

      expect(result.displayName).toBe('Madonna');
      expect(result.shortName).toBe('Madonna');
      expect(result.initials).toBe('MA');
    });

    it('should handle names with multiple spaces', async () => {
      const mockCookieStore = {
        get: jest.fn().mockReturnValue({ value: 'session-token' }),
      };
      mockCookies.mockResolvedValue(mockCookieStore as any);

      const mockSession: Partial<Session> = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'John   Paul   Smith',
          role: 'user',
        },
      };
      mockAuth.mockResolvedValue(mockSession as Session);

      const result = await getUserDisplayInfo();

      expect(result.displayName).toBe('John   Paul   Smith');
      expect(result.shortName).toBe('John');
      expect(result.initials).toBe('JS');
    });

    it('should use fallback label for unauthenticated user', async () => {
      mockCookies.mockResolvedValue({
        get: jest.fn().mockReturnValue(undefined),
      } as any);

      const result = await getUserDisplayInfo('Guest User');

      expect(result.displayName).toBe('Guest User');
      expect(result.shortName).toBe('');
      expect(result.initials).toBe('??');
    });

    it('should use default fallback if not provided', async () => {
      mockCookies.mockResolvedValue({
        get: jest.fn().mockReturnValue(undefined),
      } as any);

      const result = await getUserDisplayInfo();

      expect(result.displayName).toBe('your account');
    });
  });

  describe('getIsUserAdmin', () => {
    it('should return true for admin users', async () => {
      const mockCookieStore = {
        get: jest.fn().mockReturnValue({ value: 'session-token' }),
      };
      mockCookies.mockResolvedValue(mockCookieStore as any);

      const mockSession: Partial<Session> = {
        user: {
          id: 'admin-123',
          email: 'admin@example.com',
          name: 'Admin User',
          role: 'admin',
        },
      };
      mockAuth.mockResolvedValue(mockSession as Session);

      const result = await getIsUserAdmin();

      expect(result).toBe(true);
    });

    it('should return true for superAdmin users', async () => {
      const mockCookieStore = {
        get: jest.fn().mockReturnValue({ value: 'session-token' }),
      };
      mockCookies.mockResolvedValue(mockCookieStore as any);

      const mockSession: Partial<Session> = {
        user: {
          id: 'superadmin-123',
          email: 'superadmin@example.com',
          name: 'Super Admin',
          role: 'superAdmin',
        },
      };
      mockAuth.mockResolvedValue(mockSession as Session);

      const result = await getIsUserAdmin();

      expect(result).toBe(true);
    });

    it('should return false for regular users', async () => {
      const mockCookieStore = {
        get: jest.fn().mockReturnValue({ value: 'session-token' }),
      };
      mockCookies.mockResolvedValue(mockCookieStore as any);

      const mockSession: Partial<Session> = {
        user: {
          id: 'user-123',
          email: 'user@example.com',
          name: 'Regular User',
          role: 'user',
        },
      };
      mockAuth.mockResolvedValue(mockSession as Session);

      const result = await getIsUserAdmin();

      expect(result).toBe(false);
    });

    it('should return false for unauthenticated users', async () => {
      mockCookies.mockResolvedValue({
        get: jest.fn().mockReturnValue(undefined),
      } as any);

      const result = await getIsUserAdmin();

      expect(result).toBe(false);
    });
  });

  describe('getCurrentUserId', () => {
    it('should return user ID for authenticated user', async () => {
      const mockCookieStore = {
        get: jest.fn().mockReturnValue({ value: 'session-token' }),
      };
      mockCookies.mockResolvedValue(mockCookieStore as any);

      const mockSession: Partial<Session> = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          role: 'user',
        },
      };
      mockAuth.mockResolvedValue(mockSession as Session);

      const result = await getCurrentUserId();

      expect(result).toBe('user-123');
    });

    it('should return null for unauthenticated user', async () => {
      mockCookies.mockResolvedValue({
        get: jest.fn().mockReturnValue(undefined),
      } as any);

      const result = await getCurrentUserId();

      expect(result).toBeNull();
    });
  });
});
