import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { Request } from 'next/server';

// Mock dependencies
jest.mock('@/lib/auth', () => ({
  __esModule: true,
  GET: jest.fn(),
}));

const mockAuthModule = jest.requireMock('@/lib/auth') as {
  GET: jest.Mock;
};

// Import route after mocks
import { GET } from '../route';

describe('/api/auth/session', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should delegate to authGET with the request object', async () => {
      const mockRequest = {
        url: 'https://example.com/api/auth/session',
        method: 'GET',
        headers: new Headers(),
      } as Request;

      const mockResponse = new Response(JSON.stringify({ user: { id: '1', email: 'test@example.com' } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });

      mockAuthModule.GET.mockResolvedValue(mockResponse);

      const response = await GET(mockRequest);

      expect(mockAuthModule.GET).toHaveBeenCalledWith(mockRequest);
      expect(mockAuthModule.GET).toHaveBeenCalledTimes(1);
      expect(response).toBe(mockResponse);
    });

    it('should pass through authenticated session response', async () => {
      const mockRequest = {
        url: 'https://example.com/api/auth/session',
        method: 'GET',
        headers: new Headers({ cookie: 'session=abc123' }),
      } as Request;

      const mockResponse = new Response(
        JSON.stringify({
          user: {
            id: 'user-123',
            email: 'user@example.com',
            name: 'Test User',
            role: 'user',
          },
          expires: '2025-01-01T00:00:00.000Z',
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );

      mockAuthModule.GET.mockResolvedValue(mockResponse);

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('user');
      expect(data.user.id).toBe('user-123');
    });

    it('should pass through unauthenticated response', async () => {
      const mockRequest = {
        url: 'https://example.com/api/auth/session',
        method: 'GET',
        headers: new Headers(),
      } as Request;

      const mockResponse = new Response(JSON.stringify({ user: null }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });

      mockAuthModule.GET.mockResolvedValue(mockResponse);

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.user).toBeNull();
    });

    it('should handle errors from authGET', async () => {
      const mockRequest = {
        url: 'https://example.com/api/auth/session',
        method: 'GET',
        headers: new Headers(),
      } as Request;

      const errorResponse = new Response(JSON.stringify({ error: 'Internal error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });

      mockAuthModule.GET.mockResolvedValue(errorResponse);

      const response = await GET(mockRequest);

      expect(response.status).toBe(500);
      expect(mockAuthModule.GET).toHaveBeenCalledWith(mockRequest);
    });

    it('should propagate auth errors when authGET throws', async () => {
      const mockRequest = {
        url: 'https://example.com/api/auth/session',
        method: 'GET',
        headers: new Headers(),
      } as Request;

      mockAuthModule.GET.mockRejectedValue(new Error('Auth service unavailable'));

      await expect(GET(mockRequest)).rejects.toThrow('Auth service unavailable');
    });
  });
});
