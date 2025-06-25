/**
 * Integration-style tests for middleware using real NextRequest/NextResponse objects.
 * Polyfills Request/Response for Node.js and only mocks getToken.
 * Focuses on end-to-end behavior and real HTTP semantics.
 * For isolated unit tests with injected mocks, see:
 *   ./middleware.test.ts
 *
 * Note: Both test files are needed for full coverage due to differences in mocking vs. real Next.js objects.
 */
// Polyfill for Request/Response for Jest (Node.js)
import 'cross-fetch/polyfill';

// Ensure global Request/Response are defined BEFORE any Next.js or middleware imports
if (typeof global.Request === 'undefined') {
  // @ts-ignore
  global.Request = fetch.Request;
}
if (typeof global.Response === 'undefined') {
  // @ts-ignore
  global.Response = fetch.Response;
}

import { middleware } from '../middleware';
import { getToken } from 'next-auth/jwt';
import { NextRequest } from 'next/server';

jest.mock('next-auth/jwt', () => ({
  getToken: jest.fn(),
}));

// Utility function to create a real NextRequest for tests
function createNextRequest(url: string, options: RequestInit = {}): NextRequest {
  // Only include signal if it is a valid AbortSignal
  const { signal, ...rest } = options;
  const filteredOptions = signal instanceof AbortSignal ? { ...rest, signal } : rest;
  return new NextRequest(url, filteredOptions);
}

// Helper to create a mock token with all required properties
function mockToken(role: string) {
  return { role, name: 'Test User', email: 'test@example.com', id: 'test-id' };
}

describe('middleware', () => {
  beforeAll(() => {
    process.env.NEXTAUTH_SECRET = 'test-secret';
  });

  it('redirects unauthenticated users from protected route', async () => {
    (getToken as jest.Mock).mockResolvedValue(null);
    const req = createNextRequest('http://localhost/dashboard');
    const res = await middleware(req);
    expect(res.status).toBe(307); // Next.js uses 307 for redirects
    expect(res.headers.get('location')).toContain('/auth/signin');
  });

  it('allows authenticated users with access', async () => {
    (getToken as jest.Mock).mockResolvedValue(mockToken('admin'));
    const req = createNextRequest('http://localhost/dashboard');
    const res = await middleware(req);
    expect(res.headers.get('X-Frame-Options')).toBe('DENY');
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(res.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
  });

  it('denies access for authenticated users without permission', async () => {
    (getToken as jest.Mock).mockResolvedValue(mockToken('user'));
    const req = createNextRequest('http://localhost/admin');
    const res = await middleware(req);
    expect(res.status).toBe(307); // redirected to home with error param
    expect(res.headers.get('location')).toContain('/?error=unauthorized_access');
  });

  it('returns 401 for unauthenticated API access', async () => {
    (getToken as jest.Mock).mockResolvedValue(null);
    const req = createNextRequest('http://localhost/api/user/profile');
    const res = await middleware(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe('Authentication required');
  });

  it('returns 403 for authenticated API access without permission', async () => {
    (getToken as jest.Mock).mockResolvedValue(mockToken('user'));
    const req = createNextRequest('http://localhost/api/admin/stats');
    const res = await middleware(req);
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toBe('Access denied');
  });
});
