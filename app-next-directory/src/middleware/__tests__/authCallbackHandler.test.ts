import { handleAuthCallbackUrl } from '../authCallbackHandler';
import { structuredLogger } from '@/lib/logger';

jest.mock('@/lib/logger', () => ({
  structuredLogger: {
    middlewareError: jest.fn(),
  },
}));

describe('handleAuthCallbackUrl', () => {
  it('should return null if callbackUrl is not present', () => {
    const req = {
      nextUrl: {
        searchParams: new URLSearchParams(),
      },
    };
    const result = handleAuthCallbackUrl(req);
    expect(result).toBeNull();
  });

  it('should decode a simple callbackUrl', () => {
    const req = {
      nextUrl: {
        searchParams: new URLSearchParams({ callbackUrl: 'https://example.com' }),
      },
    };
    const result = handleAuthCallbackUrl(req);
    expect(result).toBe('https://example.com');
  });

  it('should decode a URL with encoded characters', () => {
    const req = {
      nextUrl: {
        searchParams: new URLSearchParams({ callbackUrl: 'https%3A%2F%2Fexample.com%2Fpath%3Fquery%3Dvalue' }),
      },
    };
    const result = handleAuthCallbackUrl(req);
    expect(result).toBe('https://example.com/path?query=value');
  });

  it('should handle double-encoded URLs', () => {
    const req = {
      nextUrl: {
        searchParams: new URLSearchParams({ callbackUrl: 'https%253A%252F%252Fexample.com' }),
      },
    };
    const result = handleAuthCallbackUrl(req);
    expect(result).toBe('https://example.com');
  });

  it('should return null if decoding fails', () => {
    const req = {
      nextUrl: {
        searchParams: new URLSearchParams({ callbackUrl: '% ' }), // Invalid encoding
      },
    };
    const result = handleAuthCallbackUrl(req);
    expect(result).toBeNull();
  });

  it('should stop decoding when no encoded patterns remain', () => {
    // Test the case where decoded URL doesn't contain more encoding patterns
    const req = {
      nextUrl: {
        searchParams: new URLSearchParams({ callbackUrl: 'https://example.com/path-without-encoding' }),
      },
    };
    const result = handleAuthCallbackUrl(req);
    expect(result).toBe('https://example.com/path-without-encoding');
  });

  it('should handle triple-encoded URLs', () => {
    // %25 = %, so %252F = %2F after one decode, then / after two decodes
    const req = {
      nextUrl: {
        searchParams: new URLSearchParams({ callbackUrl: 'https%25253A%25252F%25252Fexample.com' }),
      },
    };
    const result = handleAuthCallbackUrl(req);
    expect(result).toBe('https://example.com');
  });

  it('should handle URLs with special characters that need decoding', () => {
    const req = {
      nextUrl: {
        searchParams: new URLSearchParams({ callbackUrl: 'https%3A%2F%2Fexample.com%2Fpath%3Fparam%3Dvalue%26other%3Dtest' }),
      },
    };
    const result = handleAuthCallbackUrl(req);
    expect(result).toBe('https://example.com/path?param=value&other=test');
  });

  it('should log an error if decoding fails', () => {
    const req = {
      nextUrl: {
        searchParams: new URLSearchParams({ callbackUrl: '%' }), // Invalid URI component
      },
    };
    handleAuthCallbackUrl(req);
    expect(structuredLogger.middlewareError).toHaveBeenCalledWith(
      'auth callback URL decoder',
      expect.any(Error),
      {
        component: 'auth-callback',
        callbackUrl: '[REDACTED]',
      }
    );
  });
});