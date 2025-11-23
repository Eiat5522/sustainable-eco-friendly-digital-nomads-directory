/**
 * @jest-environment node
 */

import { describe, it, expect } from '@jest/globals';
import {
  getPriceRangeDisplay,
  getPriceRangeInfo,
  getPriceRangeEmoji,
  getAccommodationPriceDisplay,
  PRICE_RANGE_MAP,
  type PriceRange,
} from '../priceRange';

describe('priceRange', () => {
  describe('PRICE_RANGE_MAP', () => {
    it('should contain all price range categories', () => {
      expect(PRICE_RANGE_MAP).toHaveProperty('budget');
      expect(PRICE_RANGE_MAP).toHaveProperty('moderate');
      expect(PRICE_RANGE_MAP).toHaveProperty('premium');
    });

    it('should have correct structure for each category', () => {
      const categories: PriceRange[] = ['budget', 'moderate', 'premium'];
      
      categories.forEach((category) => {
        const info = PRICE_RANGE_MAP[category];
        expect(info).toHaveProperty('label');
        expect(info).toHaveProperty('estimatedRange');
        expect(info).toHaveProperty('displayText');
        expect(info).toHaveProperty('description');
        expect(typeof info.label).toBe('string');
        expect(typeof info.estimatedRange).toBe('string');
        expect(typeof info.displayText).toBe('string');
        expect(typeof info.description).toBe('string');
      });
    });

    it('should have expected values for budget category', () => {
      expect(PRICE_RANGE_MAP.budget.label).toBe('Budget');
      expect(PRICE_RANGE_MAP.budget.estimatedRange).toBe('$15-40');
      expect(PRICE_RANGE_MAP.budget.displayText).toBe('Budget ($15-40)');
    });

    it('should have expected values for moderate category', () => {
      expect(PRICE_RANGE_MAP.moderate.label).toBe('Moderate');
      expect(PRICE_RANGE_MAP.moderate.estimatedRange).toBe('$40-100');
      expect(PRICE_RANGE_MAP.moderate.displayText).toBe('Moderate ($40-100)');
    });

    it('should have expected values for premium category', () => {
      expect(PRICE_RANGE_MAP.premium.label).toBe('Premium');
      expect(PRICE_RANGE_MAP.premium.estimatedRange).toBe('$100+');
      expect(PRICE_RANGE_MAP.premium.displayText).toBe('Premium ($100+)');
    });
  });

  describe('getPriceRangeDisplay', () => {
    it('should return display text with estimate by default', () => {
      expect(getPriceRangeDisplay('budget')).toBe('Budget ($15-40)');
      expect(getPriceRangeDisplay('moderate')).toBe('Moderate ($40-100)');
      expect(getPriceRangeDisplay('premium')).toBe('Premium ($100+)');
    });

    it('should return label only when includeEstimate is false', () => {
      expect(getPriceRangeDisplay('budget', false)).toBe('Budget');
      expect(getPriceRangeDisplay('moderate', false)).toBe('Moderate');
      expect(getPriceRangeDisplay('premium', false)).toBe('Premium');
    });

    it('should return "Price on request" for invalid price range', () => {
      expect(getPriceRangeDisplay('invalid')).toBe('Price on request');
      expect(getPriceRangeDisplay('')).toBe('Price on request');
    });

    it('should return "Price on request" for undefined price range', () => {
      expect(getPriceRangeDisplay(undefined)).toBe('Price on request');
      expect(getPriceRangeDisplay()).toBe('Price on request');
    });

    it('should handle price range with explicit includeEstimate=true', () => {
      expect(getPriceRangeDisplay('budget', true)).toBe('Budget ($15-40)');
      expect(getPriceRangeDisplay('moderate', true)).toBe('Moderate ($40-100)');
    });
  });

  describe('getPriceRangeInfo', () => {
    it('should return complete info object for valid price ranges', () => {
      const budgetInfo = getPriceRangeInfo('budget');
      expect(budgetInfo).not.toBeNull();
      expect(budgetInfo?.label).toBe('Budget');
      expect(budgetInfo?.estimatedRange).toBe('$15-40');
      expect(budgetInfo?.displayText).toBe('Budget ($15-40)');
      expect(budgetInfo?.description).toBeTruthy();

      const moderateInfo = getPriceRangeInfo('moderate');
      expect(moderateInfo).not.toBeNull();
      expect(moderateInfo?.label).toBe('Moderate');

      const premiumInfo = getPriceRangeInfo('premium');
      expect(premiumInfo).not.toBeNull();
      expect(premiumInfo?.label).toBe('Premium');
    });

    it('should return null for invalid price range', () => {
      expect(getPriceRangeInfo('invalid')).toBeNull();
      expect(getPriceRangeInfo('')).toBeNull();
    });

    it('should return null for undefined price range', () => {
      expect(getPriceRangeInfo(undefined)).toBeNull();
      expect(getPriceRangeInfo()).toBeNull();
    });

    it('should return object with all required properties', () => {
      const info = getPriceRangeInfo('budget');
      expect(info).toHaveProperty('label');
      expect(info).toHaveProperty('estimatedRange');
      expect(info).toHaveProperty('displayText');
      expect(info).toHaveProperty('description');
    });
  });

  describe('getPriceRangeEmoji', () => {
    it('should return correct emoji for budget', () => {
      expect(getPriceRangeEmoji('budget')).toBe('💰');
    });

    it('should return correct emoji for moderate', () => {
      expect(getPriceRangeEmoji('moderate')).toBe('💰💰');
    });

    it('should return correct emoji for premium', () => {
      expect(getPriceRangeEmoji('premium')).toBe('💰💰💰');
    });

    it('should return single emoji for invalid price range', () => {
      expect(getPriceRangeEmoji('invalid')).toBe('💰');
      expect(getPriceRangeEmoji('')).toBe('💰');
    });

    it('should return single emoji for undefined price range', () => {
      expect(getPriceRangeEmoji(undefined)).toBe('💰');
      expect(getPriceRangeEmoji()).toBe('💰');
    });
  });

  describe('getAccommodationPriceDisplay', () => {
    it('should append "/night" for default accommodation type', () => {
      expect(getAccommodationPriceDisplay('budget')).toBe('Budget ($15-40)/night');
      expect(getAccommodationPriceDisplay('moderate')).toBe('Moderate ($40-100)/night');
      expect(getAccommodationPriceDisplay('premium')).toBe('Premium ($100+)/night');
    });

    it('should append "/day" for Workspace type', () => {
      expect(getAccommodationPriceDisplay('budget', 'Workspace')).toBe('Budget ($15-40)/day');
      expect(getAccommodationPriceDisplay('moderate', 'Workspace')).toBe('Moderate ($40-100)/day');
    });

    it('should append "/day" for Café type', () => {
      expect(getAccommodationPriceDisplay('budget', 'Café')).toBe('Budget ($15-40)/day');
      expect(getAccommodationPriceDisplay('premium', 'Café')).toBe('Premium ($100+)/day');
    });

    it('should append "/night" for other accommodation types', () => {
      expect(getAccommodationPriceDisplay('budget', 'Hotel')).toBe('Budget ($15-40)/night');
      expect(getAccommodationPriceDisplay('moderate', 'Hostel')).toBe('Moderate ($40-100)/night');
      expect(getAccommodationPriceDisplay('premium', 'Resort')).toBe('Premium ($100+)/night');
    });

    it('should handle "Price on request" with /night suffix', () => {
      expect(getAccommodationPriceDisplay(undefined)).toBe('Price on request/night');
      expect(getAccommodationPriceDisplay('')).toBe('Price on request/night');
      expect(getAccommodationPriceDisplay('invalid')).toBe('Price on request/night');
    });

    it('should handle undefined accommodation type as default', () => {
      expect(getAccommodationPriceDisplay('budget', undefined)).toBe('Budget ($15-40)/night');
    });

    it('should handle empty accommodation type as default', () => {
      expect(getAccommodationPriceDisplay('budget', '')).toBe('Budget ($15-40)/night');
    });

    it('should be case-sensitive for Workspace and Café', () => {
      // Only exact matches should use /day
      expect(getAccommodationPriceDisplay('budget', 'workspace')).toBe('Budget ($15-40)/night');
      expect(getAccommodationPriceDisplay('budget', 'WORKSPACE')).toBe('Budget ($15-40)/night');
      expect(getAccommodationPriceDisplay('budget', 'café')).toBe('Budget ($15-40)/night');
    });
  });
});
