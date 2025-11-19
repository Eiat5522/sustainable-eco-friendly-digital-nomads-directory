/**
 * @jest-environment node
 */

import { describe, it, expect } from '@jest/globals';
import {
  JSON_HEADERS,
  jsonPostOptions,
  jsonPatchOptions,
  jsonDeleteOptions,
} from '../request';

describe('request JSON helpers', () => {
  describe('JSON_HEADERS', () => {
    it('should define Content-Type header', () => {
      expect(JSON_HEADERS).toEqual({
        'Content-Type': 'application/json',
      });
    });
  });

  describe('jsonPostOptions', () => {
    it('should create POST request options with JSON headers', () => {
      const body = { name: 'test', value: 123 };
      const result = jsonPostOptions(body);

      expect(result.method).toBe('POST');
      expect(result.headers).toEqual({
        'Content-Type': 'application/json',
      });
      expect(result.body).toBe(JSON.stringify(body));
    });

    it('should merge additional headers', () => {
      const body = { test: 'data' };
      const result = jsonPostOptions(body, {
        headers: { 'X-Custom-Header': 'custom-value' },
      });

      expect(result.headers).toEqual({
        'Content-Type': 'application/json',
        'X-Custom-Header': 'custom-value',
      });
    });

    it('should merge additional fetch options', () => {
      const body = { test: 'data' };
      const result = jsonPostOptions(body, {
        credentials: 'include',
        mode: 'cors',
      });

      expect(result.credentials).toBe('include');
      expect(result.mode).toBe('cors');
      expect(result.method).toBe('POST');
    });

    it('should allow overriding Content-Type header', () => {
      const body = { test: 'data' };
      const result = jsonPostOptions(body, {
        headers: { 'Content-Type': 'text/plain' },
      });

      expect(result.headers).toEqual({
        'Content-Type': 'text/plain',
      });
    });

    it('should handle empty body object', () => {
      const result = jsonPostOptions({});

      expect(result.body).toBe('{}');
    });

    it('should handle arrays as body', () => {
      const body = [1, 2, 3];
      const result = jsonPostOptions(body);

      expect(result.body).toBe(JSON.stringify(body));
    });
  });

  describe('jsonPatchOptions', () => {
    it('should create PATCH request options with JSON headers', () => {
      const body = { name: 'updated' };
      const result = jsonPatchOptions(body);

      expect(result.method).toBe('PATCH');
      expect(result.headers).toEqual({
        'Content-Type': 'application/json',
      });
      expect(result.body).toBe(JSON.stringify(body));
    });

    it('should merge additional headers', () => {
      const body = { test: 'data' };
      const result = jsonPatchOptions(body, {
        headers: { 'Authorization': 'Bearer token' },
      });

      expect(result.headers).toEqual({
        'Content-Type': 'application/json',
        'Authorization': 'Bearer token',
      });
    });

    it('should merge additional fetch options', () => {
      const body = { test: 'data' };
      const result = jsonPatchOptions(body, {
        credentials: 'same-origin',
      });

      expect(result.credentials).toBe('same-origin');
      expect(result.method).toBe('PATCH');
    });
  });

  describe('jsonDeleteOptions', () => {
    it('should create DELETE request options with JSON headers and body', () => {
      const body = { id: '123' };
      const result = jsonDeleteOptions(body);

      expect(result.method).toBe('DELETE');
      expect(result.headers).toEqual({
        'Content-Type': 'application/json',
      });
      expect(result.body).toBe(JSON.stringify(body));
    });

    it('should create DELETE request options without body', () => {
      const result = jsonDeleteOptions();

      expect(result.method).toBe('DELETE');
      expect(result.headers).toEqual({
        'Content-Type': 'application/json',
      });
      expect(result.body).toBeUndefined();
    });

    it('should merge additional headers', () => {
      const body = { id: '456' };
      const result = jsonDeleteOptions(body, {
        headers: { 'X-Request-ID': 'req-123' },
      });

      expect(result.headers).toEqual({
        'Content-Type': 'application/json',
        'X-Request-ID': 'req-123',
      });
    });

    it('should merge additional fetch options', () => {
      const result = jsonDeleteOptions(undefined, {
        credentials: 'include',
      });

      expect(result.credentials).toBe('include');
      expect(result.method).toBe('DELETE');
    });

    it('should handle empty body parameter', () => {
      const result = jsonDeleteOptions(undefined);

      expect(result.body).toBeUndefined();
    });

    it('should not include body when explicitly passed as undefined', () => {
      const result = jsonDeleteOptions(undefined);

      expect('body' in result).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle nested objects in body', () => {
      const body = {
        user: { name: 'John', meta: { age: 30 } },
        tags: ['tag1', 'tag2'],
      };
      const result = jsonPostOptions(body);

      expect(result.body).toBe(JSON.stringify(body));
    });

    it('should handle special characters in body', () => {
      const body = { text: 'Hello "World" & <Friends>' };
      const result = jsonPostOptions(body);

      expect(result.body).toContain('Hello \\"World\\" & <Friends>');
    });

    it('should preserve method when merging options', () => {
      const body = { test: 'data' };
      const result = jsonPostOptions(body, {
        method: 'PUT' as any, // This should be overridden
      });

      expect(result.method).toBe('POST'); // POST should take precedence
    });
  });
});
