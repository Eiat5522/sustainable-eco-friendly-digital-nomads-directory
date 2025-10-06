import { jest } from '@jest/globals';

// Mock dependencies
const mockGetToken = jest.fn();
const mockAuth = jest.fn();
const mockHasPagePermission = jest.fn();
const mockHasFeaturePermission = jest.fn();

// Mock NextRequest and NextResponse
class MockNextRequest {
  nextUrl: { pathname: string };
  url: string;
  
  constructor(url: string) {
    this.url = url;
    this.nextUrl = { pathname: new URL(url).pathname };
  }
}

class MockNextResponse {
  status: number;
  headers: Map<string, string>;
  body: any;

  constructor(body: any, init?: { status?: number; headers?: Record<string, string> }) {
    this.body = body;
    this.status = init?.status || 200;
    this.headers = new Map(Object.entries(init?.headers || {}));
  }

  static next() {
    return new MockNextResponse(null);
  }

  static redirect(url: URL | string) {
    return new MockNextResponse(null, {
      status: 307,
      headers: { location: url.toString() },
    });
  }

  async json() {
    return typeof this.body === 'string' ? JSON.parse(this.body) : this.body;
  }
}

jest.mock('next/server', () => ({
  NextRequest: MockNextRequest,
  NextResponse: MockNextResponse,
}));

jest.mock('next-auth/jwt', () => ({
  getToken: mockGetToken,
}));

jest.mock('@/lib/auth', () => ({
  auth: mockAuth,
}));

jest.mock('../../types/auth', () => ({
  hasPagePermission: mockHasPagePermission,
  hasFeaturePermission: mockHasFeaturePermission,
  ACCESS_CONTROL_MATRIX: {
    admin: { pages: {}, features: {} },
    user: { pages: {}, features: {} },
    unidentifiedUser: { pages: {}, features: {} },
  },
  ROLE_HIERARCHY: {
    unidentifiedUser: 0,
    defaultUser: 1,
    user: 2,
    venueOwner: 3,
    moderator: 4,
    admin: 5,
    superAdmin: 6,
  },
}));

import {
  withAuthMatrix,
  withAuthApiFeature,
  withMinimumRole,
  getUserFromToken,
  withAuth,
} from './withAuthMatrix';

const NextRequest = MockNextRequest as any;
const NextResponse = MockNextResponse as any;

describe('withAuthMatrix', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
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
      const response = await withAuthMatrix(request, null, null, true);

      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json.error).toBe('Authentication required');
      expect(json.code).toBe('AUTH_REQUIRED');
    });

    it('allows authenticated API requests without permission checks', async () => {
      mockGetToken.mockResolvedValue({ role: 'user', email: 'test@example.com' });

      const request = new NextRequest('http://localhost:3000/api/test');
      const response = await withAuthMatrix(request, null, null, true);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).not.toBe(401);
    });

    it('returns 403 when user lacks required permission', async () => {
      mockGetToken.mockResolvedValue({ role: 'user', email: 'test@example.com' });
      mockHasPagePermission.mockReturnValue(false);

      const request = new NextRequest('http://localhost:3000/api/test');
      const response = await withAuthMatrix(request, 'adminPanel' as any, 'canView' as any, true);

      expect(response.status).toBe(403);
      const json = await response.json();
      expect(json.error).toBe('Insufficient permissions');
      expect(json.code).toBe('PERMISSION_DENIED');
    });

    it('allows API request when user has required permission', async () => {
      mockGetToken.mockResolvedValue({ role: 'admin', email: 'admin@example.com' });
      mockHasPagePermission.mockReturnValue(true);

      const request = new NextRequest('http://localhost:3000/api/test');
      const response = await withAuthMatrix(request, 'adminPanel' as any, 'canView' as any, true);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).not.toBe(403);
    });
  });

  describe('page route authentication', () => {
    it('allows unauthenticated access to public pages', async () => {
      mockGetToken.mockResolvedValue(null);
      mockHasPagePermission.mockReturnValue(true);

      const request = new NextRequest('http://localhost:3000/');
      const response = await withAuthMatrix(request, 'home' as any, 'canView' as any, false);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).not.toBe(401);
    });

    it('redirects to signin when user lacks permission', async () => {
      mockGetToken.mockResolvedValue(null);
      mockHasPagePermission.mockReturnValue(false);

      const request = new NextRequest('http://localhost:3000/admin');
      const response = await withAuthMatrix(request, 'adminPanel' as any, 'canView' as any, false);

      expect(response.status).toBe(307); // Redirect status
      const location = response.headers.get('location');
      expect(location).toContain('/auth/signin');
      expect(location).toContain('callbackUrl');
    });

    it('redirects to unauthorized when authenticated user lacks permission', async () => {
      mockGetToken.mockResolvedValue({ role: 'user', email: 'user@example.com' });
      mockHasPagePermission.mockReturnValue(false);

      const request = new NextRequest('http://localhost:3000/admin');
      const response = await withAuthMatrix(request, 'adminPanel' as any, 'canView' as any, false);

      expect(response.status).toBe(307);
      const location = response.headers.get('location');
      expect(location).toContain('/auth/unauthorized');
    });

    it('allows access when user has required permission', async () => {
      mockGetToken.mockResolvedValue({ role: 'admin', email: 'admin@example.com' });
      mockHasPagePermission.mockReturnValue(true);

      const request = new NextRequest('http://localhost:3000/admin');
      const response = await withAuthMatrix(request, 'adminPanel' as any, 'canView' as any, false);

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
        { userId: 'user123', resourceOwnerId: 'user123' }
      );

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).not.toBe(307);
    });

    it('denies venue owners access to others listings', async () => {
      mockGetToken.mockResolvedValue({ role: 'venueOwner', email: 'owner@example.com' });
      mockHasPagePermission.mockReturnValue(false);

      const request = new NextRequest('http://localhost:3000/listings/edit/456');
      const response = await withAuthMatrix(
        request,
        'editListing' as any,
        'canEdit' as any,
        false,
        { userId: 'user123', resourceOwnerId: 'user456' }
      );

      expect(response.status).toBe(307);
      const location = response.headers.get('location');
      expect(location).toContain('/auth/unauthorized');
    });
  });

  describe('without page/action checks', () => {
    it('allows authenticated users through when no checks specified', async () => {
      mockGetToken.mockResolvedValue({ role: 'user', email: 'user@example.com' });

      const request = new NextRequest('http://localhost:3000/profile');
      const response = await withAuthMatrix(request, null, null, false);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).not.toBe(307);
    });

    it('allows unauthenticated users through when no checks specified', async () => {
      mockGetToken.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/');
      const response = await withAuthMatrix(request, null, null, false);

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
    const response = await withAuthApiFeature(request, 'manageListings' as any);

    expect(response.status).toBe(401);
    const json = await response.json();
    expect(json.error).toBe('Authentication required');
  });

  it('returns 403 when user lacks required feature permission', async () => {
    mockGetToken.mockResolvedValue({ role: 'user', email: 'user@example.com' });
    mockHasFeaturePermission.mockReturnValue(false);

    const request = new NextRequest('http://localhost:3000/api/feature');
    const response = await withAuthApiFeature(request, 'manageUsers' as any);

    expect(response.status).toBe(403);
    const json = await response.json();
    expect(json.error).toBe('Insufficient permissions');
  });

  it('allows request when user has required feature permission', async () => {
    mockGetToken.mockResolvedValue({ role: 'admin', email: 'admin@example.com' });
    mockHasFeaturePermission.mockReturnValue(true);

    const request = new NextRequest('http://localhost:3000/api/feature');
    const response = await withAuthApiFeature(request, 'manageUsers' as any);

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
      { userId: 'user123', resourceOwnerId: 'user123' }
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
      { userId: 'user123', resourceOwnerId: 'user456' }
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
      const response = await withMinimumRole(request, 'moderator' as any, true);

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

    it('allows unauthenticated access for unidentifiedUser role', async () => {
      mockGetToken.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/');
      const response = await withMinimumRole(request, 'unidentifiedUser' as any, false);

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
  });

  it('logs deprecation warning', async () => {
    const consoleWarn = jest.spyOn(console, 'warn').mockImplementation();
    mockAuth.mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/test');
    await withAuth(request);

    expect(consoleWarn).toHaveBeenCalledWith(
      expect.stringContaining('deprecated')
    );
    consoleWarn.mockRestore();
  });

  it('redirects when no session', async () => {
    mockAuth.mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/test');
    const response = await withAuth(request);

    expect(response.status).toBe(307);
    const location = response.headers.get('location');
    expect(location).toContain('/auth/signin');
  });

  it('redirects when user role is not in required roles', async () => {
    mockAuth.mockResolvedValue({
      user: { role: 'user' },
    });

    const request = new NextRequest('http://localhost:3000/admin');
    const response = await withAuth(request, ['admin']);

    expect(response.status).toBe(307);
    const location = response.headers.get('location');
    expect(location).toContain('/auth/unauthorized');
  });

  it('allows access when user role is in required roles', async () => {
    mockAuth.mockResolvedValue({
      user: { role: 'admin' },
    });

    const request = new NextRequest('http://localhost:3000/admin');
    const response = await withAuth(request, ['admin', 'moderator']);

    expect(response).toBeInstanceOf(NextResponse);
    expect(response.status).not.toBe(307);
  });

  it('allows access when no required roles specified', async () => {
    mockAuth.mockResolvedValue({
      user: { role: 'user' },
    });

    const request = new NextRequest('http://localhost:3000/profile');
    const response = await withAuth(request);

    expect(response).toBeInstanceOf(NextResponse);
    expect(response.status).not.toBe(307);
  });
});
