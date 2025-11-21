/**
 * @jest-environment node
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { logError, createRouteError, getUserFacingMessage } from '../error-handler';
import type { ErrorContext } from '../error-handler';

// We'll spy on console to verify logger calls
let consoleErrorSpy: jest.SpyInstance;

describe('Error Handler', () => {
  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('logError', () => {
    it('logs Error instance with all context fields', () => {
      const error = new Error('Test error');
      const context: ErrorContext = {
        scope: 'test-scope',
        action: 'test-action',
        userId: 'user-123',
        component: 'test-component',
        details: { extra: 'info' },
      };

      // This should not throw
      expect(() => logError(error, context)).not.toThrow();
    });

    it('logs string error', () => {
      const errorString = 'String error message';
      const context: ErrorContext = {
        scope: 'string-scope',
      };

      expect(() => logError(errorString, context)).not.toThrow();
    });

    it('logs unknown error type', () => {
      const unknownError = { someProperty: 'value' };
      const context: ErrorContext = {
        scope: 'unknown-scope',
      };

      expect(() => logError(unknownError, context)).not.toThrow();
    });
  });

  describe('createRouteError', () => {
    it('creates route error with default status 500', () => {
      const error = new Error('Route error');
      const context: ErrorContext = {
        scope: 'route',
        action: 'GET',
      };

      const response = createRouteError(error, context, 'Something went wrong');

      expect(response).toBeDefined();
      expect(response.status).toBe(500);
    });

    it('creates route error with custom status', async () => {
      const error = new Error('Not found');
      const context: ErrorContext = {
        scope: 'route',
        component: 'api',
      };

      const response = createRouteError(error, context, 'Resource not found', 404);

      expect(response).toBeDefined();
      expect(response.status).toBe(404);
      
      const json = await response.json();
      expect(json).toMatchObject({ error: 'Resource not found' });
    });

    it('handles string errors', () => {
      const errorString = 'String route error';
      const context: ErrorContext = { scope: 'route' };

      const response = createRouteError(errorString, context, 'Error occurred');

      expect(response).toBeDefined();
      expect(response.status).toBe(500);
    });

    it('handles unknown error types', () => {
      const unknownError = { code: 'UNKNOWN' };
      const context: ErrorContext = { scope: 'route' };

      const response = createRouteError(unknownError, context, 'Unknown error occurred', 500);

      expect(response).toBeDefined();
      expect(response.status).toBe(500);
    });
  });

  describe('getUserFacingMessage', () => {
    it('returns error message from Error instance', () => {
      const error = new Error('User-friendly error');
      const message = getUserFacingMessage(error);
      expect(message).toBe('User-friendly error');
    });

    it('returns string error as-is', () => {
      const errorString = 'Direct error message';
      const message = getUserFacingMessage(errorString);
      expect(message).toBe('Direct error message');
    });

    it('returns fallback message for unknown error types', () => {
      const unknownError = { someProperty: 'value' };
      const message = getUserFacingMessage(unknownError);
      expect(message).toBe('Something went wrong. Please try again.');
    });

    it('returns custom fallback message when provided', () => {
      const unknownError = { someProperty: 'value' };
      const customFallback = 'Custom error message';
      const message = getUserFacingMessage(unknownError, customFallback);
      expect(message).toBe('Custom error message');
    });

    it('returns fallback for null error', () => {
      const message = getUserFacingMessage(null);
      expect(message).toBe('Something went wrong. Please try again.');
    });

    it('returns fallback for undefined error', () => {
      const message = getUserFacingMessage(undefined);
      expect(message).toBe('Something went wrong. Please try again.');
    });

    it('returns Error message even when custom fallback is provided', () => {
      const error = new Error('Specific error');
      const customFallback = 'This should not be used';
      const message = getUserFacingMessage(error, customFallback);
      expect(message).toBe('Specific error');
    });

    it('handles Error with empty message', () => {
      const error = new Error('');
      const message = getUserFacingMessage(error);
      expect(message).toBe('Something went wrong. Please try again.');
    });

    it('handles custom Error subclasses', () => {
      class CustomError extends Error {
        constructor(message: string) {
          super(message);
          this.name = 'CustomError';
        }
      }
      
      const error = new CustomError('Custom error message');
      const message = getUserFacingMessage(error);
      expect(message).toBe('Custom error message');
    });

    it('preserves special characters in error messages', () => {
      const error = new Error('Error with special chars: @#$%^&*()');
      const message = getUserFacingMessage(error);
      expect(message).toBe('Error with special chars: @#$%^&*()');
    });
  });
});
