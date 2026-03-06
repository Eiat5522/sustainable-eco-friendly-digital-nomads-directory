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
      const req = new Request('http://localhost/api/test', {
        headers: {
          'user-agent': 'Mozilla/5.0',
        },
      });

      const context = getRequestContext(req);

      expect(context.userAgent).toBe('Mozilla/5.0');
    });

    it('extracts IP from x-forwarded-for header', () => {
      const req = new Request('http://localhost/api/test', {
        headers: {
          'x-forwarded-for': '192.168.1.1',
        },
      });

      const context = getRequestContext(req);

      expect(context.ip).toBe('192.168.1.1');
    });

    it('prefers ip property over x-forwarded-for header', () => {
      const req = {
        method: 'GET',
        url: '/api/test',
        ip: '10.0.0.1',
        headers: new Headers({
          'x-forwarded-for': '192.168.1.1',
        }),
      } as any;

      const context = getRequestContext(req);

      expect(context.ip).toBe('10.0.0.1');
    });

    it('extracts request ID from header', () => {
      const req = new Request('http://localhost/api/test', {
        headers: {
          'x-request-id': 'req-123',
        },
      });

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
      const req = new Request('http://localhost/api/create', {
        method: 'POST',
        headers: {
          'user-agent': 'Chrome/90.0',
          'x-forwarded-for': '192.168.1.100',
          'x-request-id': 'req-456',
        },
      });

      const context = getRequestContext(req);

      expect(context.method).toBe('POST');
      expect(context.path).toContain('/api/create');
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
      expect(context.ip).toBe('10.0.0.5');
    });

    it('handles case-insensitive header names', () => {
      const req = new Request('http://localhost/api/delete', {
        method: 'DELETE',
        headers: {
          'User-Agent': 'TestAgent/1.0',
          'X-Forwarded-For': '172.16.0.1',
          'X-Request-Id': 'req-abc',
        },
      });

      const context = getRequestContext(req);

      expect(context.userAgent).toBe('TestAgent/1.0');
      expect(context.ip).toBe('172.16.0.1');
      expect(context.requestId).toBe('req-abc');
    });

    it('extracts all context fields together', () => {
      const req = new Request('http://localhost/api/patch', {
        method: 'PATCH',
        headers: {
          'user-agent': 'FullTest/2.0',
          'x-forwarded-for': '192.168.100.1',
          'x-request-id': 'full-req-123',
        },
      });

      const context = getRequestContext(req);

      expect(context).toEqual({
        method: 'PATCH',
        path: 'http://localhost/api/patch',
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
      const req = new Request('http://localhost/api/test', {
        method: 'GET',
        headers: {
          'x-forwarded-for': '2001:0db8:85a3::8a2e:0370:7334',
        },
      });

      const context = getRequestContext(req);

      expect(context.ip).toBe('2001:0db8:85a3::8a2e:0370:7334');
    });

    it('handles requests with multiple forwarded IPs', () => {
      const req = new Request('http://localhost/api/test', {
        method: 'GET',
        headers: {
          'x-forwarded-for': '192.168.1.1, 10.0.0.1, 172.16.0.1',
        },
      });

      const context = getRequestContext(req);

      expect(context.ip).toBe('192.168.1.1');
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
