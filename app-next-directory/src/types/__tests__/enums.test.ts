import {
  LISTING_CATEGORIES,
  ListingCategory,
  type ListingType,
  MODERATION_STATUSES,
  ModerationStatus,
  type ModerationStatusType,
  PRICE_RANGES,
  PriceRange,
  type PriceRangeType,
  VERIFICATION_STATUSES,
  VerificationStatus,
  type VerificationStatusType,
} from '../enums';

describe('enums types and constants', () => {
  describe('ListingCategory enum', () => {
    it('should have all expected category values', () => {
      expect(ListingCategory.COWORKING).toBe('coworking');
      expect(ListingCategory.CAFE).toBe('cafe');
      expect(ListingCategory.ACCOMMODATION).toBe('accommodation');
      expect(ListingCategory.RESTAURANT).toBe('restaurant');
      expect(ListingCategory.ACTIVITIES).toBe('activities');
    });

    it('should be usable as a type', () => {
      const category: ListingCategory = ListingCategory.COWORKING;
      expect(category).toBe('coworking');
    });

    it('should accept all enum values', () => {
      const categories: ListingCategory[] = [
        ListingCategory.COWORKING,
        ListingCategory.CAFE,
        ListingCategory.ACCOMMODATION,
        ListingCategory.RESTAURANT,
        ListingCategory.ACTIVITIES,
      ];
      expect(categories).toHaveLength(5);
    });
  });

  describe('PriceRange enum', () => {
    it('should have all expected price range values', () => {
      expect(PriceRange.BUDGET).toBe('budget');
      expect(PriceRange.MODERATE).toBe('moderate');
      expect(PriceRange.PREMIUM).toBe('premium');
    });

    it('should be usable as a type', () => {
      const price: PriceRange = PriceRange.BUDGET;
      expect(price).toBe('budget');
    });

    it('should accept all enum values', () => {
      const ranges: PriceRange[] = [PriceRange.BUDGET, PriceRange.MODERATE, PriceRange.PREMIUM];
      expect(ranges).toHaveLength(3);
    });
  });

  describe('ModerationStatus enum', () => {
    it('should have all expected moderation status values', () => {
      expect(ModerationStatus.DRAFT).toBe('draft');
      expect(ModerationStatus.PENDING).toBe('pending');
      expect(ModerationStatus.PUBLISHED).toBe('published');
      expect(ModerationStatus.ARCHIVED).toBe('archived');
      expect(ModerationStatus.FLAGGED).toBe('flagged');
    });

    it('should be usable as a type', () => {
      const status: ModerationStatus = ModerationStatus.PUBLISHED;
      expect(status).toBe('published');
    });

    it('should accept all enum values', () => {
      const statuses: ModerationStatus[] = [
        ModerationStatus.DRAFT,
        ModerationStatus.PENDING,
        ModerationStatus.PUBLISHED,
        ModerationStatus.ARCHIVED,
        ModerationStatus.FLAGGED,
      ];
      expect(statuses).toHaveLength(5);
    });
  });

  describe('VerificationStatus enum', () => {
    it('should have all expected verification status values', () => {
      expect(VerificationStatus.UNVERIFIED).toBe('unverified');
      expect(VerificationStatus.VERIFIED).toBe('verified');
      expect(VerificationStatus.NEEDS_VERIFICATION).toBe('needs_verification');
    });

    it('should be usable as a type', () => {
      const status: VerificationStatus = VerificationStatus.VERIFIED;
      expect(status).toBe('verified');
    });

    it('should accept all enum values', () => {
      const statuses: VerificationStatus[] = [
        VerificationStatus.UNVERIFIED,
        VerificationStatus.VERIFIED,
        VerificationStatus.NEEDS_VERIFICATION,
      ];
      expect(statuses).toHaveLength(3);
    });
  });

  describe('Type aliases', () => {
    it('should support ListingType alias', () => {
      const type1: ListingType = ListingCategory.COWORKING;
      const type2: ListingType = 'cafe';
      expect(type1).toBe('coworking');
      expect(type2).toBe('cafe');
    });

    it('should support PriceRangeType alias', () => {
      const price1: PriceRangeType = PriceRange.BUDGET;
      const price2: PriceRangeType = 'premium';
      expect(price1).toBe('budget');
      expect(price2).toBe('premium');
    });

    it('should support ModerationStatusType alias', () => {
      const status1: ModerationStatusType = ModerationStatus.PUBLISHED;
      const status2: ModerationStatusType = 'draft';
      expect(status1).toBe('published');
      expect(status2).toBe('draft');
    });

    it('should support VerificationStatusType alias', () => {
      const status1: VerificationStatusType = VerificationStatus.VERIFIED;
      const status2: VerificationStatusType = 'unverified';
      expect(status1).toBe('verified');
      expect(status2).toBe('unverified');
    });
  });

  describe('LISTING_CATEGORIES constant', () => {
    it('should contain all listing categories', () => {
      expect(LISTING_CATEGORIES).toContain('coworking');
      expect(LISTING_CATEGORIES).toContain('cafe');
      expect(LISTING_CATEGORIES).toContain('accommodation');
      expect(LISTING_CATEGORIES).toContain('restaurant');
      expect(LISTING_CATEGORIES).toContain('activities');
    });

    it('should have correct length', () => {
      expect(LISTING_CATEGORIES.length).toBeGreaterThanOrEqual(5);
    });

    it('should be an array', () => {
      expect(Array.isArray(LISTING_CATEGORIES)).toBe(true);
    });
  });

  describe('PRICE_RANGES constant', () => {
    it('should contain all price ranges', () => {
      expect(PRICE_RANGES).toContain('budget');
      expect(PRICE_RANGES).toContain('moderate');
      expect(PRICE_RANGES).toContain('premium');
    });

    it('should have exactly 3 items', () => {
      expect(PRICE_RANGES).toHaveLength(3);
    });

    it('should be an array', () => {
      expect(Array.isArray(PRICE_RANGES)).toBe(true);
    });
  });

  describe('MODERATION_STATUSES constant', () => {
    it('should contain all moderation statuses', () => {
      expect(MODERATION_STATUSES).toContain('draft');
      expect(MODERATION_STATUSES).toContain('pending');
      expect(MODERATION_STATUSES).toContain('published');
      expect(MODERATION_STATUSES).toContain('archived');
      expect(MODERATION_STATUSES).toContain('flagged');
    });

    it('should have exactly 5 items', () => {
      expect(MODERATION_STATUSES).toHaveLength(5);
    });

    it('should be an array', () => {
      expect(Array.isArray(MODERATION_STATUSES)).toBe(true);
    });
  });

  describe('VERIFICATION_STATUSES constant', () => {
    it('should contain all verification statuses', () => {
      expect(VERIFICATION_STATUSES).toContain('unverified');
      expect(VERIFICATION_STATUSES).toContain('verified');
      expect(VERIFICATION_STATUSES).toContain('needs_verification');
    });

    it('should have exactly 3 items', () => {
      expect(VERIFICATION_STATUSES).toHaveLength(3);
    });

    it('should be an array', () => {
      expect(Array.isArray(VERIFICATION_STATUSES)).toBe(true);
    });
  });

  describe('Integration tests', () => {
    it('should allow enum values to be used in switch statements', () => {
      const category = ListingCategory.COWORKING;
      let result = '';

      switch (category) {
        case ListingCategory.COWORKING:
          result = 'coworking space';
          break;
        case ListingCategory.CAFE:
          result = 'cafe';
          break;
        default:
          result = 'other';
      }

      expect(result).toBe('coworking space');
    });

    it('should allow price ranges in comparisons', () => {
      const price = PriceRange.MODERATE;
      expect(price === 'moderate').toBe(true);
      expect(price === PriceRange.MODERATE).toBe(true);
    });

    it('should work with array methods', () => {
      const hasCoworking = LISTING_CATEGORIES.includes('coworking');
      expect(hasCoworking).toBe(true);
    });
  });
});
