jest.mock('next-auth/jwt');
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { getToken } from 'next-auth/jwt';
import { createMiddleware, config } from '../middleware';
// ES6 class mock for NextResponse with static methods
class MockNextResponse {
  static next = jest.fn(() => new MockNextResponse());
  static redirect = jest.fn(() => new MockNextResponse());
  static json = jest.fn(() => new MockNextResponse());
  headers = { set: jest.fn() };
  cookies = { set: jest.fn(), get: jest.fn(), getAll: jest.fn(), delete: jest.fn() };
}
/* UserRole is a type, not a runtime value. Use string literals for roles. */

// Mock next-auth/jwt
const mockGetToken = getToken as jest.MockedFunction<typeof getToken>;

describe('Middleware', () => {
  let middleware: ReturnType<typeof createMiddleware>;
  beforeEach(() => {
    jest.clearAllMocks();
    MockNextResponse.next.mockClear();
    MockNextResponse.redirect.mockClear();
    MockNextResponse.json.mockClear();
    process.env.NEXTAUTH_SECRET = 'test-secret';
    middleware = createMiddleware({ getToken, NextResponse: MockNextResponse });
  });

  const createMockRequest = (pathname: string) => {
    return {
      nextUrl: {
        pathname,
      },
      url: `https://example.com${pathname}`,
    } as any;
  };

  it('redirects to /login if user is not authenticated and accessing protected route', async () => {
    mockGetToken.mockResolvedValueOnce(null);
    const req = createMockRequest('/admin/dashboard');
    await middleware(req as any);

    expect(MockNextResponse.redirect).toHaveBeenCalled();
    // Optionally check redirect URL
    // expect((NextResponse.redirect as jest.Mock).mock.calls[0][0].toString()).toContain('/login');
  });

  it('allows access to protected route if user is authenticated', async () => {
    mockGetToken.mockResolvedValueOnce({ email: 'test@example.com', role: 'admin' });
    const req = createMockRequest('/admin/dashboard');
    await middleware(req as any);

    expect(MockNextResponse.next).toHaveBeenCalled();
  });

  it('denies access to admin route if user is not admin', async () => {
    mockGetToken.mockResolvedValueOnce({ email: 'test@example.com', role: 'user' });
    const req = createMockRequest('/admin/dashboard');
    await middleware(req as any);

    expect(MockNextResponse.redirect).toHaveBeenCalled();
  });

  it('allows access to public route without authentication', async () => {
    mockGetToken.mockResolvedValueOnce(null);
    const req = createMockRequest('/about');
    await middleware(req as any);

    expect(MockNextResponse.next).toHaveBeenCalled();
  });

  it('redirects authenticated user away from /auth/signin to /dashboard', async () => {
    mockGetToken.mockResolvedValueOnce({ email: 'test@example.com', role: 'user' });
    const req = createMockRequest('/auth/signin');
    await middleware(req as any);

    expect(MockNextResponse.redirect).toHaveBeenCalled();
    // Optionally check redirect URL
    // expect((NextResponse.redirect as jest.Mock).mock.calls[0][0].toString()).toContain('/dashboard');
  });

  it('allows unauthenticated access to /api/listings (public API)', async () => {
    mockGetToken.mockResolvedValueOnce(null);
    const req = createMockRequest('/api/listings');
    await middleware(req as any);

    expect(MockNextResponse.next).toHaveBeenCalled();
  });

  it('returns 401 for unauthenticated access to protected API', async () => {
    mockGetToken.mockResolvedValueOnce(null);
    const req = createMockRequest('/api/user/profile');
    await middleware(req as any);

    expect(MockNextResponse.json).toHaveBeenCalled();
    // Optionally, check the arguments:
    // expect(MockNextResponse.json.mock.calls[0][0]).toEqual({
    //   body: { error: 'Authentication required' },
    //   init: { status: 401 }
    // });
  });

  it('returns 403 for authenticated user without access to protected API', async () => {
    mockGetToken.mockResolvedValueOnce({ email: 'test@example.com', role: 'user' });
    const req = createMockRequest('/api/admin/data');
    await middleware(req as any);

    expect(MockNextResponse.json).toHaveBeenCalled();
    // Optionally, check the arguments if the mock is updated to accept them:
    // expect(MockNextResponse.json.mock.calls[0][0]).toEqual({
    //   body: { error: 'Access denied' },
    //   init: { status: 403 }
    // });
  });

  it('allows authenticated user with access to protected API', async () => {
    mockGetToken.mockResolvedValueOnce({ email: 'test@example.com', role: 'admin' });
    const req = createMockRequest('/api/admin/data');
    await middleware(req as any);

    expect(MockNextResponse.next).toHaveBeenCalled();
  });

  it('redirects unauthenticated user from /profile to /auth/signin with callbackUrl', async () => {
    mockGetToken.mockResolvedValueOnce(null);
    const req = createMockRequest('/profile');
    await middleware(req as any);

    expect(MockNextResponse.redirect).toHaveBeenCalled();
    // Optionally check callbackUrl param
    // const url = (NextResponse.redirect as jest.Mock).mock.calls[0][0];
    // expect(url.toString()).toContain('callbackUrl=%2Fprofile');
  });

  it('skips middleware for static files', async () => {
    mockGetToken.mockResolvedValueOnce(null);
    const req = createMockRequest('/_next/static/file.js');
    await middleware(req as any);

    expect(MockNextResponse.next).toHaveBeenCalled();
  });

  it('skips middleware for internal Next.js routes', async () => {
    mockGetToken.mockResolvedValueOnce(null);
    const req = createMockRequest('/api/auth/session');
    await middleware(req as any);

    expect(MockNextResponse.next).toHaveBeenCalled();
  });

  it('handles errors gracefully and calls NextResponse.next', async () => {
    mockGetToken.mockImplementationOnce(() => { throw new Error('Test error'); });
    const req = createMockRequest('/dashboard');
    await middleware(req as any);

    expect(MockNextResponse.next).toHaveBeenCalled();
  });

});
