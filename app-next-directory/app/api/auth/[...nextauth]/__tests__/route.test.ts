import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock the auth library before importing the route
const mockAuthGET = jest.fn();
const mockAuthPOST = jest.fn();

jest.mock('@/lib/auth', () => ({
  __esModule: true,
  GET: mockAuthGET,
  POST: mockAuthPOST,
}));

// Import after mocking
import { GET, POST } from '../route';

describe('NextAuth Route Handler', () => {
  let consoleLogSpy: jest.SpiedFunction<typeof console.log>;
  let consoleErrorSpy: jest.SpiedFunction<typeof console.error>;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Set default mock responses
    mockAuthGET.mockResolvedValue(new Response('OK', { status: 200 }));
    mockAuthPOST.mockResolvedValue(new Response('OK', { status: 200 }));
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('GET handler', () => {
    it('should forward GET requests to NextAuth', async () => {
      const mockResponse = new Response('OK', { status: 200 });
      mockAuthGET.mockResolvedValue(mockResponse);

      const request = new Request('https://example.com/api/auth/signin', {
        method: 'GET',
      });

      const response = await GET(request);

      expect(mockAuthGET).toHaveBeenCalledWith(request);
      expect(response).toBe(mockResponse);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[auth route] incoming GET',
        '/api/auth/signin'
      );
    });

    it('should handle GET requests with complex URLs', async () => {
      const mockResponse = new Response('OK', { status: 200 });
      mockAuthGET.mockResolvedValue(mockResponse);

      const request = new Request(
        'https://example.com/api/auth/callback/google?code=123',
        {
          method: 'GET',
        }
      );

      const response = await GET(request);

      expect(mockAuthGET).toHaveBeenCalledWith(request);
      expect(response).toBe(mockResponse);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[auth route] incoming GET',
        '/api/auth/callback/google'
      );
    });

    it('should handle errors during URL parsing', async () => {
      const mockResponse = new Response('OK', { status: 200 });
      mockAuthGET.mockResolvedValue(mockResponse);

      // Create a request with an invalid URL property
      const request = {
        url: 'not-a-valid-url',
      } as Request;

      const response = await GET(request);

      expect(mockAuthGET).toHaveBeenCalledWith(request);
      expect(response).toBe(mockResponse);
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith('[auth route] incoming GET');
    });

    it('should pass through NextAuth response unchanged', async () => {
      const mockResponse = new Response(
        JSON.stringify({ user: { id: '123' } }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
      mockAuthGET.mockResolvedValue(mockResponse);

      const request = new Request('https://example.com/api/auth/session', {
        method: 'GET',
      });

      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/json');
    });

    it('should handle NextAuth errors', async () => {
      mockAuthGET.mockRejectedValue(new Error('NextAuth error'));

      const request = new Request('https://example.com/api/auth/signin', {
        method: 'GET',
      });

      await expect(GET(request)).rejects.toThrow('NextAuth error');
    });
  });

  describe('POST handler', () => {
    it('should forward POST requests to NextAuth', async () => {
      const mockResponse = new Response('OK', { status: 200 });
      mockAuthPOST.mockResolvedValue(mockResponse);

      const request = new Request('https://example.com/api/auth/signin', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com', password: 'pass' }),
      });

      const response = await POST(request);

      expect(mockAuthPOST).toHaveBeenCalledWith(request);
      expect(response).toBe(mockResponse);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[auth route] incoming POST',
        '/api/auth/signin'
      );
    });

    it('should handle POST requests with callback URLs', async () => {
      const mockResponse = new Response('OK', { status: 200 });
      mockAuthPOST.mockResolvedValue(mockResponse);

      const request = new Request(
        'https://example.com/api/auth/callback/credentials',
        {
          method: 'POST',
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'password',
          }),
        }
      );

      const response = await POST(request);

      expect(mockAuthPOST).toHaveBeenCalledWith(request);
      expect(response).toBe(mockResponse);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[auth route] incoming POST',
        '/api/auth/callback/credentials'
      );
    });

    it('should handle errors during URL parsing in POST', async () => {
      const mockResponse = new Response('OK', { status: 200 });
      mockAuthPOST.mockResolvedValue(mockResponse);

      // Create a request with an invalid URL property
      const request = {
        url: 'invalid-url-format',
        method: 'POST',
      } as Request;

      const response = await POST(request);

      expect(mockAuthPOST).toHaveBeenCalledWith(request);
      expect(response).toBe(mockResponse);
      expect(consoleLogSpy).toHaveBeenCalledWith('[auth route] incoming POST');
    });

    it('should pass through NextAuth POST response unchanged', async () => {
      const mockResponse = new Response(
        JSON.stringify({ url: '/dashboard' }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
      mockAuthPOST.mockResolvedValue(mockResponse);

      const request = new Request('https://example.com/api/auth/signin', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com', password: 'pass' }),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/json');
    });

    it('should handle NextAuth POST errors', async () => {
      mockAuthPOST.mockRejectedValue(new Error('Authentication failed'));

      const request = new Request('https://example.com/api/auth/signin', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com', password: 'pass' }),
      });

      await expect(POST(request)).rejects.toThrow('Authentication failed');
    });

    it('should handle signout requests', async () => {
      const mockResponse = new Response(null, { status: 302 });
      mockAuthPOST.mockResolvedValue(mockResponse);

      const request = new Request('https://example.com/api/auth/signout', {
        method: 'POST',
      });

      const response = await POST(request);

      expect(mockAuthPOST).toHaveBeenCalledWith(request);
      expect(response).toBe(mockResponse);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[auth route] incoming POST',
        '/api/auth/signout'
      );
    });
  });

  describe('Logging behavior', () => {
    it('logs module load on import', () => {
      // The module load message is logged when the module is imported
      // This happens before the tests run
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('logs incoming requests', async () => {
      const request = new Request('https://example.com/api/auth/signin', {
        method: 'GET',
      });

      await GET(request);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[auth route] incoming GET')
      );
    });
  });
});
