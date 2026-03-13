import { describe, expect, it } from '@jest/globals';
import { getClientIPFromHeaders, getHeaderValue } from '../ip-utils';

describe('ip-utils', () => {
  describe('getHeaderValue', () => {
    it('should get value from Headers object', () => {
      const headers = new Headers();
      headers.set('x-test', 'value');
      expect(getHeaderValue(headers, 'x-test')).toBe('value');
    });

    it('should get value from Map', () => {
      const headers = new Map<string, string | string[]>();
      headers.set('x-test', 'value');
      expect(getHeaderValue(headers, 'x-test')).toBe('value');
    });

    it('should get first value from Map with array', () => {
      const headers = new Map<string, string | string[]>();
      headers.set('x-test', ['value1', 'value2']);
      expect(getHeaderValue(headers, 'x-test')).toBe('value1');
    });

    it('should get value from Record', () => {
      const headers: Record<string, string | string[] | undefined> = {
        'x-test': 'value',
      };
      expect(getHeaderValue(headers, 'x-test')).toBe('value');
    });

    it('should return null if header not found', () => {
      expect(getHeaderValue({}, 'x-test')).toBeNull();
    });
  });

  describe('getClientIPFromHeaders', () => {
    it('should extract valid IP from x-forwarded-for', () => {
      const headers = new Headers();
      headers.set('x-forwarded-for', '1.2.3.4, 5.6.7.8');
      expect(getClientIPFromHeaders(headers)).toBe('1.2.3.4');
    });

    it('should ignore invalid IP in x-forwarded-for and fallback', () => {
      const headers = new Headers();
      headers.set('x-forwarded-for', 'invalid-ip, 5.6.7.8');
      headers.set('x-real-ip', '10.0.0.1');
      expect(getClientIPFromHeaders(headers)).toBe('10.0.0.1');
    });

    it('should extract valid IP from x-real-ip', () => {
      const headers = new Headers();
      headers.set('x-real-ip', '10.0.0.1');
      expect(getClientIPFromHeaders(headers)).toBe('10.0.0.1');
    });

    it('should extract valid IP from cf-connecting-ip', () => {
      const headers = new Headers();
      headers.set('cf-connecting-ip', '172.16.0.1');
      expect(getClientIPFromHeaders(headers)).toBe('172.16.0.1');
    });

    it('should return "unknown" if no valid IPs found', () => {
      const headers = new Headers();
      headers.set('x-forwarded-for', 'not-an-ip');
      headers.set('x-real-ip', 'also-not-an-ip');
      expect(getClientIPFromHeaders(headers)).toBe('unknown');
    });

    it('should prioritize x-forwarded-for > x-real-ip > cf-connecting-ip', () => {
      const headers = new Headers();
      headers.set('x-forwarded-for', '1.1.1.1');
      headers.set('x-real-ip', '2.2.2.2');
      headers.set('cf-connecting-ip', '3.3.3.3');
      expect(getClientIPFromHeaders(headers)).toBe('1.1.1.1');

      headers.delete('x-forwarded-for');
      expect(getClientIPFromHeaders(headers)).toBe('2.2.2.2');

      headers.delete('x-real-ip');
      expect(getClientIPFromHeaders(headers)).toBe('3.3.3.3');
    });
  });
});
