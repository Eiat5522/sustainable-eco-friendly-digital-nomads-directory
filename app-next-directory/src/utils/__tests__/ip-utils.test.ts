import { describe, expect, it } from '@jest/globals';
import { getClientIPFromHeaders, getHeaderValue } from '../ip-utils';

describe('ip-utils', () => {
  describe('getHeaderValue', () => {
    it.each([
      ['Headers object', () => {
        const h = new Headers();
        h.set('x-test', 'v');
        return h;
      }, 'v'],
      ['Map with string', () => new Map([['x-test', 'v']]), 'v'],
      ['Map with array', () => new Map([['x-test', ['v1', 'v2']]]), 'v1'],
      ['Record object', () => ({ 'x-test': 'v' }), 'v'],
      ['Empty collection', () => ({}), null],
      ['Undefined collection', () => undefined, null],
    ])('should get value from %s', (_, factory, expected) => {
      expect(getHeaderValue(factory() as any, 'x-test')).toBe(expected);
    });

    it('should handle array value in record', () => {
        expect(getHeaderValue({ 'x-test': ['v1'] }, 'x-test')).toBe('v1');
    });

    it('should handle Headers-like object with array return from get', () => {
        const h = { get: () => ['v1', 'v2'] };
        expect(getHeaderValue(h as any, 'x-test')).toBe('v1');
    });

    it('should return null for empty array in collection', () => {
        expect(getHeaderValue({ 'x-test': [] }, 'x-test')).toBeNull();
    });

    it('should return null for null value in record', () => {
        expect(getHeaderValue({ 'x-test': null } as any, 'x-test')).toBeNull();
    });
  });

  describe('getClientIPFromHeaders', () => {
    it.each([
      ['x-forwarded-for', '1.2.3.4, 5.6.7.8', '1.2.3.4'],
      ['x-real-ip', '10.0.0.1', '10.0.0.1'],
      ['cf-connecting-ip', '172.16.0.1', '172.16.0.1'],
    ])('should extract valid IP from %s', (header, value, expected) => {
      const h = new Headers();
      h.set(header, value);
      expect(getClientIPFromHeaders(h)).toBe(expected);
    });

    it('should ignore invalid IP and fallback', () => {
      const h = new Headers();
      h.set('x-forwarded-for', 'invalid-ip, 5.6.7.8');
      h.set('x-real-ip', '10.0.0.1');
      expect(getClientIPFromHeaders(h)).toBe('10.0.0.1');
    });

    it('should return "unknown" if no valid IPs found', () => {
      const h = new Headers();
      h.set('x-forwarded-for', 'not-an-ip');
      expect(getClientIPFromHeaders(h)).toBe('unknown');
    });

    it('should return "unknown" if headers undefined', () => {
      expect(getClientIPFromHeaders(undefined)).toBe('unknown');
    });

    it('should handle array value for x-forwarded-for in Map', () => {
        const h = new Map([['x-forwarded-for', ['1.1.1.1', '2.2.2.2']]]);
        expect(getClientIPFromHeaders(h as any)).toBe('1.1.1.1');
    });

    it('should handle non-array Record value for x-forwarded-for', () => {
        const h = { 'x-forwarded-for': '1.1.1.1' };
        expect(getClientIPFromHeaders(h as any)).toBe('1.1.1.1');
    });

    it('should handle empty value for x-forwarded-for', () => {
        const h = new Headers();
        h.set('x-forwarded-for', '');
        h.set('x-real-ip', '1.1.1.1');
        expect(getClientIPFromHeaders(h)).toBe('1.1.1.1');
    });

    it('should handle null values in Map', () => {
        const h = new Map([['x-forwarded-for', null]]);
        expect(getClientIPFromHeaders(h as any)).toBe('unknown');
    });

    it('should prioritize headers correctly', () => {
      const h = new Headers();
      h.set('x-forwarded-for', '1.1.1.1');
      h.set('x-real-ip', '2.2.2.2');
      h.set('cf-connecting-ip', '3.3.3.3');

      expect(getClientIPFromHeaders(h)).toBe('1.1.1.1');
      h.delete('x-forwarded-for');
      expect(getClientIPFromHeaders(h)).toBe('2.2.2.2');
      h.delete('x-real-ip');
      expect(getClientIPFromHeaders(h)).toBe('3.3.3.3');
    });
  });
});
