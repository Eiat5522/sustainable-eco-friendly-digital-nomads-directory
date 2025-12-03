import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { structuredLogger } from '@/lib/logger';

jest.mock('@/lib/logger', () => ({
  structuredLogger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock the auth library
const mockAuthGET = jest.fn();
const mockAuthPOST = jest.fn();

jest.mock('@/lib/auth', () => ({
  __esModule: true,
  GET: mockAuthGET,
  POST: mockAuthPOST,
}));

type GetHandler = typeof import('../route').GET;
type PostHandler = typeof import('../route').POST;
let GET: GetHandler;
let POST: PostHandler;

describe('NextAuth Route Handler', () => {
  beforeEach(async () => {
    jest.clearAllMocks();

    // Set default mock responses
    mockAuthGET.mockResolvedValue(new Response('OK', { status: 200 }));
    mockAuthPOST.mockResolvedValue(new Response('OK', { status: 200 }));

    // Import handlers with isolated modules
    await jest.isolateModulesAsync(async () => {
      const routeModule = await import('../route');
      GET = routeModule.GET;
      POST = routeModule.POST;
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('GET handler', () => {
    it('forwards GET requests to NextAuth', async () => {
      const mockResponse = new Response('OK', { status: 200 });
      mockAuthGET.mockResolvedValue(mockResponse);

      const request = new Request('https://example.com/api/auth/signin', {
        method: 'GET',
      });

      const response = await GET(request);

      expect(mockAuthGET).toHaveBeenCalled();
      expect(response).toBe(mockResponse);
      expect(structuredLogger.info).toHaveBeenCalled();
    });

    it('logs the pathname for GET requests', async () => {
      const request = new Request('https://example.com/api/auth/signin', {
        method: 'GET',
      });

      await GET(request);

      expect(structuredLogger.info).toHaveBeenCalledWith('[auth route] incoming GET', {
        path: '/api/auth/signin',
      });
    });

    it('handles errors during URL parsing gracefully', async () => {
      const mockResponse = new Response('OK', { status: 200 });
      mockAuthGET.mockResolvedValue(mockResponse);

      // Create a request with an invalid URL property
      const request = {
        url: 'not-a-valid-url',
      } as Request;

      const response = await GET(request);

      expect(mockAuthGET).toHaveBeenCalledWith(request);
      expect(response).toBe(mockResponse);
      expect(structuredLogger.warn).toHaveBeenCalledWith(
        '[auth route] failed to parse GET request URL',
        { component: 'auth', error: expect.any(String) }
      );
    });

    it('passes through NextAuth response', async () => {
      const mockResponse = new Response(JSON.stringify({ user: { id: '123' } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
      mockAuthGET.mockResolvedValue(mockResponse);

      const request = new Request('https://example.com/api/auth/session', {
        method: 'GET',
      });

      const response = await GET(request);

      expect(response.status).toBe(200);
    });

    it('handles NextAuth errors by propagating them', async () => {
      mockAuthGET.mockRejectedValue(new Error('NextAuth error'));

      const request = new Request('https://example.com/api/auth/signin', {
        method: 'GET',
      });

      await expect(GET(request)).rejects.toThrow('NextAuth error');
    });
  });

  describe('POST handler', () => {
    it('forwards POST requests to NextAuth', async () => {
      const mockResponse = new Response('OK', { status: 200 });
      mockAuthPOST.mockResolvedValue(mockResponse);

      const request = new Request('https://example.com/api/auth/signin', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com', password: 'pass' }),
      });

      const response = await POST(request);

      expect(mockAuthPOST).toHaveBeenCalled();
      expect(response).toBe(mockResponse);
    });

    it('logs the pathname for POST requests', async () => {
      const request = new Request('https://example.com/api/auth/signin', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com', password: 'pass' }),
      });

      await POST(request);

      expect(structuredLogger.info).toHaveBeenCalledWith('[auth route] incoming POST', {
        path: '/api/auth/signin',
      });
    });

    it('handles errors during URL parsing in POST', async () => {
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
    });

    it('passes through NextAuth POST response', async () => {
      const mockResponse = new Response(JSON.stringify({ url: '/dashboard' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
      mockAuthPOST.mockResolvedValue(mockResponse);

      const request = new Request('https://example.com/api/auth/signin', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com', password: 'pass' }),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
    });

    it('handles NextAuth POST errors by propagating them', async () => {
      mockAuthPOST.mockRejectedValue(new Error('Authentication failed'));

      const request = new Request('https://example.com/api/auth/signin', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com', password: 'pass' }),
      });

      await expect(POST(request)).rejects.toThrow('Authentication failed');
    });

    it('handles various NextAuth callback endpoints', async () => {
      const mockResponse = new Response('OK', { status: 200 });
      mockAuthPOST.mockResolvedValue(mockResponse);

      const request = new Request('https://example.com/api/auth/callback/credentials', {
        method: 'POST',
      });

      await POST(request);

      expect(mockAuthPOST).toHaveBeenCalled();
      expect(structuredLogger.info).toHaveBeenCalled();
    });
  });

  describe('Logging behavior', () => {
    it('logs module load on import', () => {
      // The module load message is logged when the module is imported
      // This happens before the tests run
      expect(structuredLogger.info).toHaveBeenCalledWith('[auth route] module loaded');
    });

    it('logs incoming requests', async () => {
      const request = new Request('https://example.com/api/auth/signin', {
        method: 'GET',
      });

      await GET(request);

      // Check that console.log was called with the incoming GET message
      const calls = (structuredLogger.info as jest.Mock).mock.calls;
      const hasIncomingGetLog = calls.some(call => call[0] === '[auth route] incoming GET');
      expect(hasIncomingGetLog).toBe(true);
    });
  });
});
