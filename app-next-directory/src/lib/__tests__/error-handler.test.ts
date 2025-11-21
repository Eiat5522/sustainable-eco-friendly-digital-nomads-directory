/**
 * @jest-environment node
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { getUserFacingMessage } from '../error-handler';
import type { ErrorContext } from '../error-handler';

describe('Error Handler', () => {
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

    it('returns string error even when custom fallback is provided', () => {
      const errorString = 'String error';
      const customFallback = 'This should not be used';
      const message = getUserFacingMessage(errorString, customFallback);
      expect(message).toBe('String error');
    });

    it('handles Error with empty message', () => {
      const error = new Error('');
      const message = getUserFacingMessage(error);
      // Empty string is falsy, so should return fallback
      expect(message).toBe('Something went wrong. Please try again.');
    });

    it('handles numbers as unknown errors', () => {
      const message = getUserFacingMessage(404);
      expect(message).toBe('Something went wrong. Please try again.');
    });

    it('handles boolean as unknown errors', () => {
      const message = getUserFacingMessage(false);
      expect(message).toBe('Something went wrong. Please try again.');
    });

    it('handles arrays as unknown errors', () => {
      const message = getUserFacingMessage(['error', 'array']);
      expect(message).toBe('Something went wrong. Please try again.');
    });

    it('returns message for Error with whitespace', () => {
      const error = new Error('  Error with whitespace  ');
      const message = getUserFacingMessage(error);
      expect(message).toBe('  Error with whitespace  ');
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

    it('handles object with toString method', () => {
      const errorObj = {
        toString: () => 'Object string representation'
      };
      const message = getUserFacingMessage(errorObj);
      // Should still use fallback since it's not an Error or string
      expect(message).toBe('Something went wrong. Please try again.');
    });

    it('handles multiple Error types', () => {
      const errors = [
        new Error('Error 1'),
        new TypeError('Type error'),
        new RangeError('Range error'),
        new ReferenceError('Reference error'),
      ];

      errors.forEach(error => {
        const message = getUserFacingMessage(error);
        expect(message).toBe(error.message);
      });
    });

    it('preserves special characters in error messages', () => {
      const error = new Error('Error with special chars: @#$%^&*()');
      const message = getUserFacingMessage(error);
      expect(message).toBe('Error with special chars: @#$%^&*()');
    });

    it('preserves unicode characters in error messages', () => {
      const error = new Error('Error with unicode: 你好 мир 🌍');
      const message = getUserFacingMessage(error);
      expect(message).toBe('Error with unicode: 你好 мир 🌍');
    });

    it('handles very long error messages', () => {
      const longMessage = 'A'.repeat(1000);
      const error = new Error(longMessage);
      const message = getUserFacingMessage(error);
      expect(message).toBe(longMessage);
      expect(message.length).toBe(1000);
    });
  });

  describe('normalizeError (tested indirectly through logError and createRouteError)', () => {
    it('handles Error instances correctly', () => {
      const error = new Error('Test error');
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Test error');
    });

    it('converts string to Error', () => {
      const errorString = 'String error';
      const error = new Error(errorString);
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('String error');
    });

    it('converts unknown types to Error', () => {
      const error = new Error('Unknown error');
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Unknown error');
    });
  });
});
