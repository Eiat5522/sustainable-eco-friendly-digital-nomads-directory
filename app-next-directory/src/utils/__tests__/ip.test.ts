import { getClientIp } from '../ip';

describe('getClientIp', () => {
  it('should use x-forwarded-for header for IP', () => {
    const request = {
      headers: new Headers({ 'x-forwarded-for': '192.168.1.1, 10.0.0.1' }),
    };
    expect(getClientIp(request as any)).toBe('192.168.1.1');
  });

  it('should handle x-forwarded-for with spaces correctly', () => {
    const request = {
      headers: new Headers({ 'x-forwarded-for': '  192.168.1.1  , 10.0.0.1' }),
    };
    expect(getClientIp(request as any)).toBe('192.168.1.1');
  });

  it('should use x-real-ip header if x-forwarded-for is not present', () => {
    const request = {
      headers: new Headers({ 'x-real-ip': '192.168.1.1' }),
    };
    expect(getClientIp(request as any)).toBe('192.168.1.1');
  });

  it('should use cf-connecting-ip header if others are not present', () => {
    const request = {
      headers: new Headers({ 'cf-connecting-ip': '192.168.1.1' }),
    };
    expect(getClientIp(request as any)).toBe('192.168.1.1');
  });

  it('should use "unknown" as fallback if no IP headers present', () => {
    const request = {
      headers: new Headers(),
    };
    expect(getClientIp(request as any)).toBe('unknown');
  });

  it('should return "unknown" if IP header is invalid', () => {
    const request = {
      headers: new Headers({ 'x-forwarded-for': 'not-an-ip' }),
    };
    expect(getClientIp(request as any)).toBe('unknown');
  });

  it('should skip invalid IPs in x-forwarded-for list', () => {
    const request = {
      headers: new Headers({ 'x-forwarded-for': 'invalid, 192.168.1.2' }),
    };
    expect(getClientIp(request as any)).toBe('192.168.1.2');
  });

  it('should prioritize request.ip if available', () => {
    const request = {
      ip: '10.0.0.5',
      headers: new Headers({ 'x-forwarded-for': '192.168.1.1' }),
    };
    expect(getClientIp(request as any)).toBe('10.0.0.5');
  });

  it('should handle IPv6 addresses', () => {
    const ipv6 = '2001:0db8:85a3:0000:0000:8a2e:0370:7334';
    const request = {
      headers: new Headers({ 'x-forwarded-for': ipv6 }),
    };
    expect(getClientIp(request as any)).toBe(ipv6);
  });

  it('should handle request with record-style headers', () => {
    const request = {
      headers: {
        'x-forwarded-for': '192.168.1.1',
      },
    };
    expect(getClientIp(request as any)).toBe('192.168.1.1');
  });

  it('should handle request with case-insensitive header names', () => {
    const request = {
      headers: {
        'X-Forwarded-For': '192.168.1.1',
      },
    };
    expect(getClientIp(request as any)).toBe('192.168.1.1');
  });
});
