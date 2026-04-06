import { describe, expect, it } from '@jest/globals';
import { getClientIp } from '../ip';

describe('getClientIp utility', () => {
  it('should return request.ip if present and valid', () => {
    const req = { ip: '1.2.3.4' };
    expect(getClientIp(req as any)).toBe('1.2.3.4');
  });

  it('should ignore request.ip if invalid', () => {
    const req = { ip: 'invalid', headers: { 'x-real-ip': '5.6.7.8' } };
    expect(getClientIp(req as any)).toBe('5.6.7.8');
  });

  it('should extract first IP from x-forwarded-for', () => {
    const req = {
      headers: { 'x-forwarded-for': '192.168.1.1, 10.0.0.1' }
    };
    expect(getClientIp(req as any)).toBe('192.168.1.1');
  });

  it('should use x-real-ip as fallback', () => {
    const req = {
      headers: { 'x-real-ip': '172.16.0.1' }
    };
    expect(getClientIp(req as any)).toBe('172.16.0.1');
  });

  it('should use cf-connecting-ip as fallback', () => {
    const req = {
      headers: { 'cf-connecting-ip': '8.8.8.8' }
    };
    expect(getClientIp(req as any)).toBe('8.8.8.8');
  });

  it('should handle Headers object (standard Request)', () => {
    const headers = new Headers();
    headers.set('x-real-ip', '1.1.1.1');
    const req = { headers };
    expect(getClientIp(req as any)).toBe('1.1.1.1');
  });

  it('should return "unknown" if no valid IP found', () => {
    const req = { headers: {} };
    expect(getClientIp(req as any)).toBe('unknown');

    const reqInvalid = { headers: { 'x-forwarded-for': 'not-an-ip' } };
    expect(getClientIp(reqInvalid as any)).toBe('unknown');
  });

  it('should handle trimmed values and whitespace', () => {
    const req = {
      headers: { 'x-forwarded-for': '  2.2.2.2  , 3.3.3.3' }
    };
    expect(getClientIp(req as any)).toBe('2.2.2.2');
  });
});
