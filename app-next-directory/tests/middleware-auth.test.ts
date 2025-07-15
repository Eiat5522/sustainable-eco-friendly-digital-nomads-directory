// Mock next-auth/jwt before imports
jest.mock('next-auth/jwt', () => ({ getToken: jest.fn() }));

import { describe, it, expect, jest, beforeAll } from '@jest/globals';
import { middleware } from '../src/middleware';
import { getToken } from 'next-auth/jwt';

// Mock getToken function
const mockGetToken = getToken as jest.MockedFunction<typeof getToken>;


describe('middleware', () => {
  beforeAll(() => {
    process.env.NEXTAUTH_SECRET = 'test-secret';
  });

  it('redirects unauthenticated users from protected route', async () => {
    (getToken as jest.Mock).mockResolvedValue(null);
    const req = { nextUrl: { pathname: '/dashboard', origin: 'http://localhost', href: 'http://localhost/dashboard' } } as any;
    const res = await middleware(req);
    expect(res.status).toBe(307); // or 302 depending on Next.js version
    expect(res.headers.get('location')).toContain('/auth/signin');
  });

  it('allows authenticated users with access', async () => {
    (getToken as jest.Mock).mockResolvedValue({ role: 'admin' });
    const req = { nextUrl: { pathname: '/dashboard', origin: 'http://localhost', href: 'http://localhost/dashboard' } } as any;
    const res = await middleware(req);
    expect(res.headers.get('X-Frame-Options')).toBe('DENY');
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(res.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
  });

  it('denies access for authenticated users without permission', async () => {
    (getToken as jest.Mock).mockResolvedValue({ role: 'user' });
    const req = { nextUrl: { pathname: '/admin', origin: 'http://localhost', href: 'http://localhost/admin' } } as any;
    const res = await middleware(req);
    expect(res.status).toBe(307); // redirected to home with error param
    expect(res.headers.get('location')).toContain('/?error=unauthorized_access');
  });

  it('returns 401 for unauthenticated API access', async () => {
    (getToken as jest.Mock).mockResolvedValue(null);
    const req = { nextUrl: { pathname: '/api/user/profile', origin: 'http://localhost', href: 'http://localhost/api/user/profile' } } as any;
    const res = await middleware(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe('Authentication required');
  });

  it('returns 403 for authenticated API access without permission', async () => {
    (getToken as jest.Mock).mockResolvedValue({ role: 'user' });
    const req = { nextUrl: { pathname: '/api/admin/stats', origin: 'http://localhost', href: 'http://localhost/api/admin/stats' } } as any;
    const res = await middleware(req);
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toBe('Access denied');
  });
});
