/**
 * Test suite for assertion helpers used in middleware tests
 * Ensures proper validation of redirect, next, json, and header operations
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  expectRedirectCalledWith,
  expectNextCalled,
  expectJsonCalled,
  expectHeaderSet
} from './assertions';

describe('Assertion Helpers', () => {
  describe('expectRedirectCalledWith', () => {
    let mockRedirect: jest.Mock;

    beforeEach(() => {
      mockRedirect = jest.fn();
    });

    it('should validate exact absolute URL match', () => {
      mockRedirect.mockImplementation((url: string) => url);
      mockRedirect('https://example.com/path');

      expect(() => {
        expectRedirectCalledWith(mockRedirect, 'https://example.com/path');
      }).not.toThrow();
    });

    it('should validate http URL match', () => {
      mockRedirect.mockImplementation((url: string) => url);
      mockRedirect('http://example.com/redirect');

      expect(() => {
        expectRedirectCalledWith(mockRedirect, 'http://example.com/redirect');
      }).not.toThrow();
    });

    it('should extract and validate path from full URL', () => {
      mockRedirect.mockImplementation((url: string) => url);
      mockRedirect('https://example.com/auth/signin?callbackUrl=/dashboard');

      expect(() => {
        expectRedirectCalledWith(mockRedirect, '/auth/signin?callbackUrl=/dashboard');
      }).not.toThrow();
    });

    it('should validate path without query string', () => {
      mockRedirect.mockImplementation((url: string) => url);
      mockRedirect('https://example.com/profile');

      expect(() => {
        expectRedirectCalledWith(mockRedirect, '/profile');
      }).not.toThrow();
    });

    it('should validate regex pattern match', () => {
      mockRedirect.mockImplementation((url: string) => url);
      mockRedirect('https://example.com/users/123');

      expect(() => {
        expectRedirectCalledWith(mockRedirect, /^\/users\/\d+$/);
      }).not.toThrow();
    });

    it('should handle relative paths directly', () => {
      mockRedirect.mockImplementation((url: string) => url);
      mockRedirect('/relative/path');

      expect(() => {
        expectRedirectCalledWith(mockRedirect, '/relative/path');
      }).not.toThrow();
    });

    it('should throw error when redirect not called', () => {
      expect(() => {
        expectRedirectCalledWith(mockRedirect, '/any/path');
      }).toThrow('mockRedirect was not called');
    });

    it('should fail on URL mismatch', () => {
      mockRedirect.mockImplementation((url: string) => url);
      mockRedirect('https://example.com/wrong');

      expect(() => {
        expectRedirectCalledWith(mockRedirect, '/expected');
      }).toThrow();
    });

    it('should fail on regex mismatch', () => {
      mockRedirect.mockImplementation((url: string) => url);
      mockRedirect('https://example.com/users/abc');

      expect(() => {
        expectRedirectCalledWith(mockRedirect, /^\/users\/\d+$/);
      }).toThrow();
    });

    it('should handle URL with complex query parameters', () => {
      mockRedirect.mockImplementation((url: string) => url);
      mockRedirect('https://example.com/search?q=test&filter=all&page=2');

      expect(() => {
        expectRedirectCalledWith(mockRedirect, '/search?q=test&filter=all&page=2');
      }).not.toThrow();
    });

    it('should handle URL with hash fragments', () => {
      mockRedirect.mockImplementation((url: string) => url);
      mockRedirect('https://example.com/docs#section-1');

      expect(() => {
        expectRedirectCalledWith(mockRedirect, '/docs');
      }).not.toThrow();
    });

    it('should handle invalid URL gracefully', () => {
      mockRedirect.mockImplementation((url: string) => url);
      mockRedirect('not-a-valid-url');

      expect(() => {
        expectRedirectCalledWith(mockRedirect, 'not-a-valid-url');
      }).not.toThrow();
    });
  });

  describe('expectNextCalled', () => {
    let mockNext: jest.Mock;

    beforeEach(() => {
      mockNext = jest.fn();
    });

    it('should validate that next() was called', () => {
      mockNext();

      expect(() => {
        expectNextCalled(mockNext);
      }).not.toThrow();
    });

    it('should fail when next() was not called', () => {
      expect(() => {
        expectNextCalled(mockNext);
      }).toThrow();
    });

    it('should validate next() called multiple times', () => {
      mockNext();
      mockNext();

      expect(() => {
        expectNextCalled(mockNext);
      }).not.toThrow();
    });
  });

  describe('expectJsonCalled', () => {
    let mockJson: jest.Mock;

    beforeEach(() => {
      mockJson = jest.fn();
    });

    it('should validate that json() was called', () => {
      mockJson({ success: true });

      expect(() => {
        expectJsonCalled(mockJson);
      }).not.toThrow();
    });

    it('should fail when json() was not called', () => {
      expect(() => {
        expectJsonCalled(mockJson);
      }).toThrow();
    });

    it('should validate json() called with different payloads', () => {
      mockJson({ error: 'Not found', status: 404 });

      expect(() => {
        expectJsonCalled(mockJson);
      }).not.toThrow();
    });

    it('should validate json() called multiple times', () => {
      mockJson({ data: 1 });
      mockJson({ data: 2 });

      expect(() => {
        expectJsonCalled(mockJson);
      }).not.toThrow();
    });
  });

  describe('expectHeaderSet', () => {
    let mockHeaderSet: jest.Mock;

    beforeEach(() => {
      mockHeaderSet = jest.fn();
    });

    it('should validate header was set with correct key and value', () => {
      mockHeaderSet('Content-Type', 'application/json');

      expect(() => {
        expectHeaderSet(mockHeaderSet, 'Content-Type', 'application/json');
      }).not.toThrow();
    });

    it('should validate authorization header', () => {
      mockHeaderSet('Authorization', 'Bearer token123');

      expect(() => {
        expectHeaderSet(mockHeaderSet, 'Authorization', 'Bearer token123');
      }).not.toThrow();
    });

    it('should validate custom headers', () => {
      mockHeaderSet('X-Custom-Header', 'custom-value');

      expect(() => {
        expectHeaderSet(mockHeaderSet, 'X-Custom-Header', 'custom-value');
      }).not.toThrow();
    });

    it('should fail when header not set', () => {
      expect(() => {
        expectHeaderSet(mockHeaderSet, 'Content-Type', 'application/json');
      }).toThrow();
    });

    it('should fail on key mismatch', () => {
      mockHeaderSet('Content-Type', 'application/json');

      expect(() => {
        expectHeaderSet(mockHeaderSet, 'Accept', 'application/json');
      }).toThrow();
    });

    it('should fail on value mismatch', () => {
      mockHeaderSet('Content-Type', 'text/html');

      expect(() => {
        expectHeaderSet(mockHeaderSet, 'Content-Type', 'application/json');
      }).toThrow();
    });

    it('should validate multiple header calls', () => {
      mockHeaderSet('Content-Type', 'application/json');
      mockHeaderSet('Authorization', 'Bearer token');

      expect(() => {
        expectHeaderSet(mockHeaderSet, 'Content-Type', 'application/json');
      }).not.toThrow();

      expect(() => {
        expectHeaderSet(mockHeaderSet, 'Authorization', 'Bearer token');
      }).not.toThrow();
    });

    it('should validate cache control headers', () => {
      mockHeaderSet('Cache-Control', 'no-cache, no-store, must-revalidate');

      expect(() => {
        expectHeaderSet(mockHeaderSet, 'Cache-Control', 'no-cache, no-store, must-revalidate');
      }).not.toThrow();
    });
  });
});
