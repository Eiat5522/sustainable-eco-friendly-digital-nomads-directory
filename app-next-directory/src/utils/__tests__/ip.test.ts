import { describe, expect, it } from '@jest/globals';
import { getClientIp } from '../ip';

describe('ip utility', () => {
  it('should extract IP from request.ip', () => {
    const req = {
      ip: '10.0.0.1',
      headers: { get: () => null },
    };
    expect(getClientIp(req)).toBe('10.0.0.1');
  });

  it('should validate request.ip', () => {
    const req = {
      ip: 'invalid-ip',
      headers: { get: () => '1.2.3.4' },
    };
    expect(getClientIp(req)).toBe('1.2.3.4');
  });

  it('should extract IP from x-forwarded-for', () => {
    const req = {
      headers: {
        get: (name: string) => name === 'x-forwarded-for' ? '192.168.1.1, 10.0.0.1' : null
      },
    };
    expect(getClientIp(req)).toBe('192.168.1.1');
  });

  it('should extract IP from x-real-ip', () => {
    const req = {
      headers: {
        get: (name: string) => name === 'x-real-ip' ? '172.16.0.1' : null
      },
    };
    expect(getClientIp(req)).toBe('172.16.0.1');
  });

  it('should extract IP from cf-connecting-ip', () => {
    const req = {
      headers: {
        get: (name: string) => name === 'cf-connecting-ip' ? '8.8.8.8' : null
      },
    };
    expect(getClientIp(req)).toBe('8.8.8.8');
  });

  it('should prioritize headers correctly', () => {
    const req = {
      headers: {
        get: (name: string) => {
          if (name === 'x-forwarded-for') return '1.1.1.1';
          if (name === 'x-real-ip') return '2.2.2.2';
          return null;
        }
      },
    };
    expect(getClientIp(req)).toBe('1.1.1.1');
  });

  it('should return unknown for invalid IPs in headers', () => {
    const req = {
      headers: {
        get: (name: string) => 'not-an-ip'
      },
    };
    expect(getClientIp(req)).toBe('unknown');
  });

  it('should handle missing headers', () => {
    const req = {
      headers: { get: () => null },
    };
    expect(getClientIp(req)).toBe('unknown');
  });

  it('should handle exceptions gracefully', () => {
    const req = {
      get headers() { throw new Error('Boom'); }
    } as any;
    expect(getClientIp(req)).toBe('unknown');
  });
});
