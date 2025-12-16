import { jest } from '@jest/globals';
import type { FeaturePermissions } from '@/types/auth';

type MiddlewareRequest = Parameters<ReturnType<typeof import('../index').createMiddleware>>[0];

type HeadersWithStore = {
  store: Map<string, string>;
  set: jest.Mock;
  append: jest.Mock;
};

type MockResponse = {
  headers: HeadersWithStore;
};

const createHeaders = (): HeadersWithStore => {
  const store = new Map<string, string>();
  return {
    store,
    set: jest.fn((key: string, value: string) => {
      store.set(key, value);
    }),
    append: jest.fn(),
  };
};

const createResponse = (): MockResponse => ({ headers: createHeaders() });

const nextMock = jest.fn();
const redirectMock = jest.fn();
const jsonMock = jest.fn();

jest.mock('next/server', () => ({
  NextResponse: {
    next: nextMock,
    redirect: redirectMock,
    json: jsonMock,
  },
}));

const middlewareErrorMock = jest.fn();
const getRequestContextMock = jest.fn(() => ({ traceId: 'trace-id' }));

jest.mock('@/lib/logger', () => ({
  structuredLogger: { middlewareError: middlewareErrorMock },
  getRequestContext: getRequestContextMock,
}));

jest.mock('@/lib/auth', () => ({
  auth: jest.fn(() => 'mock-auth-middleware'),
}));

const makePermissions = (canView: boolean) => ({
  canView,
  canCreate: false,
  canEdit: false,
  canDelete: false,
  canManage: false,
});

const sharedFeatures = {} as FeaturePermissions;

const matrix = {
  user: {
    pages: {
      home: makePermissions(true),
      listings: makePermissions(true),
      listingDetail: makePermissions(true),
      createListing: makePermissions(false),
      editListing: makePermissions(false),
      manageListing: makePermissions(false),
      reviews: makePermissions(true),
      profile: makePermissions(true),
      admin: makePermissions(false),
      analytics: makePermissions(false),
      settings: makePermissions(true),
      contact: makePermissions(true),
      about: makePermissions(true),
      blog: makePermissions(true),
    },
    features: sharedFeatures,
  },
  admin: {
    pages: {
      home: makePermissions(true),
      listings: makePermissions(true),
      listingDetail: makePermissions(true),
      createListing: makePermissions(true),
      editListing: makePermissions(true),
      manageListing: makePermissions(true),
      reviews: makePermissions(true),
      profile: makePermissions(true),
      admin: makePermissions(true),
      analytics: makePermissions(true),
      settings: makePermissions(true),
      contact: makePermissions(true),
      about: makePermissions(true),
      blog: makePermissions(true),
    },
    features: sharedFeatures,
  },
} as const;

jest.mock('@/types/auth', () => ({
  __esModule: true,
  ACCESS_CONTROL_MATRIX: matrix,
}));

let createMiddleware: typeof import('../index').createMiddleware;

const buildRequest = (pathname: string): MiddlewareRequest => {
  const url = new URL(`https://example.com${pathname}`);
  return {
    nextUrl: {
      pathname,
      origin: url.origin,
      searchParams: url.searchParams,
    },
    url: url.toString(),
    method: 'GET',
    headers: new Map(),
  };
};

const getHeader = (response: MockResponse, name: string) => response.headers.store.get(name);

beforeAll(async () => {
  process.env.NEXTAUTH_SECRET = 'test-secret';
  const mod = await import('../index');
  createMiddleware = mod.createMiddleware;
});

beforeEach(() => {
  nextMock.mockImplementation(() => createResponse());
  redirectMock.mockImplementation(() => createResponse());
  jsonMock.mockImplementation(() => createResponse());
  nextMock.mockClear();
  redirectMock.mockClear();
  jsonMock.mockClear();
  middlewareErrorMock.mockClear();
  getRequestContextMock.mockClear();
});

describe('createMiddleware', () => {
  it('bypasses Next.js internals without adding security headers', async () => {
    const getToken = jest.fn().mockResolvedValue(null);
    const middleware = createMiddleware({
      getToken,
      NextResponse: { next: nextMock, redirect: redirectMock, json: jsonMock },
    });
    const response = (await middleware(buildRequest('/_next/static/chunk.js'))) as MockResponse;

    expect(nextMock).toHaveBeenCalledTimes(1);
    expect(response.headers.set).not.toHaveBeenCalled();
  });

  it('redirects authenticated users away from auth pages with security headers', async () => {
    const getToken = jest.fn().mockResolvedValue({ role: 'user' });
    const middleware = createMiddleware({
      getToken,
      NextResponse: { next: nextMock, redirect: redirectMock, json: jsonMock },
    });
    const response = (await middleware(buildRequest('/auth/login'))) as MockResponse;

    expect(redirectMock).toHaveBeenCalledTimes(1);
    const redirectTarget = redirectMock.mock.calls[0][0] as URL;
    expect(redirectTarget.toString()).toBe('https://example.com/dashboard');
    expect(getHeader(response, 'X-Frame-Options')).toBe('DENY');
    expect(getHeader(response, 'X-Content-Type-Options')).toBe('nosniff');
    expect(getHeader(response, 'Referrer-Policy')).toBe('strict-origin-when-cross-origin');
  });

  it('redirects unauthenticated users on protected routes to signin with callback', async () => {
    const getToken = jest.fn().mockResolvedValue(null);
    const middleware = createMiddleware({
      getToken,
      NextResponse: { next: nextMock, redirect: redirectMock, json: jsonMock },
    });
    const response = (await middleware(buildRequest('/dashboard'))) as MockResponse;

    expect(redirectMock).toHaveBeenCalledTimes(1);
    const signinUrl = redirectMock.mock.calls[0][0] as URL;
    expect(signinUrl.toString()).toBe('https://example.com/auth/login?callbackUrl=%2Fdashboard');
    expect(getHeader(response, 'X-Frame-Options')).toBe('DENY');
  });

  it('denies API access when authenticated user lacks permissions', async () => {
    const getToken = jest.fn().mockResolvedValue({ role: 'user' });
    const middleware = createMiddleware({
      getToken,
      NextResponse: { next: nextMock, redirect: redirectMock, json: jsonMock },
    });
    const response = (await middleware(buildRequest('/api/admin/reports'))) as MockResponse;

    expect(jsonMock).toHaveBeenCalledTimes(1);
    expect(jsonMock.mock.calls[0][1]).toEqual({ status: 403 });
    expect(getHeader(response, 'X-Frame-Options')).toBe('DENY');
  });

  it('allows authorized admin access to protected pages', async () => {
    const getToken = jest.fn().mockResolvedValue({ role: 'admin' });
    const middleware = createMiddleware({
      getToken,
      NextResponse: { next: nextMock, redirect: redirectMock, json: jsonMock },
    });
    const response = (await middleware(buildRequest('/admin/panel'))) as MockResponse;

    expect(nextMock).toHaveBeenCalledTimes(1);
    expect(getHeader(response, 'X-Frame-Options')).toBe('DENY');
  });

  it('returns authentication required for protected API routes', async () => {
    const getToken = jest.fn().mockResolvedValue(null);
    const middleware = createMiddleware({
      getToken,
      NextResponse: { next: nextMock, redirect: redirectMock, json: jsonMock },
    });
    const response = (await middleware(buildRequest('/api/admin/users'))) as MockResponse;

    expect(jsonMock).toHaveBeenCalledTimes(1);
    expect(jsonMock.mock.calls[0][1]).toEqual({ status: 401 });
    expect(getHeader(response, 'X-Frame-Options')).toBe('DENY');
  });

  it('logs errors and falls back to allowing the request with security headers', async () => {
    const error = new Error('boom');
    const getToken = jest.fn().mockRejectedValue(error);
    const middleware = createMiddleware({
      getToken,
      NextResponse: { next: nextMock, redirect: redirectMock, json: jsonMock },
    });
    const response = (await middleware(buildRequest('/somewhere'))) as MockResponse;

    expect(middlewareErrorMock).toHaveBeenCalledWith('main-middleware', error, {
      traceId: 'trace-id',
      pathname: '/somewhere',
    });
    expect(nextMock).toHaveBeenCalledTimes(1);
    expect(getHeader(response, 'X-Frame-Options')).toBe('DENY');
  });

  it('redirects authenticated users without page access to home with error flag', async () => {
    const getToken = jest.fn().mockResolvedValue({ role: 'user' });
    const middleware = createMiddleware({
      getToken,
      NextResponse: { next: nextMock, redirect: redirectMock, json: jsonMock },
    });
    const response = (await middleware(buildRequest('/listings/create'))) as MockResponse;

    expect(redirectMock).toHaveBeenCalledTimes(1);
    const homeUrl = redirectMock.mock.calls[0][0] as URL;
    expect(homeUrl.toString()).toBe('https://example.com/?error=unauthorized_access');
    expect(getHeader(response, 'X-Frame-Options')).toBe('DENY');
  });
});
