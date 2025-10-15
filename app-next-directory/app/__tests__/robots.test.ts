import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import robots from '../robots';

describe('robots', () => {
  const originalEnv = process.env.NEXT_PUBLIC_SITE_URL;

  afterEach(() => {
    if (originalEnv) {
      process.env.NEXT_PUBLIC_SITE_URL = originalEnv;
    } else {
      delete process.env.NEXT_PUBLIC_SITE_URL;
    }
  });

  it('returns robots configuration with default URL when env var is not set', () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;

    const result = robots();

    expect(result).toEqual({
      rules: [
        {
          userAgent: '*',
          allow: '/',
          disallow: ['/admin/', '/api/private/'],
        },
      ],
      sitemap: 'https://yourdomain.com/sitemap.xml',
    });
  });

  it('returns robots configuration with env URL', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://example.com';

    const result = robots();

    expect(result).toEqual({
      rules: [
        {
          userAgent: '*',
          allow: '/',
          disallow: ['/admin/', '/api/private/'],
        },
      ],
      sitemap: 'https://example.com/sitemap.xml',
    });
  });

  it('removes trailing slashes from site URL', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://example.com///';

    const result = robots();

    expect(result.sitemap).toBe('https://example.com/sitemap.xml');
  });

  it('allows all user agents', () => {
    const result = robots();

    expect(result.rules[0].userAgent).toBe('*');
  });

  it('allows root path', () => {
    const result = robots();

    expect(result.rules[0].allow).toBe('/');
  });

  it('disallows admin paths', () => {
    const result = robots();

    expect(result.rules[0].disallow).toContain('/admin/');
  });

  it('disallows private API paths', () => {
    const result = robots();

    expect(result.rules[0].disallow).toContain('/api/private/');
  });

  it('includes sitemap reference', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://test.com';

    const result = robots();

    expect(result.sitemap).toBe('https://test.com/sitemap.xml');
  });
});
