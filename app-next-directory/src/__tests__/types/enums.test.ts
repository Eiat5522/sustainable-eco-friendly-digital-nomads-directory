import {
  ListingCategory,
  PriceRange,
  ModerationStatus,
  VerificationStatus,
  ListingType,
  PriceRangeType,
  ModerationStatusType,
  VerificationStatusType,
  LISTING_CATEGORIES,
  PRICE_RANGES,
  MODERATION_STATUSES,
  VERIFICATION_STATUSES
} from '../../types/enums';

describe('Enums', () => {
  describe('ListingCategory', () => {
    it('should have all expected values', () => {
      expect(ListingCategory.COWORKING).toBe('coworking');
      expect(ListingCategory.CAFE).toBe('cafe');
      expect(ListingCategory.ACCOMMODATION).toBe('accommodation');
      expect(ListingCategory.RESTAURANT).toBe('restaurant');
      expect(ListingCategory.ACTIVITIES).toBe('activities');
    });

    it('should have exactly 5 categories', () => {
      const values = Object.values(ListingCategory);
      expect(values).toHaveLength(5);
    });

    it('should contain only expected values', () => {
      const values = Object.values(ListingCategory);
      expect(values).toEqual(
        expect.arrayContaining(['coworking', 'cafe', 'accommodation', 'restaurant', 'activities'])
      );
    });
  });

  describe('PriceRange', () => {
    it('should have all expected values', () => {
      expect(PriceRange.BUDGET).toBe('budget');
      expect(PriceRange.MODERATE).toBe('moderate');
      expect(PriceRange.PREMIUM).toBe('premium');
    });

    it('should have exactly 3 price ranges', () => {
      const values = Object.values(PriceRange);
      expect(values).toHaveLength(3);
    });

    it('should contain only expected values', () => {
      const values = Object.values(PriceRange);
      expect(values).toEqual(
        expect.arrayContaining(['budget', 'moderate', 'premium'])
      );
    });
  });

  describe('ModerationStatus', () => {
    it('should have all expected values', () => {
      expect(ModerationStatus.DRAFT).toBe('draft');
      expect(ModerationStatus.PENDING).toBe('pending');
      expect(ModerationStatus.PUBLISHED).toBe('published');
      expect(ModerationStatus.ARCHIVED).toBe('archived');
      expect(ModerationStatus.FLAGGED).toBe('flagged');
    });

    it('should have exactly 5 moderation statuses', () => {
      const values = Object.values(ModerationStatus);
      expect(values).toHaveLength(5);
    });

    it('should contain only expected values', () => {
      const values = Object.values(ModerationStatus);
      expect(values).toEqual(
        expect.arrayContaining(['draft', 'pending', 'published', 'archived', 'flagged'])
      );
    });
  });

  describe('VerificationStatus', () => {
    it('should have all expected values', () => {
      expect(VerificationStatus.UNVERIFIED).toBe('unverified');
      expect(VerificationStatus.VERIFIED).toBe('verified');
      expect(VerificationStatus.NEEDS_VERIFICATION).toBe('needs_verification');
    });

    it('should have exactly 3 verification statuses', () => {
      const values = Object.values(VerificationStatus);
      expect(values).toHaveLength(3);
    });

    it('should contain only expected values', () => {
      const values = Object.values(VerificationStatus);
      expect(values).toEqual(
        expect.arrayContaining(['unverified', 'verified', 'needs_verification'])
      );
    });
  });

  describe('Type aliases', () => {
    it('should have ListingType alias working correctly', () => {
      const category: ListingType = ListingCategory.COWORKING;
      expect(category).toBe('coworking');
    });

    it('should have PriceRangeType alias working correctly', () => {
      const price: PriceRangeType = PriceRange.BUDGET;
      expect(price).toBe('budget');
    });

    it('should have ModerationStatusType alias working correctly', () => {
      const status: ModerationStatusType = ModerationStatus.PUBLISHED;
      expect(status).toBe('published');
    });

    it('should have VerificationStatusType alias working correctly', () => {
      const status: VerificationStatusType = VerificationStatus.VERIFIED;
      expect(status).toBe('verified');
    });
  });

  describe('Helper arrays', () => {
    describe('LISTING_CATEGORIES', () => {
      it('should contain all ListingCategory values', () => {
        expect(LISTING_CATEGORIES).toEqual(Object.values(ListingCategory));
      });

      it('should have exactly 5 items', () => {
        expect(LISTING_CATEGORIES).toHaveLength(5);
      });

      it('should contain expected categories', () => {
        expect(LISTING_CATEGORIES).toContain('coworking');
        expect(LISTING_CATEGORIES).toContain('cafe');
        expect(LISTING_CATEGORIES).toContain('accommodation');
        expect(LISTING_CATEGORIES).toContain('restaurant');
        expect(LISTING_CATEGORIES).toContain('activities');
      });

      it('should be immutable when used for validation', () => {
        const categories = [...LISTING_CATEGORIES];
        categories.push('invalid' as any);
        expect(LISTING_CATEGORIES).toHaveLength(5);
      });
    });

    describe('PRICE_RANGES', () => {
      it('should contain all PriceRange values', () => {
        expect(PRICE_RANGES).toEqual(Object.values(PriceRange));
      });

      it('should have exactly 3 items', () => {
        expect(PRICE_RANGES).toHaveLength(3);
      });

      it('should contain expected price ranges', () => {
        expect(PRICE_RANGES).toContain('budget');
        expect(PRICE_RANGES).toContain('moderate');
        expect(PRICE_RANGES).toContain('premium');
      });
    });

    describe('MODERATION_STATUSES', () => {
      it('should contain all ModerationStatus values', () => {
        expect(MODERATION_STATUSES).toEqual(Object.values(ModerationStatus));
      });

      it('should have exactly 5 items', () => {
        expect(MODERATION_STATUSES).toHaveLength(5);
      });

      it('should contain expected moderation statuses', () => {
        expect(MODERATION_STATUSES).toContain('draft');
        expect(MODERATION_STATUSES).toContain('pending');
        expect(MODERATION_STATUSES).toContain('published');
        expect(MODERATION_STATUSES).toContain('archived');
        expect(MODERATION_STATUSES).toContain('flagged');
      });
    });

    describe('VERIFICATION_STATUSES', () => {
      it('should contain all VerificationStatus values', () => {
        expect(VERIFICATION_STATUSES).toEqual(Object.values(VerificationStatus));
      });

      it('should have exactly 3 items', () => {
        expect(VERIFICATION_STATUSES).toHaveLength(3);
      });

      it('should contain expected verification statuses', () => {
        expect(VERIFICATION_STATUSES).toContain('unverified');
        expect(VERIFICATION_STATUSES).toContain('verified');
        expect(VERIFICATION_STATUSES).toContain('needs_verification');
      });
    });
  });

  describe('Integration tests', () => {
    it('should validate helper arrays match their respective enums', () => {
      expect(LISTING_CATEGORIES.sort()).toEqual(Object.values(ListingCategory).sort());
      expect(PRICE_RANGES.sort()).toEqual(Object.values(PriceRange).sort());
      expect(MODERATION_STATUSES.sort()).toEqual(Object.values(ModerationStatus).sort());
      expect(VERIFICATION_STATUSES.sort()).toEqual(Object.values(VerificationStatus).sort());
    });

    it('should allow validation of category strings', () => {
      const isValidCategory = (category: string): category is ListingCategory => {
        return LISTING_CATEGORIES.includes(category as ListingCategory);
      };

      expect(isValidCategory('coworking')).toBe(true);
      expect(isValidCategory('invalid')).toBe(false);
    });

    it('should allow validation of price range strings', () => {
      const isValidPriceRange = (price: string): price is PriceRange => {
        return PRICE_RANGES.includes(price as PriceRange);
      };

      expect(isValidPriceRange('budget')).toBe(true);
      expect(isValidPriceRange('expensive')).toBe(false);
    });

    it('should allow validation of moderation status strings', () => {
      const isValidModerationStatus = (status: string): status is ModerationStatus => {
        return MODERATION_STATUSES.includes(status as ModerationStatus);
      };

      expect(isValidModerationStatus('published')).toBe(true);
      expect(isValidModerationStatus('invalid')).toBe(false);
    });

    it('should allow validation of verification status strings', () => {
      const isValidVerificationStatus = (status: string): status is VerificationStatus => {
        return VERIFICATION_STATUSES.includes(status as VerificationStatus);
      };

      expect(isValidVerificationStatus('verified')).toBe(true);
      expect(isValidVerificationStatus('invalid')).toBe(false);
    });
  });
});
