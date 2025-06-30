import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { middleware, config } from '../../app-next-directory/src/middleware';
/* UserRole is a type, not a runtime value. Use string literals for roles. */
jest.mock('next/server', () => ({
  NextResponse: {
    redirect: jest.fn(),
    next: jest.fn(),
    json: jest.fn(),
  },
}));

// Mock next-auth/jwt
jest.mock('next-auth/jwt');
const mockGetToken = getToken as jest.MockedFunction<typeof getToken>;

describe('Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXTAUTH_SECRET = 'test-secret';
  });

  const createMockRequest = (pathname: string) => {
    return {
      nextUrl: {
        pathname,
      },
      url: `https://example.com${pathname}`,
    } as NextRequest;
  };

  it('redirects to /login if user is not authenticated and accessing protected route', async () => {
    mockGetToken.mockResolvedValueOnce(null);
    const req = createMockRequest('/admin/dashboard');
    await middleware(req as any);

    expect(NextResponse.redirect).toHaveBeenCalled();
    // Optionally check redirect URL
    // expect((NextResponse.redirect as jest.Mock).mock.calls[0][0].toString()).toContain('/login');
  });

  it('allows access to protected route if user is authenticated', async () => {
    mockGetToken.mockResolvedValueOnce({ email: 'test@example.com', role: 'admin' });
    const req = createMockRequest('/admin/dashboard');
    await middleware(req as any);

    expect(NextResponse.next).toHaveBeenCalled();
  });

  it('denies access to admin route if user is not admin', async () => {
    mockGetToken.mockResolvedValueOnce({ email: 'test@example.com', role: 'user' });
    const req = createMockRequest('/admin/dashboard');
    await middleware(req as any);

    expect(NextResponse.redirect).toHaveBeenCalled();
  });

  it('allows access to public route without authentication', async () => {
    mockGetToken.mockResolvedValueOnce(null);
    const req = createMockRequest('/about');
    await middleware(req as any);

    expect(NextResponse.next).toHaveBeenCalled();
  });
});
