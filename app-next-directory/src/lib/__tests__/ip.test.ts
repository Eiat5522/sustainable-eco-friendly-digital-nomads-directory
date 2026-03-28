import { describe, expect, it } from '@jest/globals';
import { getClientIp } from '../ip';

describe('getClientIp utility', () => {
  it('extracts IP from x-forwarded-for header', () => {
    const req = {
      headers: new Headers({ 'x-forwarded-for': '192.168.1.1' }),
    };
    expect(getClientIp(req)).toBe('192.168.1.1');
  });

  it('takes the first valid IP from x-forwarded-for chain', () => {
    const req = {
      headers: new Headers({ 'x-forwarded-for': '1.1.1.1, 2.2.2.2' }),
    };
    expect(getClientIp(req)).toBe('1.1.1.1');
  });

  it('skips invalid first IP in x-forwarded-for and falls back', () => {
    const req = {
      headers: new Headers({
        'x-forwarded-for': 'not-an-ip, 1.1.1.1',
        'x-real-ip': '2.2.2.2',
      }),
    };
    // Note: Our implementation currently only checks the first element of x-forwarded-for.
    // If that's invalid, it falls back to the next header.
    expect(getClientIp(req)).toBe('2.2.2.2');
  });

  it('falls back to x-real-ip if x-forwarded-for is missing', () => {
    const req = {
      headers: new Headers({ 'x-real-ip': '3.3.3.3' }),
    };
    expect(getClientIp(req)).toBe('3.3.3.3');
  });

  it('falls back to cf-connecting-ip', () => {
    const req = {
      headers: new Headers({ 'cf-connecting-ip': '4.4.4.4' }),
    };
    expect(getClientIp(req)).toBe('4.4.4.4');
  });

  it('falls back to req.ip property', () => {
    const req = {
      headers: new Headers(),
      ip: '5.5.5.5',
    };
    expect(getClientIp(req)).toBe('5.5.5.5');
  });

  it('returns "unknown" if no valid IP found', () => {
    const req = {
      headers: new Headers({ 'x-forwarded-for': 'invalid' }),
      ip: 'also-invalid',
    };
    expect(getClientIp(req)).toBe('unknown');
  });

  it('handles null/undefined request', () => {
    expect(getClientIp(null)).toBe('unknown');
    expect(getClientIp(undefined)).toBe('unknown');
  });

  it('handles IPv6 addresses', () => {
    const ipv6 = '2001:0db8:85a3:0000:0000:8a2e:0370:7334';
    const req = {
      headers: new Headers({ 'x-forwarded-for': ipv6 }),
    };
    expect(getClientIp(req)).toBe(ipv6);
  });
});
