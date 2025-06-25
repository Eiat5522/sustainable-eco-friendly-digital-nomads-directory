import { NextRequest, NextResponse } from 'next/server';
import { handleAuthCallbackUrl } from '../authCallbackHandler';

describe('handleAuthCallbackUrl', () => {
  it('should return null if callbackUrl is not present', () => {
    const req = {
      nextUrl: {
        searchParams: new URLSearchParams(),
      },
    } as NextRequest;
    const result = handleAuthCallbackUrl(req);
    expect(result).toBeNull();
  });

  it('should decode a simple callbackUrl', () => {
    const req = {
      nextUrl: {
        searchParams: new URLSearchParams({ callbackUrl: 'https://example.com' }),
      },
    } as NextRequest;
    const result = handleAuthCallbackUrl(req);
    expect(result).toBe('https://example.com');
  });

  it('should decode a URL with encoded characters', () => {
    const req = {
      nextUrl: {
        searchParams: new URLSearchParams({ callbackUrl: 'https%3A%2F%2Fexample.com%2Fpath%3Fquery%3Dvalue' }),
      },
    } as NextRequest;
    const result = handleAuthCallbackUrl(req);
    expect(result).toBe('https://example.com/path?query=value');
  });

  it('should handle double-encoded URLs', () => {
    const req = {
      nextUrl: {
        searchParams: new URLSearchParams({ callbackUrl: 'https%253A%252F%252Fexample.com' }),
      },
    } as NextRequest;
    const result = handleAuthCallbackUrl(req);
    expect(result).toBe('https://example.com');
  });

  it('should return null if decoding fails', () => {
    const req = {
      nextUrl: {
        searchParams: new URLSearchParams({ callbackUrl: '% ' }), // Invalid encoding
      },
    } as NextRequest;
    const result = handleAuthCallbackUrl(req);
    expect(result).toBeNull();
  });
});