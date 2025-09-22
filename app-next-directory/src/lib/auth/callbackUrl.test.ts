import { decodeCallbackUrl, sanitizeCallbackUrl } from './callbackUrl';

describe('callback URL helpers', () => {
  describe('decodeCallbackUrl', () => {
    it('returns null when raw value is missing', () => {
      expect(decodeCallbackUrl(undefined)).toBeNull();
      expect(decodeCallbackUrl(null)).toBeNull();
    });

    it('repeatedly decodes nested encodings up to a safe limit', () => {
      const twiceEncoded = encodeURIComponent(encodeURIComponent('/auth/login?next=%2Fdashboard'));
      expect(decodeCallbackUrl(twiceEncoded)).toBe('/auth/login?next=/dashboard');
    });

    it('returns null when decoding fails', () => {
      expect(decodeCallbackUrl('%E0%A4%A')).toBeNull();
    });
  });

  describe('sanitizeCallbackUrl', () => {
    const origin = 'https://example.com';

    it('allows safe relative paths', () => {
      expect(sanitizeCallbackUrl('/dashboard?tab=1', origin)).toBe('/dashboard?tab=1');
    });

    it('blocks protocol-relative URLs', () => {
      expect(sanitizeCallbackUrl('//evil.com/path', origin)).toBeNull();
    });

    it('rejects URLs containing whitespace', () => {
      expect(sanitizeCallbackUrl('/in valid', origin)).toBeNull();
    });

    it('allows same-origin absolute URLs and strips origin', () => {
      expect(sanitizeCallbackUrl('https://example.com/private#hash', origin)).toBe('/private#hash');
    });

    it('rejects absolute URLs when origin mismatches', () => {
      expect(sanitizeCallbackUrl('https://attacker.test/private', origin)).toBeNull();
    });

    it('returns null for absolute URLs when base origin is missing', () => {
      expect(sanitizeCallbackUrl('https://example.com/path', undefined)).toBeNull();
    });

    it('returns null for invalid URL strings', () => {
      expect(sanitizeCallbackUrl('http://[', origin)).toBeNull();
    });

    it('returns null when decoded value is empty after sanitisation', () => {
      expect(sanitizeCallbackUrl('%', origin)).toBeNull();
    });
  });
});
