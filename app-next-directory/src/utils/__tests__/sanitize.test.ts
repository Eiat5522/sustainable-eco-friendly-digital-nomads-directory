/**
 * @jest-environment node
 */

import { describe, it, expect } from '@jest/globals';
import {
  sanitizeBasic,
  escapeGroqLiteral,
  escapeGroqMatch,
  sanitizeStringArray,
  clampInt,
} from '../sanitize';

describe('sanitize', () => {
  describe('sanitizeBasic', () => {
    it('should trim whitespace from input', () => {
      expect(sanitizeBasic('  hello  ')).toBe('hello');
      expect(sanitizeBasic('\n\ttest\t\n')).toBe('test');
    });

    it('should remove control characters', () => {
      expect(sanitizeBasic('hello\u0000world')).toBe('helloworld');
      expect(sanitizeBasic('test\u001Fdata')).toBe('testdata');
      expect(sanitizeBasic('foo\u007Fbar')).toBe('foobar');
    });

    it('should limit length to maxLen parameter', () => {
      const longString = 'a'.repeat(300);
      expect(sanitizeBasic(longString, 100).length).toBe(100);
      expect(sanitizeBasic(longString, 50).length).toBe(50);
    });

    it('should use default maxLen of 200', () => {
      const longString = 'a'.repeat(300);
      expect(sanitizeBasic(longString).length).toBe(200);
    });

    it('should return original string if shorter than maxLen', () => {
      expect(sanitizeBasic('short', 100)).toBe('short');
      expect(sanitizeBasic('test')).toBe('test');
    });

    it('should return empty string for non-string input', () => {
      // @ts-ignore - testing runtime behavior
      expect(sanitizeBasic(null)).toBe('');
      // @ts-ignore - testing runtime behavior
      expect(sanitizeBasic(undefined)).toBe('');
      // @ts-ignore - testing runtime behavior
      expect(sanitizeBasic(123)).toBe('');
      // @ts-ignore - testing runtime behavior
      expect(sanitizeBasic({})).toBe('');
    });

    it('should handle empty string', () => {
      expect(sanitizeBasic('')).toBe('');
    });

    it('should handle strings with only whitespace', () => {
      expect(sanitizeBasic('   ')).toBe('');
      expect(sanitizeBasic('\n\t\r')).toBe('');
    });

    it('should handle strings with mixed content', () => {
      const mixed = '  hello\u0000\u001F world\u007F test  ';
      expect(sanitizeBasic(mixed)).toBe('hello world test');
    });
  });

  describe('escapeGroqLiteral', () => {
    it('should escape special characters for GROQ literals', () => {
      expect(escapeGroqLiteral('hello"world')).toBe('hello\\"world');
      expect(escapeGroqLiteral("it's")).toBe("it's");
    });

    it('should handle backslashes', () => {
      expect(escapeGroqLiteral('path\\to\\file')).toBe('path\\\\to\\\\file');
    });

    it('should handle newlines and tabs', () => {
      expect(escapeGroqLiteral('line1\nline2')).toBe('line1\\nline2');
      expect(escapeGroqLiteral('col1\tcol2')).toBe('col1\\tcol2');
    });

    it('should return empty string for non-string input', () => {
      // @ts-ignore - testing runtime behavior
      expect(escapeGroqLiteral(null)).toBe('');
      // @ts-ignore - testing runtime behavior
      expect(escapeGroqLiteral(undefined)).toBe('');
    });

    it('should handle empty string', () => {
      expect(escapeGroqLiteral('')).toBe('');
    });

    it('should handle plain strings without special characters', () => {
      expect(escapeGroqLiteral('hello world')).toBe('hello world');
      expect(escapeGroqLiteral('test123')).toBe('test123');
    });

    it('should properly escape JSON-like strings', () => {
      const jsonStr = '{"key":"value"}';
      const escaped = escapeGroqLiteral(jsonStr);
      expect(escaped).toContain('\\"');
    });
  });

  describe('escapeGroqMatch', () => {
    it('should escape regex special characters', () => {
      expect(escapeGroqMatch('test*')).toBe('test\\*');
      expect(escapeGroqMatch('test?')).toBe('test\\?');
      expect(escapeGroqMatch('test.')).toBe('test\\.');
      expect(escapeGroqMatch('test+')).toBe('test\\+');
      expect(escapeGroqMatch('test^')).toBe('test\\^');
      expect(escapeGroqMatch('test$')).toBe('test\\$');
    });

    it('should escape brackets and braces', () => {
      expect(escapeGroqMatch('test[a]')).toBe('test\\[a\\]');
      expect(escapeGroqMatch('test{a}')).toBe('test\\{a\\}');
      expect(escapeGroqMatch('test(a)')).toBe('test\\(a\\)');
    });

    it('should escape backslashes', () => {
      expect(escapeGroqMatch('test\\path')).toBe('test\\\\\\\\path');
    });

    it('should escape pipe character', () => {
      expect(escapeGroqMatch('test|value')).toBe('test\\|value');
    });

    it('should keep @ and ! unescaped', () => {
      expect(escapeGroqMatch('test@email')).toBe('test@email');
      expect(escapeGroqMatch('test!important')).toBe('test!important');
    });

    it('should return empty string for non-string input', () => {
      // @ts-ignore - testing runtime behavior
      expect(escapeGroqMatch(null)).toBe('');
      // @ts-ignore - testing runtime behavior
      expect(escapeGroqMatch(undefined)).toBe('');
    });

    it('should handle empty string', () => {
      expect(escapeGroqMatch('')).toBe('');
    });

    it('should handle plain strings without special characters', () => {
      expect(escapeGroqMatch('hello world')).toBe('hello world');
      expect(escapeGroqMatch('test123')).toBe('test123');
    });

    it('should handle multiple special characters', () => {
      const input = 'test.*+?^${}()|[]\\';
      const escaped = escapeGroqMatch(input);
      expect(escaped).toContain('\\*');
      expect(escaped).toContain('\\.');
      expect(escaped).toContain('\\+');
      expect(escaped).toContain('\\?');
    });
  });

  describe('sanitizeStringArray', () => {
    it('should sanitize and return array from string', () => {
      expect(sanitizeStringArray('test')).toEqual(['test']);
      expect(sanitizeStringArray('hello world')).toEqual(['hello world']);
    });

    it('should sanitize and return array from array of strings', () => {
      expect(sanitizeStringArray(['a', 'b', 'c'])).toEqual(['a', 'b', 'c']);
      expect(sanitizeStringArray(['  test  ', 'value'])).toEqual(['test', 'value']);
    });

    it('should filter out empty strings after sanitization', () => {
      expect(sanitizeStringArray(['', '  ', 'test'])).toEqual(['test']);
      expect(sanitizeStringArray(['a', '', 'b'])).toEqual(['a', 'b']);
    });

    it('should remove duplicates while preserving order', () => {
      expect(sanitizeStringArray(['a', 'b', 'a', 'c'])).toEqual(['a', 'b', 'c']);
      expect(sanitizeStringArray(['test', 'test', 'value'])).toEqual(['test', 'value']);
    });

    it('should return empty array for undefined', () => {
      expect(sanitizeStringArray(undefined)).toEqual([]);
    });

    it('should respect custom maxLen option', () => {
      const longString = 'a'.repeat(200);
      const result = sanitizeStringArray([longString], { maxLen: 50 });
      expect(result[0].length).toBe(50);
    });

    it('should use default maxLen of 100', () => {
      const longString = 'a'.repeat(200);
      const result = sanitizeStringArray([longString]);
      expect(result[0].length).toBe(100);
    });

    it('should handle mixed valid and invalid entries', () => {
      expect(sanitizeStringArray(['valid', '', '  ', 'test'])).toEqual(['valid', 'test']);
    });

    it('should convert non-string values to strings', () => {
      // @ts-ignore - testing runtime behavior
      expect(sanitizeStringArray([123, 'test'])).toEqual(['123', 'test']);
    });

    it('should handle array with only empty values', () => {
      expect(sanitizeStringArray(['', '  ', '\t'])).toEqual([]);
    });

    it('should sanitize each string element', () => {
      expect(sanitizeStringArray(['  a  ', '  b  ', '  c  '])).toEqual(['a', 'b', 'c']);
    });
  });

  describe('clampInt', () => {
    it('should return value within range', () => {
      expect(clampInt(5)).toBe(5);
      expect(clampInt(50)).toBe(50);
      expect(clampInt(100)).toBe(100);
    });

    it('should clamp value to max if too high', () => {
      expect(clampInt(150)).toBe(100);
      expect(clampInt(200)).toBe(100);
      expect(clampInt(1000)).toBe(100);
    });

    it('should clamp value to min if too low', () => {
      expect(clampInt(0)).toBe(1);
      expect(clampInt(-5)).toBe(1);
      expect(clampInt(-100)).toBe(1);
    });

    it('should use custom min and max', () => {
      expect(clampInt(5, { min: 10, max: 50 })).toBe(10);
      expect(clampInt(60, { min: 10, max: 50 })).toBe(50);
      expect(clampInt(30, { min: 10, max: 50 })).toBe(30);
    });

    it('should use custom min with default max', () => {
      expect(clampInt(150, { min: 0 })).toBe(100);
      expect(clampInt(-5, { min: 0 })).toBe(0);
    });

    it('should use custom max with default min', () => {
      expect(clampInt(500, { max: 200 })).toBe(200);
      expect(clampInt(0, { max: 200 })).toBe(1);
    });

    it('should truncate decimal values', () => {
      expect(clampInt(5.7)).toBe(5);
      expect(clampInt(10.2)).toBe(10);
      expect(clampInt(99.9)).toBe(99);
    });

    it('should handle negative decimals', () => {
      expect(clampInt(-5.7)).toBe(1);
      expect(clampInt(-10.2)).toBe(1);
    });

    it('should return min for non-finite values', () => {
      expect(clampInt(NaN)).toBe(1);
      expect(clampInt(Infinity)).toBe(1);
      expect(clampInt(-Infinity)).toBe(1);
    });

    it('should return custom min for non-finite values', () => {
      expect(clampInt(NaN, { min: 0 })).toBe(0);
      expect(clampInt(Infinity, { min: 5 })).toBe(5);
      expect(clampInt(-Infinity, { min: 10 })).toBe(10);
    });

    it('should handle edge case where value equals min', () => {
      expect(clampInt(1)).toBe(1);
      expect(clampInt(10, { min: 10 })).toBe(10);
    });

    it('should handle edge case where value equals max', () => {
      expect(clampInt(100)).toBe(100);
      expect(clampInt(50, { max: 50 })).toBe(50);
    });
  });
});
