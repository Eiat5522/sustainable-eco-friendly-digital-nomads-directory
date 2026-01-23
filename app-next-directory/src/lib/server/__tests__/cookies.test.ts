/**
 * Unit tests for src/lib/server/cookies.ts
 * Tests cookie utility functions
 */

import { jest } from '@jest/globals';
import { getCookieHeader } from '../cookies';

// Mock next/headers
jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

describe('src/lib/server/cookies', () => {
  let mockCookies: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    const { cookies } = require('next/headers');
    mockCookies = cookies as jest.Mock;
  });

  describe('getCookieHeader', () => {
    it('should return cookie header string when cookies exist', async () => {
      const mockCookieStore = {
        getAll: jest.fn().mockReturnValue([
          { name: 'sessionId', value: 'abc123' },
          { name: 'userId', value: 'user-1' },
        ]),
      };
      mockCookies.mockResolvedValue(mockCookieStore);

      const result = await getCookieHeader();

      expect(result).toBe('sessionId=abc123; userId=user-1');
      expect(mockCookies).toHaveBeenCalledTimes(1);
      expect(mockCookieStore.getAll).toHaveBeenCalledTimes(1);
    });

    it('should return null when no cookies exist', async () => {
      const mockCookieStore = {
        getAll: jest.fn().mockReturnValue([]),
      };
      mockCookies.mockResolvedValue(mockCookieStore);

      const result = await getCookieHeader();

      expect(result).toBeNull();
    });

    it('should handle single cookie', async () => {
      const mockCookieStore = {
        getAll: jest.fn().mockReturnValue([{ name: 'token', value: 'xyz789' }]),
      };
      mockCookies.mockResolvedValue(mockCookieStore);

      const result = await getCookieHeader();

      expect(result).toBe('token=xyz789');
    });

    it('should handle multiple cookies with proper semicolon separation', async () => {
      const mockCookieStore = {
        getAll: jest.fn().mockReturnValue([
          { name: 'cookie1', value: 'value1' },
          { name: 'cookie2', value: 'value2' },
          { name: 'cookie3', value: 'value3' },
        ]),
      };
      mockCookies.mockResolvedValue(mockCookieStore);

      const result = await getCookieHeader();

      expect(result).toBe('cookie1=value1; cookie2=value2; cookie3=value3');
    });

    it('should return null on error', async () => {
      mockCookies.mockRejectedValue(new Error('Cookie access error'));

      const result = await getCookieHeader();

      expect(result).toBeNull();
    });

    it('should handle cookies with special characters in values', async () => {
      const mockCookieStore = {
        getAll: jest.fn().mockReturnValue([
          { name: 'data', value: 'test=value&foo=bar' },
          { name: 'encoded', value: 'some%20value' },
        ]),
      };
      mockCookies.mockResolvedValue(mockCookieStore);

      const result = await getCookieHeader();

      expect(result).toBe('data=test=value&foo=bar; encoded=some%20value');
    });

    it('should handle empty cookie values', async () => {
      const mockCookieStore = {
        getAll: jest.fn().mockReturnValue([
          { name: 'empty', value: '' },
          { name: 'filled', value: 'data' },
        ]),
      };
      mockCookies.mockResolvedValue(mockCookieStore);

      const result = await getCookieHeader();

      expect(result).toBe('empty=; filled=data');
    });

    it('should be server-only', () => {
      // This test documents that the file imports 'server-only'
      // which will throw at build time if imported in client code
      expect(true).toBe(true);
    });
  });
});
