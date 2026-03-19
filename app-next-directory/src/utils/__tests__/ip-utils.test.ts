import { describe, expect, it } from '@jest/globals';
import { getClientIPFromHeaders, getHeaderValue } from '../ip-utils';

describe('ip-utils', () => {
  describe('getHeaderValue', () => {
    it('should get value from Headers object', () => {
      const headers = new Headers();
      headers.set('test', 'value');
      expect(getHeaderValue(headers, 'test')).toBe('value');
    });

    it('should get value from Map', () => {
      const headers = new Map<string, string | string[]>();
      headers.set('test', 'value');
      expect(getHeaderValue(headers, 'test')).toBe('value');
    });

    it('should join array values from Map', () => {
      const headers = new Map<string, string | string[]>();
      headers.set('test', ['val1', 'val2']);
      expect(getHeaderValue(headers, 'test')).toBe('val1, val2');
    });

    it('should get value from Record', () => {
      const headers: Record<string, string | string[] | undefined> = {
        test: 'value',
      };
      expect(getHeaderValue(headers, 'test')).toBe('value');
    });

    it('should join array values from Record', () => {
      const headers: Record<string, string | string[] | undefined> = {
        test: ['val1', 'val2'],
      };
      expect(getHeaderValue(headers, 'test')).toBe('val1, val2');
    });

    it('should return null if header not found', () => {
      expect(getHeaderValue({}, 'test')).toBeNull();
    });
  });

  describe('getClientIPFromHeaders', () => {
    it('should extract valid IP from x-forwarded-for', () => {
      const headers = new Headers();
      headers.set('x-forwarded-for', '1.2.3.4, 5.6.7.8');
      expect(getClientIPFromHeaders(headers)).toBe('1.2.3.4');
    });

    it('should ignore invalid IP in x-forwarded-for', () => {
      const headers = new Headers();
      headers.set('x-forwarded-for', 'invalid, 1.2.3.4');
      expect(getClientIPFromHeaders(headers)).not.toBe('invalid');
    });

    it('should extract valid IP from x-real-ip', () => {
      const headers = new Headers();
      headers.set('x-real-ip', '1.2.3.4');
      expect(getClientIPFromHeaders(headers)).toBe('1.2.3.4');
    });

    it('should extract valid IP from cf-connecting-ip', () => {
      const headers = new Headers();
      headers.set('cf-connecting-ip', '1.2.3.4');
      expect(getClientIPFromHeaders(headers)).toBe('1.2.3.4');
    });

    it('should prioritize x-forwarded-for', () => {
      const headers = new Headers();
      headers.set('x-forwarded-for', '1.1.1.1');
      headers.set('x-real-ip', '2.2.2.2');
      expect(getClientIPFromHeaders(headers)).toBe('1.1.1.1');
    });

    it('should return "unknown" if no valid IP found', () => {
      const headers = new Headers();
      headers.set('x-forwarded-for', 'invalid');
      expect(getClientIPFromHeaders(headers)).toBe('unknown');
    });
  });
});
