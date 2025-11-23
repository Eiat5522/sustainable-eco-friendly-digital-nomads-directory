/**
 * @jest-environment node
 */

import { describe, expect, it } from '@jest/globals';
import { getRequestContext } from '../logger';

describe('Logger Utilities', () => {
  describe('getRequestContext', () => {
    it('extracts method from request', () => {
      const req = {
        method: 'GET',
        url: '/api/test',
      };

      const context = getRequestContext(req);

      expect(context.method).toBe('GET');
    });

    it('extracts URL from request', () => {
      const req = {
        method: 'POST',
        url: '/api/users',
      };

      const context = getRequestContext(req);

      expect(context.path).toBe('/api/users');
    });

    it('extracts path from nextUrl when url is not present', () => {
      const req = {
        method: 'GET',
        nextUrl: { pathname: '/dashboard' },
      };

      const context = getRequestContext(req);

      expect(context.path).toBe('/dashboard');
    });

    it('prefers url over nextUrl.pathname', () => {
      const req = {
        method: 'GET',
        url: '/api/test',
        nextUrl: { pathname: '/dashboard' },
      };

      const context = getRequestContext(req);

      expect(context.path).toBe('/api/test');
    });

    it('extracts user-agent from headers using get method', () => {
      const headers = {
        get: (name: string) => (name.toLowerCase() === 'user-agent' ? 'Mozilla/5.0' : null),
      };
      const req = {
        method: 'GET',
        url: '/api/test',
        headers,
      };

      const context = getRequestContext(req);

      expect(context.userAgent).toBe('Mozilla/5.0');
    });

    it('extracts IP from x-forwarded-for header', () => {
      const headers = {
        get: (name: string) => (name.toLowerCase() === 'x-forwarded-for' ? '192.168.1.1' : null),
      };
      const req = {
        method: 'GET',
        url: '/api/test',
        headers,
      };

      const context = getRequestContext(req);

      expect(context.ip).toBe('192.168.1.1');
    });

    it('prefers ip property over x-forwarded-for header', () => {
      const headers = {
        get: (name: string) => (name.toLowerCase() === 'x-forwarded-for' ? '192.168.1.1' : null),
      };
      const req = {
        method: 'GET',
        url: '/api/test',
        ip: '10.0.0.1',
        headers,
      };

      const context = getRequestContext(req);

      expect(context.ip).toBe('10.0.0.1');
    });

    it('extracts request ID from header', () => {
      const headers = {
        get: (name: string) => (name.toLowerCase() === 'x-request-id' ? 'req-123' : null),
      };
      const req = {
        method: 'GET',
        url: '/api/test',
        headers,
      };

      const context = getRequestContext(req);

      expect(context.requestId).toBe('req-123');
    });

    it('handles request without headers', () => {
      const req = {
        method: 'GET',
        url: '/api/test',
      };

      const context = getRequestContext(req);

      expect(context.method).toBe('GET');
      expect(context.path).toBe('/api/test');
      expect(context.userAgent).toBeUndefined();
      expect(context.ip).toBeUndefined();
      expect(context.requestId).toBeUndefined();
    });

    it('handles undefined request', () => {
      const context = getRequestContext(undefined);

      expect(context.method).toBeUndefined();
      expect(context.path).toBeUndefined();
      expect(context.userAgent).toBeUndefined();
      expect(context.ip).toBeUndefined();
      expect(context.requestId).toBeUndefined();
    });

    it('handles request with Headers object', () => {
      const headers = new Headers();
      headers.set('user-agent', 'Chrome/90.0');
      headers.set('x-forwarded-for', '192.168.1.100');
      headers.set('x-request-id', 'req-456');

      const req = {
        method: 'POST',
        url: '/api/create',
        headers,
      };

      const context = getRequestContext(req);

      expect(context.method).toBe('POST');
      expect(context.path).toBe('/api/create');
      expect(context.userAgent).toBe('Chrome/90.0');
      expect(context.ip).toBe('192.168.1.100');
      expect(context.requestId).toBe('req-456');
    });

    it('handles request with record-style headers', () => {
      const req = {
        method: 'PUT',
        url: '/api/update',
        headers: {
          'user-agent': 'Firefox/88.0',
          'x-forwarded-for': '10.0.0.5',
          'x-request-id': 'req-789',
        },
      };

      const context = getRequestContext(req);

      expect(context.method).toBe('PUT');
      expect(context.path).toBe('/api/update');
    });

    it('handles case-insensitive header names', () => {
      const headers = {
        get: (name: string) => {
          const lowerName = name.toLowerCase();
          if (lowerName === 'user-agent') return 'TestAgent/1.0';
          if (lowerName === 'x-forwarded-for') return '172.16.0.1';
          if (lowerName === 'x-request-id') return 'req-abc';
          return null;
        },
      };
      const req = {
        method: 'DELETE',
        url: '/api/delete',
        headers,
      };

      const context = getRequestContext(req);

      expect(context.userAgent).toBe('TestAgent/1.0');
      expect(context.ip).toBe('172.16.0.1');
      expect(context.requestId).toBe('req-abc');
    });

    it('extracts all context fields together', () => {
      const headers = {
        get: (name: string) => {
          const lowerName = name.toLowerCase();
          if (lowerName === 'user-agent') return 'FullTest/2.0';
          if (lowerName === 'x-forwarded-for') return '192.168.100.1';
          if (lowerName === 'x-request-id') return 'full-req-123';
          return null;
        },
      };
      const req = {
        method: 'PATCH',
        url: '/api/patch',
        headers,
      };

      const context = getRequestContext(req);

      expect(context).toEqual({
        method: 'PATCH',
        path: '/api/patch',
        userAgent: 'FullTest/2.0',
        ip: '192.168.100.1',
        requestId: 'full-req-123',
      });
    });

    it('handles empty method', () => {
      const req = {
        url: '/api/test',
      };

      const context = getRequestContext(req);

      expect(context.method).toBeUndefined();
      expect(context.path).toBe('/api/test');
    });

    it('handles empty path', () => {
      const req = {
        method: 'GET',
      };

      const context = getRequestContext(req);

      expect(context.method).toBe('GET');
      expect(context.path).toBeUndefined();
    });

    it('handles requests with special characters in URL', () => {
      const req = {
        method: 'GET',
        url: '/api/search?q=test%20query&filter=active',
      };

      const context = getRequestContext(req);

      expect(context.path).toBe('/api/search?q=test%20query&filter=active');
    });

    it('handles requests with very long URLs', () => {
      const longPath = '/api/' + 'a'.repeat(1000);
      const req = {
        method: 'GET',
        url: longPath,
      };

      const context = getRequestContext(req);

      expect(context.path).toBe(longPath);
      expect(context.path?.length).toBe(1005); // '/api/' + 1000 'a's
    });

    it('handles requests with IPv6 addresses', () => {
      const headers = {
        get: (name: string) =>
          name.toLowerCase() === 'x-forwarded-for' ? '2001:0db8:85a3::8a2e:0370:7334' : null,
      };
      const req = {
        method: 'GET',
        url: '/api/test',
        headers,
      };

      const context = getRequestContext(req);

      expect(context.ip).toBe('2001:0db8:85a3::8a2e:0370:7334');
    });

    it('handles requests with multiple forwarded IPs', () => {
      const headers = {
        get: (name: string) =>
          name.toLowerCase() === 'x-forwarded-for' ? '192.168.1.1, 10.0.0.1, 172.16.0.1' : null,
      };
      const req = {
        method: 'GET',
        url: '/api/test',
        headers,
      };

      const context = getRequestContext(req);

      expect(context.ip).toBe('192.168.1.1, 10.0.0.1, 172.16.0.1');
    });
  });

  describe('structuredLogger existence', () => {
    it('should export structuredLogger', () => {
      const { structuredLogger } = require('../logger');
      expect(structuredLogger).toBeDefined();
      expect(typeof structuredLogger.debug).toBe('function');
      expect(typeof structuredLogger.info).toBe('function');
      expect(typeof structuredLogger.warn).toBe('function');
      expect(typeof structuredLogger.error).toBe('function');
    });

    it('should export logger', () => {
      const { logger } = require('../logger');
      expect(logger).toBeDefined();
    });

    it('should export logError helper', () => {
      const { logError } = require('../logger');
      expect(logError).toBeDefined();
      expect(typeof logError).toBe('function');
    });
  });
});
