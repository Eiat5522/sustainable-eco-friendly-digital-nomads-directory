import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { middleware } from '../middleware';
import { UserRole } from '@/types/auth';

// Mock next-auth/jwt
jest.mock('next-auth/jwt');
const mockGetToken = getToken as jest.MockedFunction<typeof getToken>;

// Mock NextResponse
const mockRedirect = jest.fn();
const mockNext = jest.fn();
const mockJson = jest.fn();

jest.mock('next/server', () => ({
  NextResponse: {
    redirect: mockRedirect,
    next: mockNext,
    json: mockJson,
  },
}));

describe('Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXTAUTH_SECRET = 'test-secret';
    
    // Default mock implementations
    mockNext.mockReturnValue({
      headers: {
        set: jest.fn(),
      },
    });
    mockRedirect.mockReturnValue({});
    mockJson.mockReturnValue({});
  });

  const createMockRequest = (pathname: string) => {
    return {
      nextUrl: {
        pathname,
      },
      url: `https://example.com${pathname}`,
    } as NextRequest;
  };

  describe('static files and internal routes', () => {
    it('should skip middleware for _next routes', async () => {
      const request = createMockRequest('/_next/static/file.js');
      mockGetToken.mockResolvedValue(null);

      await middleware(request);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    it('should skip middleware for auth API routes', async () => {
      const request = createMockRequest('/api/auth/signin');
      mockGetToken.mockResolvedValue(null);

      await middleware(request);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    it('should skip middleware for files with extensions', async () => {
      const request = createMockRequest('/favicon.ico');
      mockGetToken.mockResolvedValue(null);

      await middleware(request);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRedirect).not.toHaveBeenCalled();
    });
  });

  describe('auth pages handling', () => {
    it('should redirect authenticated users from signin page to dashboard', async () => {
      const request = createMockRequest('/auth/signin');
      mockGetToken.mockResolvedValue({
        role: 'user' as UserRole,
        sub: 'user-id',
      });

      await middleware(request);

      expect(mockRedirect).toHaveBeenCalledWith(
        expect.objectContaining({
          href: 'https://example.com/dashboard',
        })
      );
    });

    it('should redirect authenticated users from signup page to dashboard', async () => {
      const request = createMockRequest('/auth/signup');
      mockGetToken.mockResolvedValue({
        role: 'user' as UserRole,
        sub: 'user-id',
      });

      await middleware(request);

      expect(mockRedirect).toHaveBeenCalledWith(
        expect.objectContaining({
          href: 'https://example.com/dashboard',
        })
      );
    });

    it('should allow unauthenticated users to access auth pages', async () => {
      const request = createMockRequest('/auth/signin');
      mockGetToken.mockResolvedValue(null);

      await middleware(request);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRedirect).not.toHaveBeenCalled();
    });
  });

  describe('protected routes', () => {
    it('should redirect unauthenticated users from dashboard to signin', async () => {
      const request = createMockRequest('/dashboard');
      mockGetToken.mockResolvedValue(null);

      await middleware(request);

      expect(mockRedirect).toHaveBeenCalledWith(
        expect.objectContaining({
          href: 'https://example.com/auth/signin?callbackUrl=%2Fdashboard',
        })
      );
    });

    it('should redirect unauthenticated users from admin to signin', async () => {
      const request = createMockRequest('/admin/users');
      mockGetToken.mockResolvedValue(null);

      await middleware(request);

      expect(mockRedirect).toHaveBeenCalledWith(
        expect.objectContaining({
          href: 'https://example.com/auth/signin?callbackUrl=%2Fadmin%2Fusers',
        })
      );
    });

    it('should redirect unauthenticated users from profile to signin', async () => {
      const request = createMockRequest('/profile');
      mockGetToken.mockResolvedValue(null);

      await middleware(request);

      expect(mockRedirect).toHaveBeenCalledWith(
        expect.objectContaining({
          href: 'https://example.com/auth/signin?callbackUrl=%2Fprofile',
        })
      );
    });

    it('should allow authenticated users with proper role to access protected routes', async () => {
      const request = createMockRequest('/dashboard');
      mockGetToken.mockResolvedValue({
        role: 'user' as UserRole,
        sub: 'user-id',
      });

      await middleware(request);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRedirect).not.toHaveBeenCalled();
    });
  });

  describe('API routes protection', () => {
    it('should return 401 for unauthenticated access to protected API', async () => {
      const request = createMockRequest('/api/user/profile');
      mockGetToken.mockResolvedValue(null);

      await middleware(request);

      expect(mockJson).toHaveBeenCalledWith(
        { error: 'Authentication required' },
        { status: 401 }
      );
    });

    it('should return 401 for unauthenticated access to admin API', async () => {
      const request = createMockRequest('/api/admin/users');
      mockGetToken.mockResolvedValue(null);

      await middleware(request);

      expect(mockJson).toHaveBeenCalledWith(
        { error: 'Authentication required' },
        { status: 401 }
      );
    });

    it('should allow authenticated access to user API', async () => {
      const request = createMockRequest('/api/user/profile');
      mockGetToken.mockResolvedValue({
        role: 'user' as UserRole,
        sub: 'user-id',
      });

      await middleware(request);

      expect(mockNext).toHaveBeenCalled();
      expect(mockJson).not.toHaveBeenCalled();
    });

    it('should allow unauthenticated access to public API routes', async () => {
      const request = createMockRequest('/api/listings');
      mockGetToken.mockResolvedValue(null);

      await middleware(request);

      expect(mockNext).toHaveBeenCalled();
      expect(mockJson).not.toHaveBeenCalled();
    });
  });

  describe('security headers', () => {
    it('should add security headers to response', async () => {
      const request = createMockRequest('/public-page');
      mockGetToken.mockResolvedValue(null);

      const mockHeaderSet = jest.fn();
      mockNext.mockReturnValue({
        headers: {
          set: mockHeaderSet,
        },
      });

      await middleware(request);

      expect(mockHeaderSet).toHaveBeenCalledWith('X-Frame-Options', 'DENY');
      expect(mockHeaderSet).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff');
      expect(mockHeaderSet).toHaveBeenCalledWith('Referrer-Policy', 'strict-origin-when-cross-origin');
    });
  });

  describe('error handling', () => {
    it('should handle errors gracefully and continue', async () => {
      const request = createMockRequest('/dashboard');
      mockGetToken.mockRejectedValue(new Error('Token error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await middleware(request);

      expect(consoleSpy).toHaveBeenCalledWith('Middleware error:', expect.any(Error));
      expect(mockNext).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should continue on getToken failure', async () => {
      const request = createMockRequest('/public-page');
      mockGetToken.mockRejectedValue(new Error('JWT error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await middleware(request);

      expect(mockNext).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('role-based access control', () => {
    it('should deny access for users without proper role', async () => {
      const request = createMockRequest('/admin/settings');
      mockGetToken.mockResolvedValue({
        role: 'user' as UserRole, // Regular user trying to access admin
        sub: 'user-id',
      });

      await middleware(request);

      expect(mockRedirect).toHaveBeenCalledWith(
        expect.objectContaining({
          href: 'https://example.com/?error=unauthorized_access',
        })
      );
    });

    it('should allow access for users with proper role', async () => {
      const request = createMockRequest('/dashboard');
      mockGetToken.mockResolvedValue({
        role: 'user' as UserRole,
        sub: 'user-id',
      });

      await middleware(request);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    it('should return 403 for API routes with insufficient permissions', async () => {
      const request = createMockRequest('/api/admin/delete-user');
      mockGetToken.mockResolvedValue({
        role: 'user' as UserRole, // Regular user trying to access admin API
        sub: 'user-id',
      });

      await middleware(request);

      expect(mockJson).toHaveBeenCalledWith(
        { error: 'Access denied' },
        { status: 403 }
      );
    });
  });

  describe('edge cases', () => {
    it('should handle missing token gracefully', async () => {
      const request = createMockRequest('/public-page');
      mockGetToken.mockResolvedValue(null);

      await middleware(request);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle malformed token', async () => {
      const request = createMockRequest('/dashboard');
      mockGetToken.mockResolvedValue({} as any); // Malformed token without role

      await middleware(request);

      expect(mockRedirect).toHaveBeenCalledWith(
        expect.objectContaining({
          href: 'https://example.com/auth/signin?callbackUrl=%2Fdashboard',
        })
      );
    });

    it('should handle undefined role in token', async () => {
      const request = createMockRequest('/dashboard');
      mockGetToken.mockResolvedValue({
        sub: 'user-id',
        // role is undefined
      });

      await middleware(request);

      expect(mockRedirect).toHaveBeenCalledWith(
        expect.objectContaining({
          href: 'https://example.com/auth/signin?callbackUrl=%2Fdashboard',
        })
      );
    });
  });
});
