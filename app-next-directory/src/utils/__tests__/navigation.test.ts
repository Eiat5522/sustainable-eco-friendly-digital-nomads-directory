/**
 * @jest-environment jsdom
 */

import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import { getCurrentHref, redirectTo } from '../navigation';

describe('navigation', () => {
  let originalLocation: Location;

  beforeEach(() => {
    // Save original location
    originalLocation = window.location;
  });

  afterEach(() => {
    // Restore original location if it was modified
    if (window.location !== originalLocation) {
      Object.defineProperty(window, 'location', {
        value: originalLocation,
        writable: true,
        configurable: true,
      });
    }
  });

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
      // Mock location to avoid jsdom navigation error
      const mockLocation = { href: '' };
      Object.defineProperty(window, 'location', {
        value: mockLocation,
        writable: true,
        configurable: true,
      });

      redirectTo('https://example.com/test');

      expect(window.location.href).toBe('https://example.com/test');
      expect(typeof window).toBe('object');
    });

    it('should handle various URL formats without throwing', () => {
      // Mock location to avoid jsdom navigation error
      const mockLocation = { href: '' };
      Object.defineProperty(window, 'location', {
        value: mockLocation,
        writable: true,
        configurable: true,
      });

      const testUrls = [
        'https://example.com/new-page',
        '/relative-path',
        '/search?q=test&filter=active',
        'https://external-site.com/page',
        '#section-id',
      ];

      testUrls.forEach(url => {
        expect(() => redirectTo(url)).not.toThrow();
      });
    });

    it('should handle empty string without throwing', () => {
      // Mock location to avoid jsdom navigation error
      const mockLocation = { href: '' };
      Object.defineProperty(window, 'location', {
        value: mockLocation,
        writable: true,
        configurable: true,
      });

      expect(() => redirectTo('')).not.toThrow();
    });

    it('should be a function that accepts a string parameter', () => {
      expect(typeof redirectTo).toBe('function');
      expect(redirectTo.length).toBe(1);
    });
  });
});
