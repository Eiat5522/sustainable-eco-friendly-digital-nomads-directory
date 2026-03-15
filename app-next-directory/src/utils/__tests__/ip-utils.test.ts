import { describe, expect, it } from '@jest/globals';
import { getClientIPFromHeaders, getHeaderValue, isValidIP } from '../ip-utils';

describe('ip-utils', () => {
  describe('isValidIP', () => {
    it('should return true for valid IPv4', () => {
      expect(isValidIP('127.0.0.1')).toBe(true);
      expect(isValidIP('192.168.1.1')).toBe(true);
    });

    it('should return true for valid IPv6', () => {
      expect(isValidIP('::1')).toBe(true);
      expect(isValidIP('2001:0db8:85a3:0000:0000:8a2e:0370:7334')).toBe(true);
    });

    it('should return false for invalid IPs', () => {
      expect(isValidIP('not-an-ip')).toBe(false);
      expect(isValidIP('256.256.256.256')).toBe(false);
      expect(isValidIP('')).toBe(false);
    });
  });

  describe('getHeaderValue', () => {
    it('should extract value from Headers object', () => {
      const h = new Headers();
      h.set('test', 'value');
      expect(getHeaderValue(h, 'test')).toBe('value');
    });

    it('should extract value from Map', () => {
      const m = new Map([['test', 'value']]);
      expect(getHeaderValue(m, 'test')).toBe('value');
    });

    it('should extract value from Record', () => {
      const r = { test: 'value' };
      expect(getHeaderValue(r, 'test')).toBe('value');
    });

    it('should handle array values in Record', () => {
      const r = { test: ['v1', 'v2'] };
      expect(getHeaderValue(r, 'test')).toBe('v1, v2');
      expect(getHeaderValue(r, 'test', false)).toBe('v1');
    });

    it('should return null if not found', () => {
      expect(getHeaderValue({}, 'missing')).toBe(null);
    });
  });

  describe('getClientIPFromHeaders', () => {
    it('should prioritize x-forwarded-for', () => {
      const h = {
        'x-forwarded-for': '1.1.1.1, 2.2.2.2',
        'x-real-ip': '3.3.3.3',
      };
      expect(getClientIPFromHeaders(h)).toBe('1.1.1.1');
    });

    it('should skip invalid IPs in x-forwarded-for', () => {
      const h = {
        'x-forwarded-for': 'invalid, 2.2.2.2',
      };
      expect(getClientIPFromHeaders(h)).toBe('2.2.2.2');
    });

    it('should fall back to x-real-ip', () => {
      const h = {
        'x-real-ip': '3.3.3.3',
        'cf-connecting-ip': '4.4.4.4',
      };
      expect(getClientIPFromHeaders(h)).toBe('3.3.3.3');
    });

    it('should fall back to cf-connecting-ip', () => {
      const h = {
        'cf-connecting-ip': '4.4.4.4',
      };
      expect(getClientIPFromHeaders(h)).toBe('4.4.4.4');
    });

    it('should return unknown if no valid IP found', () => {
      const h = {
        'x-forwarded-for': 'invalid',
      };
      expect(getClientIPFromHeaders(h)).toBe('unknown');
    });
  });
});
