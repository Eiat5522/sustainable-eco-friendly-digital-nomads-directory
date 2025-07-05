import { jest } from '@jest/globals';
// Update getToken type to allow null and token objects
import { getToken } from 'next-auth/jwt';
import { createMiddleware } from './middleware';

type MockToken = { role?: string; email?: string } | null;
// Mock next-auth/jwt
jest.mock('next-auth/jwt');

// Update NextResponse mock to match Next.js API (static methods on function)
const createMockResponse = (type: 'next' | 'redirect' | 'json') => ({
  headers: {
    set: jest.fn(),
  },
  type,
  url: 'http://localhost:3000',
  pathname: '',
  search: '',
});

const mockNextResponse = {
  next: jest.fn(() => createMockResponse('next')),
  redirect: jest.fn(() => createMockResponse('redirect')),
  json: jest.fn(() => createMockResponse('json')),
};

// Export NextResponse as a function with static methods (to match Next.js API)
jest.mock('next/server', () => ({
  NextResponse: mockNextResponse,
}));

// Add a local type for NextRequest for testing
type NextRequest = {
  nextUrl: {
    pathname: string;
    searchParams: URLSearchParams;
    origin: string;
  };
  headers: Headers;
};

describe('Middleware', () => {
  let middleware: ReturnType<typeof createMiddleware>;

  beforeEach(() => {
    jest.clearAllMocks();
    (mockNextResponse.next as jest.Mock).mockImplementation(() => createMockResponse('next'));
    (mockNextResponse.redirect as jest.Mock).mockImplementation(() => createMockResponse('redirect'));
    (mockNextResponse.json as jest.Mock).mockImplementation(() => createMockResponse('json'));
    middleware = createMiddleware({
      getToken,
      NextResponse: mockNextResponse
    });
  });

  it('should allow access to public routes without authentication', async () => {
    const mockRequest = {
      nextUrl: {
        pathname: '/',
        searchParams: new URLSearchParams(),
        origin: 'http://localhost:3000',
      },
      headers: new Headers(),
    } as NextRequest;

    (getToken as jest.Mock<any>).mockResolvedValue(null);

    const response = await middleware(mockRequest);

    expect(mockNextResponse.next).toHaveBeenCalled();
    expect(mockNextResponse.redirect).not.toHaveBeenCalled();
  });

  it('should redirect unauthenticated users from protected routes', async () => {
    const mockRequest = {
      nextUrl: {
        pathname: '/admin',
        searchParams: new URLSearchParams(),
        origin: 'http://localhost:3000',
      },
      headers: new Headers(),
    } as NextRequest;

    (getToken as jest.Mock<any>).mockResolvedValue(null as MockToken);

    const response = await middleware(mockRequest);

    expect(mockNextResponse.redirect).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: '/auth/signin',
        search: expect.stringContaining('callbackUrl=%2Fadmin'),
      })
    );
  });

  it('should allow authenticated users with correct role to access protected routes', async () => {
    const mockRequest = {
      nextUrl: {
        pathname: '/admin',
        searchParams: new URLSearchParams(),
        origin: 'http://localhost:3000',
      },
      headers: new Headers(),
    } as NextRequest;

    (getToken as jest.Mock<any>).mockResolvedValue({
      role: 'admin',
      email: 'admin@example.com',
    });

    const response = await middleware(mockRequest);

    expect(mockNextResponse.next).toHaveBeenCalled();
    expect(mockNextResponse.redirect).not.toHaveBeenCalled();
  });

  it('should redirect authenticated users without correct role from protected routes', async () => {
    const mockRequest = {
      nextUrl: {
        pathname: '/admin',
        searchParams: new URLSearchParams(),
        origin: 'http://localhost:3000',
      },
      headers: new Headers(),
    } as NextRequest;

    (getToken as jest.Mock<any>).mockResolvedValue({
      role: 'user',
      email: 'user@example.com',
    } as MockToken);

    const response = await middleware(mockRequest);

    expect(mockNextResponse.redirect).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: '/',
        search: expect.stringContaining('error=unauthorized_access'),
      })
    );
  });

  it('should allow venue owners to access venue management routes', async () => {
    const mockRequest = {
      nextUrl: {
        pathname: '/venue/manage',
        searchParams: new URLSearchParams(),
        origin: 'http://localhost:3000',
      },
      headers: new Headers(),
    } as NextRequest;

    (getToken as jest.Mock<any>).mockResolvedValue({
      role: 'venueOwner',
      email: 'venue@example.com',
    } as MockToken);

    const response = await middleware(mockRequest);

    expect(mockNextResponse.next).toHaveBeenCalled();
    expect(mockNextResponse.redirect).not.toHaveBeenCalled();
  });

  it('should redirect from auth pages when already authenticated', async () => {
    const mockRequest = {
      nextUrl: {
        pathname: '/login',
        searchParams: new URLSearchParams(),
        origin: 'http://localhost:3000',
      },
      headers: new Headers(),
    } as NextRequest;

    (getToken as jest.Mock<any>).mockResolvedValue({
      role: 'user',
      email: 'user@example.com',
    } as MockToken);

    const response = await middleware(mockRequest);

    expect(mockNextResponse.redirect).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: '/dashboard',
      })
    );
  });
});
