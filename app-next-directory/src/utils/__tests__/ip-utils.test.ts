import { describe, expect, it, jest } from '@jest/globals';
import { extractClientIP } from '../ip-utils';

jest.mock('validator/lib/isIP.js', () => {
  return jest.fn().mockImplementation(ip => {
    return (
      typeof ip === 'string' &&
      (ip.includes('.') || ip.includes(':')) &&
      !ip.includes('invalid')
    );
  });
});

describe('ip-utils', () => {
  describe('extractClientIP', () => {
    it('should use x-forwarded-for header for IP', () => {
      const headers = {
        get: (name: string) => (name === 'x-forwarded-for' ? '192.168.1.1, 10.0.0.1' : null),
      };
      expect(extractClientIP(headers)).toBe('192.168.1.1');
    });

    it('should use x-real-ip header if x-forwarded-for is not present', () => {
      const headers = {
        get: (name: string) => (name === 'x-real-ip' ? '192.168.1.1' : null),
      };
      expect(extractClientIP(headers)).toBe('192.168.1.1');
    });

    it('should use cf-connecting-ip header if others are not present', () => {
      const headers = {
        get: (name: string) => (name === 'cf-connecting-ip' ? '192.168.1.1' : null),
      };
      expect(extractClientIP(headers)).toBe('192.168.1.1');
    });

    it('should return null if no IP headers present', () => {
      const headers = {
        get: () => null,
      };
      expect(extractClientIP(headers)).toBeNull();
    });

    it('should handle x-forwarded-for with whitespace', () => {
      const headers = {
        get: (name: string) => (name === 'x-forwarded-for' ? '  192.168.1.1  , 10.0.0.1' : null),
      };
      expect(extractClientIP(headers)).toBe('192.168.1.1');
    });

    it('should skip invalid IPs in x-forwarded-for and try next header', () => {
      const headers = {
        get: (name: string) => {
          if (name === 'x-forwarded-for') return 'invalid-ip, 10.0.0.1';
          if (name === 'x-real-ip') return '192.168.1.1';
          return null;
        },
      };
      expect(extractClientIP(headers)).toBe('192.168.1.1');
    });

    it('should handle empty header values', () => {
      const headers = {
        get: (name: string) => (name === 'x-forwarded-for' ? '' : '192.168.1.1'),
      };
      expect(extractClientIP(headers)).toBe('192.168.1.1');
    });

    it('should prioritize candidate IP if valid', () => {
      const headers = { get: () => '1.2.3.4' };
      expect(extractClientIP(headers, '192.168.1.1')).toBe('192.168.1.1');
    });

    it('should ignore candidate IP if invalid and fallback to headers', () => {
      const headers = {
        get: (name: string) => (name === 'x-forwarded-for' ? '192.168.1.1' : null),
      };
      expect(extractClientIP(headers, 'invalid-ip')).toBe('192.168.1.1');
    });
  });
});
