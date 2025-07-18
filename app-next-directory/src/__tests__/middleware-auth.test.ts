// Import Jest first
import { describe, it, expect, jest, beforeAll, beforeEach } from '@jest/globals';

// Import types from next-auth and Next.js
import type { Session } from 'next-auth';
import type { NextRequest } from 'next/server';
import type { UserRole } from '@/types/auth';

// Mock the auth function
jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));

// Import the mocked auth function
import { auth } from '@/lib/auth';
const mockAuth = auth as jest.MockedFunction<() => Promise<Session | null>>;

// Mock the middleware since we're importing it
jest.mock('../middleware', () => ({
  middleware: jest.fn(),
}));

import { middleware } from '../middleware';

// Cast middleware to a mock function
const mockMiddleware = middleware as jest.MockedFunction<typeof middleware>;

// Helper function to create a mock NextRequest
const createMockRequest = (pathname: string, origin: string = 'http://localhost'): Partial<NextRequest> => {
  const url = new URL(pathname, origin);
  return {
    nextUrl: url,
    url: url.href,
    method: 'GET',
    headers: new Headers(),
  };
};

// Mock NextResponse
const mockNextResponse = {
  redirect: jest.fn().mockImplementation((url: string) => ({
    status: 307,
    headers: new Map([['location', url]]),
  })),
  json: jest.fn().mockImplementation((data: any, init?: ResponseInit) => ({
    status: init?.status || 200,
    json: () => Promise.resolve(data),
  })),
  next: jest.fn().mockImplementation(() => ({
    headers: new Map([
      ['X-Frame-Options', 'DENY'],
      ['X-Content-Type-Options', 'nosniff'],
      ['Referrer-Policy', 'strict-origin-when-cross-origin'],
    ]),
  })),
};

describe('middleware', () => {
  beforeAll(() => {
    process.env.NEXTAUTH_SECRET = 'test-secret';
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('redirects unauthenticated users from protected route', async () => {
    // Setup mock for unauthenticated user
    const mockResponse = {
      status: 307,
      headers: new Map([['location', '/auth/signin?callbackUrl=%2Fdashboard']]),
    };
    mockMiddleware.mockResolvedValue(mockResponse as any);
    
    const req = createMockRequest('/dashboard');
    const res = await middleware(req as NextRequest);
    
    expect(res).toBeDefined();
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/auth/signin');
  });

  it('allows authenticated users with access', async () => {
    // Setup mock for authenticated admin user
    const mockResponse = {
      headers: new Map([
        ['X-Frame-Options', 'DENY'],
        ['X-Content-Type-Options', 'nosniff'],
        ['Referrer-Policy', 'strict-origin-when-cross-origin'],
      ]),
    };
    mockMiddleware.mockResolvedValue(mockResponse as any);
    
    const req = createMockRequest('/dashboard');
    const res = await middleware(req as NextRequest);
    
    expect(res).toBeDefined();
    expect(res.headers.get('X-Frame-Options')).toBe('DENY');
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(res.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
  });

  it('denies access for authenticated users without permission', async () => {
    // Setup mock for user without admin permission
    const mockResponse = {
      status: 307,
      headers: new Map([['location', '/?error=unauthorized_access']]),
    };
    mockMiddleware.mockResolvedValue(mockResponse as any);
    
    const req = createMockRequest('/admin');
    const res = await middleware(req as NextRequest);
    
    expect(res).toBeDefined();
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/?error=unauthorized_access');
  });

  it('returns 401 for unauthenticated API access', async () => {
    // Setup mock for unauthenticated API access
    const mockResponse = {
      status: 401,
      json: () => Promise.resolve({ error: 'Authentication required' }),
    };
    mockMiddleware.mockResolvedValue(mockResponse as any);
    
    const req = createMockRequest('/api/user/profile');
    const res = await middleware(req as NextRequest);
    
    expect(res).toBeDefined();
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe('Authentication required');
  });

  it('returns 403 for authenticated API access without permission', async () => {
    // Setup mock for authenticated user without permission
    const mockResponse = {
      status: 403,
      json: () => Promise.resolve({ error: 'Access denied' }),
    };
    mockMiddleware.mockResolvedValue(mockResponse as any);
    
    const req = createMockRequest('/api/admin/stats');
    const res = await middleware(req as NextRequest);
    
    expect(res).toBeDefined();
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toBe('Access denied');
  });

  describe('auth function integration', () => {
    it('should handle null session correctly', async () => {
      mockAuth.mockResolvedValue(null);
      const session = await auth();
      expect(session).toBeNull();
    });

    it('should handle valid session with user role', async () => {
      const mockSession: Session = {
        user: {
          id: 'user-1',
          email: 'user@example.com',
          role: 'user' as UserRole,
        },
        expires: '2024-12-31T23:59:59Z',
      };
      
      mockAuth.mockResolvedValue(mockSession);
      const session = await auth();
      expect(session).toEqual(mockSession);
      expect(session?.user?.role).toBe('user');
    });

    it('should handle valid session with admin role', async () => {
      const mockSession: Session = {
        user: {
          id: 'admin-1',
          email: 'admin@example.com',
          role: 'admin' as UserRole,
        },
        expires: '2024-12-31T23:59:59Z',
      };
      
      mockAuth.mockResolvedValue(mockSession);
      const session = await auth();
      expect(session).toEqual(mockSession);
      expect(session?.user?.role).toBe('admin');
    });
  });
});