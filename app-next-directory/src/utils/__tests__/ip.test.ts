import { describe, expect, it } from '@jest/globals';
import { getClientIp } from '../ip';

describe('getClientIp', () => {
  it('should return "unknown" when request is empty', () => {
    expect(getClientIp({})).toBe('unknown');
  });

  it('should prioritize req.ip if it is a valid IP', () => {
    const req = {
      ip: '1.2.3.4',
      headers: { 'x-forwarded-for': '5.6.7.8' }
    };
    expect(getClientIp(req as any)).toBe('1.2.3.4');
  });

  it('should ignore req.ip if it is an invalid IP and fall back to headers', () => {
    const req = {
      ip: 'not-an-ip',
      headers: { 'x-forwarded-for': '5.6.7.8' }
    };
    expect(getClientIp(req as any)).toBe('5.6.7.8');
  });

  it('should extract first IP from x-forwarded-for', () => {
    const req = {
      headers: { 'x-forwarded-for': '1.1.1.1, 2.2.2.2, 3.3.3.3' }
    };
    expect(getClientIp(req as any)).toBe('1.1.1.1');
  });

  it('should fall through when x-forwarded-for first element is invalid', () => {
    const req = {
      headers: {
        'x-forwarded-for': 'invalid, 2.2.2.2',
        'x-real-ip': '3.3.3.3'
      }
    };
    expect(getClientIp(req as any)).toBe('3.3.3.3');
  });

  it('should support x-real-ip', () => {
    const req = {
      headers: { 'x-real-ip': '4.4.4.4' }
    };
    expect(getClientIp(req as any)).toBe('4.4.4.4');
  });

  it('should support cf-connecting-ip', () => {
    const req = {
      headers: { 'cf-connecting-ip': '5.5.5.5' }
    };
    expect(getClientIp(req as any)).toBe('5.5.5.5');
  });

  it('should handle Headers object (NextRequest)', () => {
    const headers = new Headers();
    headers.set('x-real-ip', '6.6.6.6');
    const req = { headers };
    expect(getClientIp(req as any)).toBe('6.6.6.6');
  });

  it('should return "unknown" if all headers are invalid', () => {
    const req = {
      headers: {
        'x-forwarded-for': 'foo',
        'x-real-ip': 'bar',
        'cf-connecting-ip': 'baz'
      }
    };
    expect(getClientIp(req as any)).toBe('unknown');
  });

  it('should handle array header values (Node.js style)', () => {
    const req = {
      headers: {
        'x-real-ip': ['7.7.7.7']
      }
    };
    expect(getClientIp(req as any)).toBe('7.7.7.7');
  });
});
