import { getClientIPFromHeaders } from '../ip-utils';

describe('getClientIPFromHeaders', () => {
  it('should extract IP from x-forwarded-for', () => {
    const headers = new Headers({ 'x-forwarded-for': '1.2.3.4, 5.6.7.8' });
    expect(getClientIPFromHeaders(headers)).toBe('1.2.3.4');
  });

  it('should extract IP from x-real-ip', () => {
    const headers = new Headers({ 'x-real-ip': '1.2.3.4' });
    expect(getClientIPFromHeaders(headers)).toBe('1.2.3.4');
  });

  it('should extract IP from cf-connecting-ip', () => {
    const headers = new Headers({ 'cf-connecting-ip': '1.2.3.4' });
    expect(getClientIPFromHeaders(headers)).toBe('1.2.3.4');
  });

  it('should extract IP from true-client-ip', () => {
    const headers = new Headers({ 'true-client-ip': '1.2.3.4' });
    expect(getClientIPFromHeaders(headers)).toBe('1.2.3.4');
  });

  it('should return unknown for invalid IPs', () => {
    const headers = new Headers({ 'x-forwarded-for': 'not-an-ip' });
    expect(getClientIPFromHeaders(headers)).toBe('unknown');
  });

  it('should support Map headers', () => {
    const headers = new Map([['x-real-ip', '1.2.3.4']]);
    expect(getClientIPFromHeaders(headers as any)).toBe('1.2.3.4');
  });

  it('should support Record headers', () => {
    const headers = { 'x-real-ip': '1.2.3.4' };
    expect(getClientIPFromHeaders(headers)).toBe('1.2.3.4');
  });

  it('should handle array values in Record/Map', () => {
    const headers = { 'x-forwarded-for': ['1.2.3.4', '5.6.7.8'] };
    expect(getClientIPFromHeaders(headers as any)).toBe('1.2.3.4');
  });

  it('should return unknown for empty headers', () => {
    expect(getClientIPFromHeaders({})).toBe('unknown');
  });
});
