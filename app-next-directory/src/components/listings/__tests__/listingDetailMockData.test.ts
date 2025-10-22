import {
  mockListingDetail,
  mockRelatedListings,
  mockReviews,
  formatPrice,
  formatOpeningHours,
  formatRating,
  formatDistance,
} from '../listingDetailMockData';
import {
  ListingDetailDTOSchema,
  RelatedListingDTOSchema,
  ReviewDTOSchema,
} from '../../../types/dto-schemas';
import { z } from 'zod';

describe('listingDetailMockData', () => {
  it('mockListingDetail should conform to ListingDetailDTOSchema', () => {
    const result = ListingDetailDTOSchema.safeParse(mockListingDetail);
    expect(result.success).toBe(true);
  });

  it('mockRelatedListings should be an array of RelatedListingDTOSchema', () => {
    const RelatedListingDTOArraySchema = z.array(RelatedListingDTOSchema);
    const result = RelatedListingDTOArraySchema.safeParse(mockRelatedListings);
    expect(result.success).toBe(true);
  });

  it('mockReviews should be an array of ReviewDTOSchema', () => {
    const ReviewDTOArraySchema = z.array(ReviewDTOSchema);
    const result = ReviewDTOArraySchema.safeParse(mockReviews);
    expect(result.success).toBe(true);
  });

  describe('formatPrice', () => {
    it('should format the price with currency and unit', () => {
      expect(formatPrice(8500, 'THB', 'night')).toBe('THB 8,500/night');
    });

    it('should format the price with only currency', () => {
      expect(formatPrice(1000, 'USD')).toBe('$1,000');
    });

    it('should format the price with default currency', () => {
      expect(formatPrice(500)).toBe('THB 500');
    });
  });

  describe('formatOpeningHours', () => {
    it('should format the opening hours', () => {
      const hours = [
        { day: 'Monday', opens: '9:00 AM', closes: '5:00 PM' },
        { day: 'Tuesday', opens: '9:00 AM', closes: '5:00 PM' },
      ];
      expect(formatOpeningHours(hours)).toBe('Monday: 9:00 AM - 5:00 PM, Tuesday: 9:00 AM - 5:00 PM');
    });

    it('should return "Hours not available" for empty array', () => {
      expect(formatOpeningHours([])).toBe('Hours not available');
    });

    it('should return "Hours not available" for null or undefined', () => {
      expect(formatOpeningHours(null)).toBe('Hours not available');
      expect(formatOpeningHours(undefined)).toBe('Hours not available');
    });
  });

  describe('formatRating', () => {
    it('should format the rating', () => {
      expect(formatRating(4.5)).toBe('4.5 stars');
    });

    it('should format the rating with one decimal place', () => {
      expect(formatRating(4)).toBe('4.0 stars');
    });
  });

  describe('formatDistance', () => {
    it('should format the distance in meters', () => {
      expect(formatDistance(0.5)).toBe('500m');
    });

    it('should format the distance in kilometers', () => {
      expect(formatDistance(1.5)).toBe('1.5km');
    });
  });
});
