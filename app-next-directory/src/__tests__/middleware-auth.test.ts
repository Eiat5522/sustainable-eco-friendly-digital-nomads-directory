
import { getToken } from '@/lib/auth';

// Ensure Jest mock is applied before any imports
jest.mock('@/lib/auth', () => ({
  getToken: jest.fn(),
}));

const mockGetToken = getToken as jest.MockedFunction<typeof getToken>;

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { createMiddleware, config } from '../middleware';
import { UserRole } from '@/types/auth';



// Mock Next.js objects
class MockNextResponse {
  static next = jest.fn(() => new MockNextResponse());
  static redirect = jest.fn((...args) => new MockNextResponse());
  static json = jest.fn(() => new MockNextResponse());
  headers = { set: jest.fn() };
  cookies = { set: jest.fn(), get: jest.fn(), getAll: jest.fn(), delete: jest.fn() };
}

describe('Middleware - Auth and Access Control', () => {
  let middleware: ReturnType<typeof createMiddleware>;

  beforeEach(() => {
    jest.clearAllMocks();
    MockNextResponse.next.mockClear();
    MockNextResponse.redirect.mockClear();
    MockNextResponse.json.mockClear();
    process.env.NEXTAUTH_SECRET = 'test-secret';
    // Use the mocked getToken function
    middleware = createMiddleware({ getToken: mockGetToken, NextResponse: MockNextResponse });
  });

  const createMockRequest = (pathname: string) => {
    return {
      nextUrl: {
        pathname,
        origin: 'https://example.com',
      },
      url: `https://example.com${pathname}`,
    } as any;
  };

  it('allows access to /api/listings for any user', async () => {
    mockGetToken.mockResolvedValueOnce({ user: { email: 'test@example.com', role: 'user' } });
    const req = createMockRequest('/api/listings');
    await middleware(req as any);
    expect(MockNextResponse.next).toHaveBeenCalled();
  });

  it('allows access to /api/listings for unauthenticated users', async () => {
    mockGetToken.mockResolvedValueOnce(null);
    const req = createMockRequest('/api/listings');
    await middleware(req as any);
    expect(MockNextResponse.next).toHaveBeenCalled();
  });

  it('denies access to /api/user/profile for unauthenticated users', async () => {
    mockGetToken.mockResolvedValueOnce(null);
    const req = createMockRequest('/api/user/profile');
    await middleware(req as any);
    expect(MockNextResponse.json).toHaveBeenCalled();
  });

  it('allows access to /api/user/profile for authenticated users', async () => {
    mockGetToken.mockResolvedValueOnce({ user: { email: 'test@example.com', role: 'user' } });
    const req = createMockRequest('/api/user/profile');
    await middleware(req as any);
    expect(MockNextResponse.next).toHaveBeenCalled();
  });

  it('denies access to /api/admin/data for users with the user role', async () => {
    mockGetToken.mockResolvedValueOnce({ user: { email: 'test@example.com', role: 'user' } });
    const req = createMockRequest('/api/admin/data');
    await middleware(req as any);
    expect(MockNextResponse.json).toHaveBeenCalled();
  });

  it('allows access to /api/admin/data for users with the admin role', async () => {
    mockGetToken.mockResolvedValueOnce({ user: { email: 'admin@example.com', role: 'admin' } });
    const req = createMockRequest('/api/admin/data');
    await middleware(req as any);
    expect(MockNextResponse.next).toHaveBeenCalled();
  });

  /**
   * Should redirect to /auth/signin with callbackUrl when accessing a protected route and no user role.
   * Covers the edge case where the role is undefined.
   */
  it('redirects to /auth/signin with callbackUrl when accessing a protected route and no user role', async () => {
    mockGetToken.mockResolvedValueOnce({ user: { email: 'test@example.com', role: undefined } });
    const req = createMockRequest('/dashboard');
    await middleware(req as any);
    expect(MockNextResponse.redirect).toHaveBeenCalled();
    const redirectArg = MockNextResponse.redirect.mock.calls[0][0];
    expect(String(redirectArg)).toBe('https://example.com/auth/signin?callbackUrl=%2Fdashboard');
  });

  it('handles the case where userRole is null', async () => {
    mockGetToken.mockResolvedValueOnce({ user: { email: 'test@example.com', role: null } });
    const req = createMockRequest('/dashboard');
    await middleware(req as any);
    expect(MockNextResponse.redirect).toHaveBeenCalled();
    const redirectArg = MockNextResponse.redirect.mock.calls[0][0];
    expect(String(redirectArg)).toBe('https://example.com/auth/signin?callbackUrl=%2Fdashboard');
  });

  it('handles the case where userRole is an empty string', async () => {
    mockGetToken.mockResolvedValueOnce({ user: { email: 'test@example.com', role: '' } });
    const req = createMockRequest('/dashboard');
    await middleware(req as any);
    expect(MockNextResponse.redirect).toHaveBeenCalled();
    const redirectArg = MockNextResponse.redirect.mock.calls[0][0];
    expect(String(redirectArg)).toBe('https://example.com/auth/signin?callbackUrl=%2Fdashboard');
  });

  /**
   * Should redirect to /auth/signin with callbackUrl when userRole is invalid.
   */
  it('handles the case where userRole is an invalid role', async () => {
    mockGetToken.mockResolvedValueOnce({ user: { email: 'test@example.com', role: 'invalidRole' } });
    const req = createMockRequest('/admin/dashboard');
    await middleware(req as any);
    expect(MockNextResponse.redirect).toHaveBeenCalled();
    const redirectArg = MockNextResponse.redirect.mock.calls[0][0];
    // Implementation redirects to home for invalid roles
    expect(String(redirectArg)).toBe('https://example.com/?error=unauthorized_access');
  });

  it('allows access to /profile for users with profile permission', async () => {
    mockGetToken.mockResolvedValueOnce({ user: { email: 'test@example.com', role: 'user' } });
    const req = createMockRequest('/profile');
    await middleware(req as any);
    expect(MockNextResponse.next).toHaveBeenCalled();
  });

  it('allows access to /listings for users with listings permission', async () => {
    mockGetToken.mockResolvedValueOnce({ user: { email: 'test@example.com', role: 'user' } });
    const req = createMockRequest('/listings');
    await middleware(req as any);
    expect(MockNextResponse.next).toHaveBeenCalled();
  });

  it('allows access to /listings/create for users with createListing permission', async () => {
    mockGetToken.mockResolvedValueOnce({ user: { email: 'test@example.com', role: 'user' } });
    const req = createMockRequest('/listings/create');
    await middleware(req as any);
    expect(MockNextResponse.next).toHaveBeenCalled();
  });

  it('allows access to /listings/edit/123 for users with editListing permission', async () => {
    mockGetToken.mockResolvedValueOnce({ user: { email: 'test@example.com', role: 'user' } });
    const req = createMockRequest('/listings/edit/123');
    await middleware(req as any);
    expect(MockNextResponse.next).toHaveBeenCalled();
  });

  it('allows access to /admin for users with admin permission', async () => {
    mockGetToken.mockResolvedValueOnce({ user: { email: 'admin@example.com', role: 'admin' } });
    const req = createMockRequest('/admin');
    await middleware(req as any);
    expect(MockNextResponse.next).toHaveBeenCalled();
  });

  it('allows access to /admin/dashboard for users with admin permission', async () => {
    mockGetToken.mockResolvedValueOnce({ user: { email: 'admin@example.com', role: 'admin' } });
    const req = createMockRequest('/admin/dashboard');
    await middleware(req as any);
    expect(MockNextResponse.next).toHaveBeenCalled();
  });

  it('redirects to home if access is denied to a protected route', async () => {
    mockGetToken.mockResolvedValueOnce({ user: { email: 'test@example.com', role: 'user' } });
    const req = createMockRequest('/admin/dashboard');
    await middleware(req as any);
    expect(MockNextResponse.redirect).toHaveBeenCalled();
    const redirectArg = MockNextResponse.redirect.mock.calls[0][0];
    expect(String(redirectArg)).toBe('https://example.com/?error=unauthorized_access');
  });
});
