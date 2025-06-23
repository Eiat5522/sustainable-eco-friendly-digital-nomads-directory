import { NextRequest, NextResponse } from 'next/server';
import { middleware } from '../src/middleware';
import { getToken } from 'next-auth/jwt';

jest.mock('next-auth/jwt', () => ({
  getToken: jest.fn(),
}));

describe('middleware', () => {
  beforeAll(() => {
    process.env.NEXTAUTH_SECRET = 'test-secret';
  });

  it('redirects unauthenticated users from protected route', async () => {
    (getToken as jest.Mock).mockResolvedValue(null);
    const req = new NextRequest('http://localhost/dashboard');
    const res = await middleware(req);
    expect(res.status).toBe(307); // or 302 depending on Next.js version
    expect(res.headers.get('location')).toContain('/auth/signin');
  });

  it('allows authenticated users with access', async () => {
    (getToken as jest.Mock).mockResolvedValue({ role: 'admin' });
    const req = new NextRequest('http://localhost/dashboard');
    const res = await middleware(req);
    expect(res.headers.get('X-Frame-Options')).toBe('DENY');
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(res.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
  });

  it('denies access for authenticated users without permission', async () => {
    (getToken as jest.Mock).mockResolvedValue({ role: 'user' });
    const req = new NextRequest('http://localhost/admin');
    const res = await middleware(req);
    expect(res.status).toBe(307); // redirected to home with error param
    expect(res.headers.get('location')).toContain('/?error=unauthorized_access');
  });

  it('returns 401 for unauthenticated API access', async () => {
    (getToken as jest.Mock).mockResolvedValue(null);
    const req = new NextRequest('http://localhost/api/user/profile');
    const res = await middleware(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe('Authentication required');
  });

  it('returns 403 for authenticated API access without permission', async () => {
    (getToken as jest.Mock).mockResolvedValue({ role: 'user' });
    const req = new NextRequest('http://localhost/api/admin/stats');
    const res = await middleware(req);
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toBe('Access denied');
  });
});
