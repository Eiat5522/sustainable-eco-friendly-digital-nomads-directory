import { describe, expect, it } from '@jest/globals';
import { normalizeTheme, THEME_INIT_SCRIPT, type Theme, themeClass } from '@/utils/theme';
import { rootLayoutMetadata } from '../layout.metadata';

describe('layout helpers', () => {
  describe('metadata', () => {
    it('matches expected title and description', () => {
      expect(rootLayoutMetadata).toEqual({
        title: 'SustainableNomads - Eco-Friendly Digital Nomad Directory',
        description:
          'Discover sustainable coworking spaces, cafes, accommodations, and activities for conscious digital nomads worldwide.',
      });
    });
  });

  describe('normalizeTheme', () => {
    const cases: Array<[string | null | undefined, Theme]> = [
      [undefined, 'system'],
      [null, 'system'],
      ['system', 'system'],
      ['light', 'light'],
      ['dark', 'dark'],
      ['LIGHT', 'light'],
      ['  dark  ', 'dark'],
      ['invalid', 'system'],
    ];

    it.each(cases)('normalizes %p to %p', (input, expected) => {
      expect(normalizeTheme(input)).toBe(expected);
    });
  });

  describe('themeClass', () => {
    it('returns undefined for system theme', () => {
      expect(themeClass('system')).toBeUndefined();
    });

    it('returns theme name for non-system values', () => {
      expect(themeClass('dark')).toBe('dark');
      expect(themeClass('light')).toBe('light');
    });
  });

  describe('THEME_INIT_SCRIPT', () => {
    it('contains expected DOM operations', () => {
      expect(THEME_INIT_SCRIPT).toContain('document.documentElement');
      expect(THEME_INIT_SCRIPT).toContain('window.matchMedia');
      expect(THEME_INIT_SCRIPT).toContain('classList.toggle');
      expect(THEME_INIT_SCRIPT).toContain('colorScheme');
    });
  });
});
