import { beforeEach, describe, expect, it, jest } from '@jest/globals';

// Mock next/headers module
const mockHeadersFn = jest.fn();
jest.mock('next/headers', () => ({
  headers: mockHeadersFn,
}));

// Import after mocking
import { getBaseUrl } from '../absolute-url';

describe('absolute-url', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    mockHeadersFn.mockClear();
    // Reset environment variables
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('getBaseUrl', () => {
    it('should handle hosts with port numbers from env', async () => {
      process.env.NEXT_PUBLIC_FRONTEND_URL = 'https://example.com:3000';

      mockHeadersFn.mockRejectedValueOnce(new Error('Headers not available'));

      const result = await getBaseUrl();
      expect(result).toBe('https://example.com:3000');
    });

    it('should reject unsafe host strings', async () => {
      process.env.VERCEL = '1';
      process.env.NEXT_PUBLIC_FRONTEND_URL = 'http://localhost:3000';
      const mockHeadersObj = {
        get: jest.fn((key: string) => {
          if (key === 'x-forwarded-proto') return 'https';
          if (key === 'x-forwarded-host') return 'evil host with spaces';
          if (key === 'host') return 'evil host with spaces';
          return null;
        }),
      };

      mockHeadersFn.mockResolvedValueOnce(mockHeadersObj as unknown as Headers);

      const result = await getBaseUrl();
      // Should fall back to environment URL
      expect(result).toBe('http://localhost:3000');
    });

    it('should fall back to NEXT_PUBLIC_FRONTEND_URL when headers fail', async () => {
      process.env.NEXT_PUBLIC_FRONTEND_URL = 'https://frontend.example.com';

      mockHeadersFn.mockRejectedValueOnce(new Error('Headers not available'));

      const result = await getBaseUrl();
      expect(result).toBe('https://frontend.example.com');
    });

    it('should fall back to NEXTAUTH_URL when NEXT_PUBLIC_FRONTEND_URL is not set', async () => {
      delete process.env.NEXT_PUBLIC_FRONTEND_URL;
      process.env.NEXTAUTH_URL = 'https://auth.example.com';

      mockHeadersFn.mockRejectedValueOnce(new Error('Headers not available'));

      const result = await getBaseUrl();
      expect(result).toBe('https://auth.example.com');
    });

    it('should fall back to VERCEL_URL when other env vars are not set', async () => {
      delete process.env.NEXT_PUBLIC_FRONTEND_URL;
      delete process.env.NEXTAUTH_URL;
      process.env.VERCEL_URL = 'my-app.vercel.app';

      mockHeadersFn.mockRejectedValueOnce(new Error('Headers not available'));

      const result = await getBaseUrl();
      expect(result).toBe('https://my-app.vercel.app');
    });

    it('should fall back to localhost:3000 when no env vars are set', async () => {
      delete process.env.NEXT_PUBLIC_FRONTEND_URL;
      delete process.env.NEXTAUTH_URL;
      delete process.env.VERCEL_URL;

      mockHeadersFn.mockRejectedValueOnce(new Error('Headers not available'));

      const result = await getBaseUrl();
      expect(result).toBe('http://localhost:3000');
    });

    it('should handle invalid URL in environment variables', async () => {
      process.env.NEXT_PUBLIC_FRONTEND_URL = 'not-a-valid-url';

      mockHeadersFn.mockRejectedValueOnce(new Error('Headers not available'));

      const result = await getBaseUrl();
      expect(result).toBe('http://localhost:3000');
    });

    it('should trim whitespace from environment URL', async () => {
      process.env.NEXT_PUBLIC_FRONTEND_URL = '  https://example.com  ';

      mockHeadersFn.mockRejectedValueOnce(new Error('Headers not available'));

      const result = await getBaseUrl();
      expect(result).toBe('https://example.com');
    });

    it('should handle missing host header and fall back to env', async () => {
      process.env.VERCEL = '1';
      process.env.NEXT_PUBLIC_FRONTEND_URL = 'https://fallback.example.com';

      const mockHeadersObj = {
        get: jest.fn((key: string) => {
          if (key === 'x-forwarded-proto') return 'https';
          return null;
        }),
      };

      mockHeadersFn.mockResolvedValueOnce(mockHeadersObj as unknown as Headers);

      const result = await getBaseUrl();
      expect(result).toBe('https://fallback.example.com');
    });
  });
});
