import { describe, expect, it } from '@jest/globals';
import { getClientIPFromHeaders, getHeaderValue } from '../ip-utils';

describe('ip-utils', () => {
  describe('getHeaderValue', () => {
    it.each([
      ['Headers', () => new Headers([['x-t', 'v']]), 'v'],
      ['Map', () => new Map([['x-t', ['v1', 'v2']]]), 'v1'],
      ['Record', () => ({ 'x-t': 'v' }), 'v'],
      ['Empty', () => ({}), null],
      ['Undefined', () => undefined, null],
    ])('gets value from %s', (_, factory, expected) => {
      expect(getHeaderValue(factory() as any, 'x-t')).toBe(expected);
    });

    it('handles Headers-like with array', () => {
        const h = { get: () => ['v1', 'v2'] };
        expect(getHeaderValue(h as any, 'x-t')).toBe('v1');
    });

    it('returns null for empty array', () => {
        expect(getHeaderValue({ 'x-t': [] }, 'x-t')).toBeNull();
    });
  });

  describe('getClientIPFromHeaders', () => {
    it.each([
      ['x-forwarded-for', '1.2.3.4, 5.6.7.8', '1.2.3.4'],
      ['x-real-ip', '10.0.0.1', '10.0.0.1'],
      ['cf-connecting-ip', '172.16.0.1', '172.16.0.1'],
    ])('extracts from %s', (header, value, expected) => {
      const h = new Headers([[header, value]]);
      expect(getClientIPFromHeaders(h)).toBe(expected);
    });

    it('ignores invalid and falls back', () => {
      const h = new Headers([['x-forwarded-for', 'bad'], ['x-real-ip', '10.0.0.1']]);
      expect(getClientIPFromHeaders(h)).toBe('10.0.0.1');
    });

    it('handles missing headers', () => {
      expect(getClientIPFromHeaders(undefined)).toBe('unknown');
      expect(getClientIPFromHeaders(new Headers())).toBe('unknown');
    });

    it('prioritizes correctly', () => {
      const h = new Headers([['x-forwarded-for', '1.1.1.1'], ['x-real-ip', '2.2.2.2']]);
      expect(getClientIPFromHeaders(h)).toBe('1.1.1.1');
      h.delete('x-forwarded-for');
      expect(getClientIPFromHeaders(h)).toBe('2.2.2.2');
    });
  });
});
