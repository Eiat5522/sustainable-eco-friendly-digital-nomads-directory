import { jest } from '@jest/globals';
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

jest.mock('@/lib/logger');

import { structuredLogger } from '@/lib/logger';

type StructuredLogger = typeof import('@/lib/logger')['structuredLogger'];

const getStructuredLoggerMock = () =>
  jest.requireMock<typeof import('@/lib/logger')>('@/lib/logger')
    .structuredLogger as jest.Mocked<StructuredLogger>;

const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);

afterEach(() => {
  consoleWarnSpy.mockClear();
});

afterAll(() => {
  consoleWarnSpy.mockRestore();
});

// Mock dependencies
const mockGetToken = getToken as jest.MockedFunction<typeof getToken>;
const mockAuth = jest.fn();
const mockHasPagePermission = jest.fn();
const mockHasFeaturePermission = jest.fn();

jest.mock('@/lib/auth', () => ({
  __esModule: true,
  auth: mockAuth,
}));

import {
  getUserFromToken,
  withAuth,
  withAuthApiFeature,
  withAuthMatrix,
  withMinimumRole,
} from './withAuthMatrix';

describe('withAuthMatrix', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Clear mocks but preserve their structure
    mockGetToken.mockClear();
    mockAuth.mockClear();
    mockHasPagePermission.mockReset();
    mockHasFeaturePermission.mockReset();
    mockHasPagePermission.mockImplementation(() => true);
    mockHasFeaturePermission.mockImplementation(() => true);
    process.env = { ...originalEnv };
    process.env.NEXTAUTH_SECRET = 'test-secret';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('API route authentication', () => {
    it('returns 401 for unauthenticated API requests', async () => {
      mockGetToken.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/test');
      const response = await withAuthMatrix(
        request,
        null,
        null,
        true,
        undefined,
        mockHasPagePermission
      );

      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json.error).toBe('Authentication required');
      expect(json.code).toBe('AUTH_REQUIRED');
    });

    it('allows authenticated API requests without permission checks', async () => {
      mockGetToken.mockResolvedValue({ role: 'user', email: 'test@example.com' });

      const request = new NextRequest('http://localhost:3000/api/test');
      const response = await withAuthMatrix(
        request,
        null,
        null,
        true,
        undefined,
        mockHasPagePermission
      );

      expect(mockGetToken).toHaveBeenCalled();
      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).not.toBe(401);
    });

    it('returns 403 when user lacks required permission', async () => {
      mockGetToken.mockResolvedValue({ role: 'user', email: 'test@example.com' });
      mockHasPagePermission.mockReturnValue(false);

      const request = new NextRequest('http://localhost:3000/api/test');
      const response = await withAuthMatrix(
        request,
        'adminPanel' as any,
        'canView' as any,
        true,
        undefined,
        mockHasPagePermission
      );

      expect(mockHasPagePermission).toHaveBeenCalled();
      expect(response.status).toBe(403);
      const json = await response.json();
      expect(json.error).toBe('Insufficient permissions');
      expect(json.code).toBe('PERMISSION_DENIED');
    });

    it('allows API request when user has required permission', async () => {
      mockGetToken.mockResolvedValue({ role: 'admin', email: 'admin@example.com' });
      mockHasPagePermission.mockReturnValue(true);

      const request = new NextRequest('http://localhost:3000/api/test');
      const response = await withAuthMatrix(
        request,
        'adminPanel' as any,
        'canView' as any,
        true,
        undefined,
        mockHasPagePermission
      );

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).not.toBe(403);
    });
  });

  describe('page route authentication', () => {
    it('allows unauthenticated access to public pages', async () => {
      mockGetToken.mockResolvedValue(null);
      mockHasPagePermission.mockReturnValue(true);

      const request = new NextRequest('http://localhost:3000/');
      const response = await withAuthMatrix(
        request,
        'home' as any,
        'canView' as any,
        false,
        undefined,
        mockHasPagePermission
      );

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).not.toBe(401);
    });

    it('redirects to signin when user lacks permission', async () => {
      mockGetToken.mockResolvedValue(null);
      mockHasPagePermission.mockReturnValue(false);

      const request = new NextRequest('http://localhost:3000/admin');
      const response = await withAuthMatrix(
        request,
        'adminPanel' as any,
        'canView' as any,
        false,
        undefined,
        mockHasPagePermission
      );

      expect(response.status).toBe(307); // Redirect status
      const location = response.headers.get('location');
      expect(location).toContain('/auth/signin');
      expect(location).toContain('callbackUrl');
    });

    it('redirects to unauthorized when authenticated user lacks permission', async () => {
      mockGetToken.mockResolvedValue({ role: 'user', email: 'user@example.com' });
      mockHasPagePermission.mockReturnValue(false);

      const request = new NextRequest('http://localhost:3000/admin');
      const response = await withAuthMatrix(
        request,
        'adminPanel' as any,
        'canView' as any,
        false,
        undefined,
        mockHasPagePermission
      );

      expect(response.status).toBe(307);
      const location = response.headers.get('location');
      expect(location).toContain('/auth/unauthorized');
    });

    it('allows access when user has required permission', async () => {
      mockGetToken.mockResolvedValue({ role: 'admin', email: 'admin@example.com' });
      mockHasPagePermission.mockReturnValue(true);

      const request = new NextRequest('http://localhost:3000/admin');
      const response = await withAuthMatrix(
        request,
        'adminPanel' as any,
        'canView' as any,
        false,
        undefined,
        mockHasPagePermission
      );

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).not.toBe(307);
    });
  });

  describe('ownership-based permissions', () => {
    it('allows venue owners to manage their own listings', async () => {
      mockGetToken.mockResolvedValue({ role: 'venueOwner', email: 'owner@example.com' });
      mockHasPagePermission.mockReturnValue(false);

      const request = new NextRequest('http://localhost:3000/listings/edit/123');
      const response = await withAuthMatrix(
        request,
        'editListing' as any,
        'canEdit' as any,
        false,
        { userId: 'user123', resourceOwnerId: 'user123' },
        mockHasPagePermission
      );

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).not.toBe(307);
    });

    it('denies venue owners access to others listings', async () => {
      mockGetToken.mockResolvedValue({ role: 'venueOwner', email: 'owner@example.com' });
      mockHasPagePermission.mockClear();
      mockHasPagePermission.mockImplementation((role, page, action) => {
        // console.log('[TEST] mockHasPagePermission called with:', { role, page, action });
        return false;
      });

      const request = new NextRequest('http://localhost:3000/listings/edit/456');
      const response = await withAuthMatrix(
        request,
        'editListing' as any,
        'canEdit' as any,
        false,
        { userId: 'user123', resourceOwnerId: 'user456' },
        mockHasPagePermission
      );

      // console.log('[TEST] response.status:', response.status);
      // console.log('[TEST] mockHasPagePermission.mock.calls:', mockHasPagePermission.mock.calls);
      expect(response.status).toBe(307);
      const location = response.headers.get('location');
      expect(location).toContain('/auth/unauthorized');
    });
  });

  describe('without page/action checks', () => {
    it('allows authenticated users through when no checks specified', async () => {
      mockGetToken.mockResolvedValue({ role: 'user', email: 'user@example.com' });

      const request = new NextRequest('http://localhost:3000/profile');
      const response = await withAuthMatrix(
        request,
        null,
        null,
        false,
        undefined,
        mockHasPagePermission
      );

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).not.toBe(307);
    });

    it('allows unauthenticated users through when no checks specified', async () => {
      mockGetToken.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/');
      const response = await withAuthMatrix(
        request,
        null,
        null,
        false,
        undefined,
        mockHasPagePermission
      );

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).not.toBe(307);
    });
  });
});

describe('withAuthApiFeature', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXTAUTH_SECRET = 'test-secret';
  });

  it('returns 401 when no token is present', async () => {
    mockGetToken.mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/feature');
    const response = await withAuthApiFeature(
      request,
      'manageListings' as any,
      undefined,
      mockHasFeaturePermission
    );

    expect(response.status).toBe(401);
    const json = await response.json();
    expect(json.error).toBe('Authentication required');
  });

  it('returns 403 when user lacks required feature permission', async () => {
    mockGetToken.mockResolvedValue({ role: 'user', email: 'user@example.com' });
    mockHasFeaturePermission.mockImplementation(() => false);

    const request = new NextRequest('http://localhost:3000/api/feature');
    const response = await withAuthApiFeature(
      request,
      'manageUsers' as any,
      undefined,
      mockHasFeaturePermission
    );

    expect(response.status).toBe(403);
    const json = await response.json();
    expect(json.error).toBe('Insufficient permissions');
  });

  it('allows request when user has required feature permission', async () => {
    mockGetToken.mockResolvedValue({ role: 'admin', email: 'admin@example.com' });
    mockHasFeaturePermission.mockImplementation(() => true);

    const request = new NextRequest('http://localhost:3000/api/feature');
    const response = await withAuthApiFeature(
      request,
      'manageUsers' as any,
      undefined,
      mockHasFeaturePermission
    );

    expect(response).toBeInstanceOf(NextResponse);
    expect(response.status).not.toBe(403);
  });

  it('allows ownership-based permissions for own resources', async () => {
    mockGetToken.mockResolvedValue({ role: 'user', email: 'user@example.com' });
    mockHasFeaturePermission.mockReturnValue(false);

    const request = new NextRequest('http://localhost:3000/api/listings/123');
    const response = await withAuthApiFeature(
      request,
      'editOwnListings' as any,
      { userId: 'user123', resourceOwnerId: 'user123' },
      mockHasFeaturePermission
    );

    expect(response).toBeInstanceOf(NextResponse);
    expect(response.status).not.toBe(403);
  });

  it('denies ownership-based permissions for others resources', async () => {
    mockGetToken.mockResolvedValue({ role: 'user', email: 'user@example.com' });
    mockHasFeaturePermission.mockReturnValue(false);

    const request = new NextRequest('http://localhost:3000/api/listings/456');
    const response = await withAuthApiFeature(
      request,
      'editOwnListings' as any,
      { userId: 'user123', resourceOwnerId: 'user456' },
      mockHasFeaturePermission
    );

    expect(response.status).toBe(403);
  });
});

describe('withMinimumRole', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXTAUTH_SECRET = 'test-secret';
  });

  describe('API routes', () => {
    it('returns 401 when no token for API route', async () => {
      mockGetToken.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/admin');
      const response = await withMinimumRole(request, 'admin' as any, true);

      expect(response.status).toBe(401);
    });

    it('returns 403 when user role is insufficient for API route', async () => {
      mockGetToken.mockResolvedValue({ role: 'user' });

      const request = new NextRequest('http://localhost:3000/api/admin');
      const response = await withMinimumRole(request, 'admin' as any, true);

      expect(response.status).toBe(403);
      const json = await response.json();
      expect(json.error).toBe('Insufficient role level');
    });

    it('allows API request when user has minimum role', async () => {
      mockGetToken.mockResolvedValue({ role: 'admin' });

      const request = new NextRequest('http://localhost:3000/api/admin');
      const response = await withMinimumRole(request, 'user' as any, true);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).not.toBe(403);
    });
  });

  describe('page routes', () => {
    it('redirects to signin when no token and role required', async () => {
      mockGetToken.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/admin');
      const response = await withMinimumRole(request, 'admin' as any, false);

      expect(response.status).toBe(307);
      const location = response.headers.get('location');
      expect(location).toContain('/auth/signin');
    });

    it('allows unauthenticated access for public pages', async () => {
      mockGetToken.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/');
      const response = await withMinimumRole(request, 'user' as any, false);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).not.toBe(307);
    });

    it('redirects to unauthorized when user role is insufficient', async () => {
      mockGetToken.mockResolvedValue({ role: 'user' });

      const request = new NextRequest('http://localhost:3000/admin');
      const response = await withMinimumRole(request, 'admin' as any, false);

      expect(response.status).toBe(307);
      const location = response.headers.get('location');
      expect(location).toContain('/auth/unauthorized');
    });

    it('allows page access when user has minimum role', async () => {
      mockGetToken.mockResolvedValue({ role: 'admin' });

      const request = new NextRequest('http://localhost:3000/admin');
      const response = await withMinimumRole(request, 'user' as any, false);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).not.toBe(307);
    });
  });
});

describe('getUserFromToken', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXTAUTH_SECRET = 'test-secret';
  });

  it('returns null when no token is present', async () => {
    mockGetToken.mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/user');
    const result = await getUserFromToken(request);

    expect(result).toBeNull();
  });

  it('extracts user information from token', async () => {
    mockGetToken.mockResolvedValue({
      id: 'user123',
      email: 'test@example.com',
      name: 'Test User',
      role: 'user',
    });

    const request = new NextRequest('http://localhost:3000/api/user');
    const result = await getUserFromToken(request);

    expect(result).toEqual({
      id: 'user123',
      email: 'test@example.com',
      name: 'Test User',
      role: 'user',
      permissions: expect.any(Object),
    });
  });

  it('defaults to defaultUser role when role is missing', async () => {
    mockGetToken.mockResolvedValue({
      id: 'user123',
      email: 'test@example.com',
      name: 'Test User',
    });

    const request = new NextRequest('http://localhost:3000/api/user');
    const result = await getUserFromToken(request);

    expect(result?.role).toBe('defaultUser');
  });
});

describe('withAuth (legacy)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXTAUTH_SECRET = 'test-secret';
  });

  it('logs deprecation warning', async () => {
    const warnSpy = jest.spyOn(structuredLogger, 'warn');
    mockGetToken.mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/test');
    await withAuth(request);

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('deprecated'), expect.any(Object));
  });

  it('redirects when no session', async () => {
    mockGetToken.mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/test');
    const response = await withAuth(request);

    expect(response.status).toBe(307);
    const location = response.headers.get('location');
    expect(location).toContain('/auth/signin');
  });

  it('redirects when user role is not in required roles', async () => {
    mockGetToken.mockResolvedValue({ role: 'user' });

    const request = new NextRequest('http://localhost:3000/admin');
    const response = await withAuth(request, ['admin']);

    expect(response.status).toBe(307);
    const location = response.headers.get('location');
    expect(location).toContain('/auth/unauthorized');
  });

    it('allows access when user role is in required roles', async () => {
      mockGetToken.mockResolvedValue({ role: 'admin' });

      const request = new NextRequest('http://localhost:3000/admin');
      const response = await withAuth(request, ['admin', 'superAdmin']);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(200);
    });

  it('allows access when no required roles specified', async () => {
    mockGetToken.mockResolvedValue({ role: 'user' });

    const request = new NextRequest('http://localhost:3000/profile');
    const response = await withAuth(request);

    expect(response).toBeInstanceOf(NextResponse);
    expect(response.status).toBe(200);
  });
});
