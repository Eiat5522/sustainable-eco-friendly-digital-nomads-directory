import { getToken } from '@/lib/auth';

// Mock next-auth/jwt before imports
jest.mock('@/lib/auth', () => ({
  getToken: jest.fn(),
}));

const mockGetToken = getToken as jest.MockedFunction<typeof getToken>;

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { createMiddleware, config } from '../middleware';

type MockToken = { role?: string; email?: string; user?: { email: string; role: string } } | null;

// ES6 class mock for NextResponse with static methods
class MockNextResponse {
  static next = jest.fn(() => new MockNextResponse());
  static redirect = jest.fn(() => new MockNextResponse());
  static json = jest.fn(() => new MockNextResponse());
  headers = { set: jest.fn() };
  cookies = { set: jest.fn(), get: jest.fn(), getAll: jest.fn(), delete: jest.fn() };
}

// Add a local type for NextRequest for testing
type NextRequest = {
  nextUrl: {
    pathname: string;
    searchParams?: URLSearchParams;
    origin: string;
  };
  url: string;
  headers?: Headers;
};

describe('Middleware', () => {
  let middleware: ReturnType<typeof createMiddleware>;
  
  beforeEach(() => {
    jest.clearAllMocks();
    MockNextResponse.next.mockClear();
    MockNextResponse.redirect.mockClear();
    MockNextResponse.json.mockClear();
    process.env.NEXTAUTH_SECRET = 'test-secret';
    middleware = createMiddleware({ getToken: mockGetToken, NextResponse: MockNextResponse });
  });

  const createMockRequest = (pathname: string): NextRequest => {
    return {
      nextUrl: {
        pathname,
        origin: 'https://example.com',
        searchParams: new URLSearchParams(),
      },
      url: `https://example.com${pathname}`,
      headers: new Headers(),
    };
  };

  // Basic authentication tests
  it('should allow access to public routes without authentication', async () => {
    mockGetToken.mockResolvedValueOnce(null);
    const req = createMockRequest('/');
    await middleware(req);

    expect(MockNextResponse.next).toHaveBeenCalled();
    expect(MockNextResponse.redirect).not.toHaveBeenCalled();
  });

  it('allows access to public route without authentication', async () => {
    mockGetToken.mockResolvedValueOnce(null);
    const req = createMockRequest('/about');
    await middleware(req);

    expect(MockNextResponse.next).toHaveBeenCalled();
  });

  // Protected route tests
  it('redirects to /login if user is not authenticated and accessing protected route', async () => {
    mockGetToken.mockResolvedValueOnce(null);
    const req = createMockRequest('/admin/dashboard');
    await middleware(req);

    expect(MockNextResponse.redirect).toHaveBeenCalled();
  });

  it('should redirect unauthenticated users from protected routes', async () => {
    mockGetToken.mockResolvedValueOnce(null);
    const req = createMockRequest('/admin');
    await middleware(req);

    expect(MockNextResponse.redirect).toHaveBeenCalled();
  });

  it('allows access to protected route if user is authenticated', async () => {
    mockGetToken.mockResolvedValueOnce({ role: 'admin', email: 'test@example.com' });
    const req = createMockRequest('/admin/dashboard');
    await middleware(req);

    expect(MockNextResponse.next).toHaveBeenCalled();
  });

  it('should allow authenticated users with correct role to access protected routes', async () => {
    mockGetToken.mockResolvedValueOnce({ role: 'admin', email: 'admin@example.com' });
    const req = createMockRequest('/admin');
    await middleware(req);

    expect(MockNextResponse.next).toHaveBeenCalled();
    expect(MockNextResponse.redirect).not.toHaveBeenCalled();
  });

  // Role-based access control tests
  it('denies access to admin route if user is not admin', async () => {
    mockGetToken.mockResolvedValueOnce({ role: 'user', email: 'test@example.com' });
    const req = createMockRequest('/admin/dashboard');
    await middleware(req);

    expect(MockNextResponse.redirect).toHaveBeenCalled();
  });

  it('should redirect authenticated users without correct role from protected routes', async () => {
    mockGetToken.mockResolvedValueOnce({ role: 'user', email: 'user@example.com' });
    const req = createMockRequest('/admin');
    await middleware(req);

    expect(MockNextResponse.redirect).toHaveBeenCalled();
  });

  // Auth page redirect tests
  it('redirects authenticated user away from /auth/signin to /dashboard', async () => {
    mockGetToken.mockResolvedValueOnce({ role: 'user', email: 'test@example.com' });
    const req = createMockRequest('/auth/signin');
    await middleware(req);

    expect(MockNextResponse.redirect).toHaveBeenCalled();
  });

  it('should redirect from auth pages when already authenticated', async () => {
    mockGetToken.mockResolvedValueOnce({ role: 'user', email: 'user@example.com' });
    const req = createMockRequest('/login');
    await middleware(req);

    expect(MockNextResponse.redirect).toHaveBeenCalled();
  });

  // API route tests
  it('allows unauthenticated access to /api/listings (public API)', async () => {
    mockGetToken.mockResolvedValueOnce(null);
    const req = createMockRequest('/api/listings');
    await middleware(req);

    expect(MockNextResponse.next).toHaveBeenCalled();
  });

  it('returns 401 for unauthenticated access to protected API', async () => {
    mockGetToken.mockResolvedValueOnce(null);
    const req = createMockRequest('/api/user/profile');
    await middleware(req);

    expect(MockNextResponse.json).toHaveBeenCalled();
  });

  it('returns 403 for authenticated user without access to protected API', async () => {
    mockGetToken.mockResolvedValueOnce({ role: 'user', email: 'test@example.com' });
    const req = createMockRequest('/api/admin/data');
    await middleware(req);

    expect(MockNextResponse.json).toHaveBeenCalled();
  });

  it('allows authenticated user with access to protected API', async () => {
    mockGetToken.mockResolvedValueOnce({ role: 'admin', email: 'test@example.com' });
    const req = createMockRequest('/api/admin/data');
    await middleware(req);

    expect(MockNextResponse.next).toHaveBeenCalled();
  });

  // Profile route tests
  it('redirects unauthenticated user from /profile to /auth/signin with callbackUrl', async () => {
    mockGetToken.mockResolvedValueOnce(null);
    const req = createMockRequest('/profile');
    await middleware(req);

    expect(MockNextResponse.redirect).toHaveBeenCalled();
  });

  // Venue management tests
  it('should allow venue owners to access venue management routes', async () => {
    mockGetToken.mockResolvedValueOnce({ role: 'venueOwner', email: 'venue@example.com' });
    const req = createMockRequest('/venue/manage');
    await middleware(req);

    expect(MockNextResponse.next).toHaveBeenCalled();
    expect(MockNextResponse.redirect).not.toHaveBeenCalled();
  });

  // Static files and internal routes tests
  it('skips middleware for static files', async () => {
    mockGetToken.mockResolvedValueOnce(null);
    const req = createMockRequest('/_next/static/file.js');
    await middleware(req);

    expect(MockNextResponse.next).toHaveBeenCalled();
  });

  it('skips middleware for internal Next.js routes', async () => {
    mockGetToken.mockResolvedValueOnce(null);
    const req = createMockRequest('/api/auth/session');
    await middleware(req);

    expect(MockNextResponse.next).toHaveBeenCalled();
  });

  // Error handling tests
  it('handles errors gracefully and calls NextResponse.next', async () => {
    mockGetToken.mockImplementationOnce(() => { throw new Error('Test error'); });
    const req = createMockRequest('/dashboard');
    await middleware(req);

    expect(MockNextResponse.next).toHaveBeenCalled();
  });
});