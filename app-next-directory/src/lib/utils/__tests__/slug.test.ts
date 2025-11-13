import { describe, expect, it } from '@jest/globals';

import { toSlug } from '../slug';

describe('toSlug', () => {
  it('normalises casing and trims repeated whitespace', () => {
    expect(toSlug('Eco Hub!')).toBe('eco-hub');
    expect(toSlug('  Sustainable    Retreat  ')).toBe('sustainable-retreat');
  });

  it('strips punctuation and symbols for stable slugs', () => {
    expect(toSlug('Zero Waste @ Chiang Mai')).toBe('zero-waste-chiang-mai');
    expect(toSlug('Eco++ Hub??')).toBe('eco-hub');
  });

  it('transliterates locale-specific characters', () => {
    expect(toSlug('São Paulo Haven')).toBe('sao-paulo-haven');
    expect(toSlug('Café del Mar')).toBe('cafe-del-mar');
  });
});
