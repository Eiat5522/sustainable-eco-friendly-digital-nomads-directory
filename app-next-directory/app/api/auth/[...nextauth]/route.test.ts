/**
 * Jest Test Suite for NextAuth API Route
 * Tests covering:
 * 1. GET /api/auth/[...nextauth] - NextAuth GET handler
 * 2. POST /api/auth/[...nextauth] - NextAuth POST handler
 * 3. Request forwarding to NextAuth handlers
 */

import { jest } from '@jest/globals';
import { GET, POST } from './route';

// Mock NextAuth handlers
const mockAuthGET = jest.fn();
const mockAuthPOST = jest.fn();

jest.mock('@/lib/auth', () => ({
  GET: mockAuthGET,
  POST: mockAuthPOST,
}));

describe('NextAuth API Route - /api/auth/[...nextauth]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Suppress console logs during tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('GET Handler', () => {
    it('should forward GET requests to NextAuth GET handler', async () => {
      const mockResponse = new Response(JSON.stringify({ session: null }), {
        status: 200,
      });
      mockAuthGET.mockResolvedValueOnce(mockResponse);

      const request = new Request('http://localhost/api/auth/session');
      const response = await GET(request);

      expect(mockAuthGET).toHaveBeenCalledTimes(1);
      expect(mockAuthGET).toHaveBeenCalledWith(request);
      expect(response).toBe(mockResponse);
    });

    it('should log incoming GET requests with pathname', async () => {
      const mockResponse = new Response('{}', { status: 200 });
      mockAuthGET.mockResolvedValueOnce(mockResponse);
      const consoleSpy = jest.spyOn(console, 'log');

      const request = new Request('http://localhost/api/auth/signin');
      await GET(request);

      expect(consoleSpy).toHaveBeenCalledWith('[auth route] module loaded');
      expect(consoleSpy).toHaveBeenCalledWith(
        '[auth route] incoming GET',
        '/api/auth/signin'
      );
    });

    it('should handle GET requests without valid URL', async () => {
      const mockResponse = new Response('{}', { status: 200 });
      mockAuthGET.mockResolvedValueOnce(mockResponse);

      // Create a request that might have URL parsing issues
      const request = { url: null } as unknown as Request;
      await GET(request);

      expect(mockAuthGET).toHaveBeenCalled();
    });

    it('should forward all GET request parameters correctly', async () => {
      const mockResponse = new Response('{}', { status: 200 });
      mockAuthGET.mockResolvedValueOnce(mockResponse);

      const request = new Request(
        'http://localhost/api/auth/callback/credentials?token=abc123'
      );
      await GET(request);

      expect(mockAuthGET).toHaveBeenCalledWith(request);
    });

    it('should handle NextAuth GET handler errors', async () => {
      const errorResponse = new Response(
        JSON.stringify({ error: 'Authentication failed' }),
        { status: 401 }
      );
      mockAuthGET.mockResolvedValueOnce(errorResponse);

      const request = new Request('http://localhost/api/auth/session');
      const response = await GET(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Authentication failed');
    });

    it('should handle different NextAuth GET endpoints', async () => {
      const endpoints = [
        '/api/auth/session',
        '/api/auth/signin',
        '/api/auth/signout',
        '/api/auth/providers',
        '/api/auth/csrf',
      ];

      for (const endpoint of endpoints) {
        mockAuthGET.mockResolvedValueOnce(
          new Response('{}', { status: 200 })
        );

        const request = new Request(`http://localhost${endpoint}`);
        await GET(request);

        expect(mockAuthGET).toHaveBeenCalledWith(request);
        mockAuthGET.mockClear();
      }
    });
  });

  describe('POST Handler', () => {
    it('should forward POST requests to NextAuth POST handler', async () => {
      const mockResponse = new Response(
        JSON.stringify({ user: { id: '1', email: 'test@example.com' } }),
        { status: 200 }
      );
      mockAuthPOST.mockResolvedValueOnce(mockResponse);

      const request = new Request('http://localhost/api/auth/signin', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com', password: 'password' }),
      });
      const response = await POST(request);

      expect(mockAuthPOST).toHaveBeenCalledTimes(1);
      expect(mockAuthPOST).toHaveBeenCalledWith(request);
      expect(response).toBe(mockResponse);
    });

    it('should log incoming POST requests with pathname', async () => {
      const mockResponse = new Response('{}', { status: 200 });
      mockAuthPOST.mockResolvedValueOnce(mockResponse);
      const consoleSpy = jest.spyOn(console, 'log');

      const request = new Request('http://localhost/api/auth/callback/credentials', {
        method: 'POST',
        body: '{}',
      });
      await POST(request);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[auth route] incoming POST',
        '/api/auth/callback/credentials'
      );
    });

    it('should handle POST requests without valid URL', async () => {
      const mockResponse = new Response('{}', { status: 200 });
      mockAuthPOST.mockResolvedValueOnce(mockResponse);

      const request = { url: null, method: 'POST' } as unknown as Request;
      await POST(request);

      expect(mockAuthPOST).toHaveBeenCalled();
    });

    it('should forward POST body correctly', async () => {
      const mockResponse = new Response('{}', { status: 200 });
      mockAuthPOST.mockResolvedValueOnce(mockResponse);

      const credentials = {
        email: 'user@example.com',
        password: 'securePassword123',
      };
      const request = new Request('http://localhost/api/auth/callback/credentials', {
        method: 'POST',
        body: JSON.stringify(credentials),
        headers: { 'Content-Type': 'application/json' },
      });
      await POST(request);

      expect(mockAuthPOST).toHaveBeenCalledWith(request);
    });

    it('should handle NextAuth POST handler errors', async () => {
      const errorResponse = new Response(
        JSON.stringify({ error: 'Invalid credentials' }),
        { status: 401 }
      );
      mockAuthPOST.mockResolvedValueOnce(errorResponse);

      const request = new Request('http://localhost/api/auth/callback/credentials', {
        method: 'POST',
        body: JSON.stringify({ email: 'wrong@example.com', password: 'wrong' }),
      });
      const response = await POST(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Invalid credentials');
    });

    it('should handle different NextAuth POST endpoints', async () => {
      const endpoints = [
        '/api/auth/signin',
        '/api/auth/callback/credentials',
        '/api/auth/callback/google',
        '/api/auth/signout',
      ];

      for (const endpoint of endpoints) {
        mockAuthPOST.mockResolvedValueOnce(
          new Response('{}', { status: 200 })
        );

        const request = new Request(`http://localhost${endpoint}`, {
          method: 'POST',
          body: '{}',
        });
        await POST(request);

        expect(mockAuthPOST).toHaveBeenCalledWith(request);
        mockAuthPOST.mockClear();
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle errors during GET request logging', async () => {
      const mockResponse = new Response('{}', { status: 200 });
      mockAuthGET.mockResolvedValueOnce(mockResponse);
      const consoleErrorSpy = jest.spyOn(console, 'error');

      // Create a request with a URL that throws during parsing
      const request = {
        url: 'not-a-valid-url',
        get: jest.fn(),
      } as unknown as Request;

      await GET(request);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[auth route] GET error:',
        expect.any(Error)
      );
      expect(mockAuthGET).toHaveBeenCalled();
    });

    it('should handle errors during POST request logging', async () => {
      const mockResponse = new Response('{}', { status: 200 });
      mockAuthPOST.mockResolvedValueOnce(mockResponse);

      // Create a request with a URL that throws during parsing
      const request = {
        url: 'not-a-valid-url',
        method: 'POST',
        get: jest.fn(),
      } as unknown as Request;

      await POST(request);

      // Should still call the auth handler despite logging error
      expect(mockAuthPOST).toHaveBeenCalled();
    });

    it('should propagate NextAuth handler exceptions', async () => {
      mockAuthGET.mockRejectedValueOnce(new Error('NextAuth internal error'));

      const request = new Request('http://localhost/api/auth/session');

      await expect(GET(request)).rejects.toThrow('NextAuth internal error');
    });
  });

  describe('Request Type Casting', () => {
    it('should properly cast GET request parameter', async () => {
      const mockResponse = new Response('{}', { status: 200 });
      mockAuthGET.mockResolvedValueOnce(mockResponse);

      const request = new Request('http://localhost/api/auth/session');
      await GET(request);

      // Verify the request was passed to the auth handler
      expect(mockAuthGET).toHaveBeenCalledTimes(1);
      expect(mockAuthGET).toHaveBeenCalled();
    });

    it('should properly cast POST request parameter', async () => {
      const mockResponse = new Response('{}', { status: 200 });
      mockAuthPOST.mockResolvedValueOnce(mockResponse);

      const request = new Request('http://localhost/api/auth/signin', {
        method: 'POST',
      });
      await POST(request);

      // Verify the request was passed to the auth handler
      expect(mockAuthPOST).toHaveBeenCalledTimes(1);
      expect(mockAuthPOST).toHaveBeenCalled();
    });
  });
});
