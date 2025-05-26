import { jest } from '@jest/globals';
import { getToken } from 'next-auth/jwt';
import { NextRequest } from 'next/server';
import { middleware } from '../middleware';

// Mock next-auth/jwt
jest.mock('next-auth/jwt');

// Mock NextResponse
const mockNextResponse = {
  next: jest.fn(),
  redirect: jest.fn(),
  json: jest.fn(),
};

jest.mock('next/server', () => ({
  NextResponse: mockNextResponse,
}));

describe('Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (mockNextResponse.next as jest.Mock).mockReturnValue('mocked-next-response');
    (mockNextResponse.redirect as jest.Mock).mockReturnValue('mocked-redirect-response');
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

    (getToken as jest.Mock).mockResolvedValue(null);

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

    (getToken as jest.Mock).mockResolvedValue(null);

    const response = await middleware(mockRequest);

    expect(mockNextResponse.redirect).toHaveBeenCalledWith(
      new URL('/login?from=/admin', 'http://localhost:3000')
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

    (getToken as jest.Mock).mockResolvedValue({
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

    (getToken as jest.Mock).mockResolvedValue({
      role: 'user',
      email: 'user@example.com',
    });

    const response = await middleware(mockRequest);

    expect(mockNextResponse.redirect).toHaveBeenCalledWith(
      new URL('/unauthorized', 'http://localhost:3000')
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

    (getToken as jest.Mock).mockResolvedValue({
      role: 'venueOwner',
      email: 'venue@example.com',
    });

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

    (getToken as jest.Mock).mockResolvedValue({
      role: 'user',
      email: 'user@example.com',
    });

    const response = await middleware(mockRequest);

    expect(mockNextResponse.redirect).toHaveBeenCalledWith(
      new URL('/', 'http://localhost:3000')
    );
  });
});
