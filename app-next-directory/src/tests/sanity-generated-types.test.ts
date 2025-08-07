/**
 * Test suite for Sanity TypeGen generated types
 * Validates that generated types work correctly with GROQ queries
 */

import { describe, it, expect } from '@jest/globals';
import type {
  Listing,
  City,
  EcoTag,
  BlogPost,
  Review
} from '../../../sanity/sanity.types';

describe('Sanity Generated Types', () => {
  describe('Type Structure Validation', () => {
    it('should have proper Listing type structure', () => {
      // Test that the Listing type has the expected structure
      const mockListing: Listing = {
        _id: 'test-id',
        _type: 'listing',
        _createdAt: '2025-01-01T00:00:00Z',
        _updatedAt: '2025-01-01T00:00:00Z',
        _rev: 'test-rev',
        name: 'Test Listing',
        amenities: [
          { _ref: 'amenity-ref', _type: 'reference', _key: 'amenity-ref' }
        ],
        coworkingDetails: {
          _type: 'coworkingDetails',
          internetSpeed: { download: 100, upload: 50 }
        }
      };

      expect(mockListing._type).toBe('listing');
      expect(mockListing.coworkingDetails?._type).toBe('coworkingDetails');
      expect(mockListing.coworkingDetails?.internetSpeed?.download).toBe(100);
    });

    it('should have proper City type structure', () => {
      const mockCity: City = {
        primaryImage: {
           _type: 'image',
           asset: {
             _ref: 'image-ref',
             _type: 'reference',
             _weak: false,
          },
           alt: 'Test image'
         },        sustainabilityScore: 85,
        highlights: ['Great for nomads', 'Eco-friendly']
      };

      expect(mockCity._id).toBe('city-id');
      expect(mockCity._type).toBe('city');
      expect(mockCity.name).toBe('Bangkok');
      expect(mockCity.country).toBe('Thailand');
      expect(mockCity.sustainabilityScore).toBe(85);
    });

    it('should have proper EcoTag type structure', () => {
      expect(mockBlogPost.title).toBe('Test Blog Post');
      expect(mockBlogPost.publishedAt).toBe('2025-01-01T00:00:00Z');
    });

    it('should have proper Review type structure', () => {
      const mockReview: Review = {
        _id: 'review-id',
        _type: 'review',
        _createdAt: '2025-01-01T00:00:00Z',
        _updatedAt: '2025-01-01T00:00:00Z',
        _rev: 'review-rev',
        author: 'John Doe',
        rating: 5,
        comment: 'Great place!',
        date: '2025-01-01'
      };

      expect(mockReview._id).toBe('review-id');
      expect(mockReview._type).toBe('review');
      expect(mockReview.author).toBe('John Doe');
      expect(mockReview.rating).toBe(5);
      expect(mockReview.comment).toBe('Great place!');
    });
  });

  describe('Optional Field Handling', () => {
    it('should handle optional fields correctly', () => {
      const minimalListing: Listing = {
        _id: 'minimal-id',
        _type: 'listing',
        _createdAt: '2025-01-01T00:00:00Z',
        _updatedAt: '2025-01-01T00:00:00Z',
        _rev: 'minimal-rev'
      };

      expect(minimalListing._id).toBe('minimal-id');
      expect(minimalListing.name).toBeUndefined();
      expect(minimalListing.amenities).toBeUndefined();
      expect(minimalListing.coworkingDetails).toBeUndefined();
    });

    it('should handle nested optional fields', () => {
      const listingWithPartialDetails: Listing = {
        _id: 'partial-id',
        _type: 'listing',
        _createdAt: '2025-01-01T00:00:00Z',
        _updatedAt: '2025-01-01T00:00:00Z',
        _rev: 'partial-rev',
        coworkingDetails: {
          _type: 'coworkingDetails',
          internetSpeed: { download: 50 }
        }
      };

      expect(listingWithPartialDetails.coworkingDetails?.internetSpeed?.download).toBe(50);
      expect(listingWithPartialDetails.coworkingDetails?.internetSpeed?.upload).toBeUndefined();
    });
  });

  describe('Reference Field Validation', () => {
    it('should handle reference fields correctly', () => {
      const listingWithReferences: Listing = {
        _id: 'ref-id',
        _type: 'listing',
        _createdAt: '2025-01-01T00:00:00Z',
        _updatedAt: '2025-01-01T00:00:00Z',
        _rev: 'ref-rev',
        amenities: [
          { _ref: 'amenity-1', _type: 'reference', _key: 'amenity-1' }
        ]
      };

      expect(listingWithReferences.amenities?.[0]?._ref).toBe('amenity-1');
      expect(listingWithReferences.amenities?.[0]?._type).toBe('reference');
      expect(listingWithReferences.amenities?.[0]?._key).toBe('amenity-1');
    });
  });

  describe('Array Field Validation', () => {
    it('should handle array fields correctly', () => {
      const listingWithArrays: Listing = {
        _id: 'array-id',
        _type: 'listing',
        _createdAt: '2025-01-01T00:00:00Z',
        _updatedAt: '2025-01-01T00:00:00Z',
        _rev: 'array-rev',
        restaurantDetails: {
          _type: 'restaurantDetails',
          cuisineType: ['thai', 'vegan'],
          priceRange: 'moderate'
        },
        coworkingDetails: {
          _type: 'coworkingDetails',
          pricingPlans: [
            { _key: 'daily', _type: 'coworkingPricingPlan', type: 'day pass', price: 10, period: 'day' }
          ]
        }
      };

      expect(Array.isArray(listingWithArrays.restaurantDetails?.cuisineType)).toBe(true);
      expect(listingWithArrays.restaurantDetails?.cuisineType?.length).toBe(2);
      expect(listingWithArrays.coworkingDetails?.pricingPlans?.[0]?.type).toBe('day pass');
    });
  });
});