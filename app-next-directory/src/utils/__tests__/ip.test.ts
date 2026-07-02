import { describe, expect, it } from '@jest/globals';
import { extractClientIp } from '../ip';

describe('extractClientIp', () => {
  it.each([
    ['x-forwarded-for (single)', { 'x-forwarded-for': '1.2.3.4' }, '1.2.3.4'],
    ['x-forwarded-for (multiple)', { 'x-forwarded-for': '1.2.3.4, 5.6.7.8' }, '1.2.3.4'],
    ['x-forwarded-for (with spaces)', { 'x-forwarded-for': '  1.2.3.4  , 5.6.7.8' }, '1.2.3.4'],
    ['x-real-ip', { 'x-real-ip': '1.2.3.4' }, '1.2.3.4'],
    ['cf-connecting-ip', { 'cf-connecting-ip': '1.2.3.4' }, '1.2.3.4'],
    ['IPv6', { 'x-forwarded-for': '2001:0db8:85a3::8a2e:0370:7334' }, '2001:0db8:85a3::8a2e:0370:7334'],
    ['unknown fallback', {}, 'unknown'],
    ['invalid IP fallback', { 'x-forwarded-for': 'not-an-ip' }, 'unknown'],
    ['empty list fallback', { 'x-forwarded-for': ', 5.6.7.8' }, 'unknown'],
  ])('extracts correct IP from %s', (_, headers, expected) => {
    const req = {
      headers: {
        get: (name: string) => headers[name as keyof typeof headers] || null,
      },
    };
    expect(extractClientIp(req)).toBe(expected);
  });

  it('prioritizes headers in order', () => {
    const req = {
      headers: {
        get: (name: string) => {
          if (name === 'x-forwarded-for') return '1.1.1.1';
          if (name === 'x-real-ip') return '2.2.2.2';
          if (name === 'cf-connecting-ip') return '3.3.3.3';
          return null;
        },
      },
    };
    expect(extractClientIp(req)).toBe('1.1.1.1');

    const req2 = {
      headers: {
        get: (name: string) => {
          if (name === 'x-real-ip') return '2.2.2.2';
          if (name === 'cf-connecting-ip') return '3.3.3.3';
          return null;
        },
      },
    };
    expect(extractClientIp(req2)).toBe('2.2.2.2');
  });
});
