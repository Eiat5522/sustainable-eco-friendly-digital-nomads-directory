/**
 * @jest-environment node
 */

import { describe, expect, it } from '@jest/globals';
import { getClientIp } from '../ip';

describe('utils/ip', () => {
  describe('getClientIp', () => {
    it('should use x-forwarded-for header for IP', () => {
      const request = {
        headers: { 'x-forwarded-for': '1.2.3.4, 10.0.0.1' },
      };
      expect(getClientIp(request)).toBe('1.2.3.4');
    });

    it('should handle x-forwarded-for with spaces', () => {
      const request = {
        headers: { 'x-forwarded-for': '  1.2.3.4  , 10.0.0.1' },
      };
      expect(getClientIp(request)).toBe('1.2.3.4');
    });

    it('should use x-real-ip header if x-forwarded-for is not present', () => {
      const request = {
        headers: { 'x-real-ip': '2.2.2.2' },
      };
      expect(getClientIp(request)).toBe('2.2.2.2');
    });

    it('should use cf-connecting-ip header if others are not present', () => {
      const request = {
        headers: { 'cf-connecting-ip': '3.3.3.3' },
      };
      expect(getClientIp(request)).toBe('3.3.3.3');
    });

    it('should use request.ip if present and valid', () => {
      const request = {
        ip: '4.4.4.4',
        headers: { 'x-forwarded-for': '1.1.1.1' }
      };
      expect(getClientIp(request)).toBe('4.4.4.4');
    });

    it('should ignore invalid request.ip', () => {
      const request = {
        ip: 'not-an-ip',
        headers: { 'x-forwarded-for': '1.1.1.1' }
      };
      expect(getClientIp(request)).toBe('1.1.1.1');
    });

    it('should return undefined if no IP headers are present', () => {
      const request = {
        headers: {}
      };
      expect(getClientIp(request)).toBeUndefined();
    });

    it('should return undefined if request is null', () => {
      expect(getClientIp(null)).toBeUndefined();
    });

    it('should return undefined if IP is invalid', () => {
      const request = {
        headers: { 'x-forwarded-for': 'not-an-ip' },
      };
      expect(getClientIp(request)).toBeUndefined();
    });

    it('should handle Headers object (from standard Request)', () => {
      const headers = new Headers();
      headers.set('x-forwarded-for', '5.5.5.5');
      const request = { headers };
      expect(getClientIp(request as any)).toBe('5.5.5.5');
    });

    it('should handle Headers object with case-insensitive keys', () => {
      const headers = new Headers();
      headers.set('X-Forwarded-For', '6.6.6.6');
      const request = { headers };
      expect(getClientIp(request as any)).toBe('6.6.6.6');
    });
  });
});
