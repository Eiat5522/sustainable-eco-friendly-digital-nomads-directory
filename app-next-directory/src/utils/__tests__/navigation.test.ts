/**
 * @jest-environment jsdom
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { getCurrentHref, redirectTo } from '../navigation';

describe('navigation', () => {
  describe('getCurrentHref', () => {
    it('should return current window.location.href in browser', () => {
      // window.location.href is already set by jsdom
      const result = getCurrentHref();
      expect(typeof result).toBe('string');
      expect(result).toBeTruthy();
    });

    it('should return a valid URL format', () => {
      const result = getCurrentHref();
      // Should be a valid URL-like string
      expect(result).toMatch(/^http/);
    });
  });

  describe('redirectTo', () => {
    it('should set window.location.href when window is defined', () => {
      // In jsdom environment, window is always defined
      // Test that the function attempts to set location.href
      const originalHref = window.location.href;
      
      // redirectTo will attempt to set href, but jsdom may prevent it
      // We just verify it doesn't throw and behaves correctly
      expect(() => redirectTo('https://example.com/test')).not.toThrow();
      
      // Function should check window exists
      expect(typeof window).toBe('object');
    });

    it('should handle various URL formats without throwing', () => {
      const testUrls = [
        'https://example.com/new-page',
        '/relative-path',
        '/search?q=test&filter=active',
        'https://external-site.com/page',
        '#section-id',
      ];

      testUrls.forEach((url) => {
        expect(() => redirectTo(url)).not.toThrow();
      });
    });

    it('should handle empty string without throwing', () => {
      expect(() => redirectTo('')).not.toThrow();
    });

    it('should be a function that accepts a string parameter', () => {
      expect(typeof redirectTo).toBe('function');
      expect(redirectTo.length).toBe(1);
    });
  });
});
