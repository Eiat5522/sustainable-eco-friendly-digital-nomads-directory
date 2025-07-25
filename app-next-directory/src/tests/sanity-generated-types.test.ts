/**
 * Test suite for Sanity TypeGen generated types
 * Validates that generated types work correctly with GROQ queries
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import type { 
  Listing,
  City,
  EcoTag,
  BlogPost,
  Review
} from '../types/sanity-generated';

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
        slug: { _type: 'slug', current: 'test-listing' },
        type: 'coworking',
        city: {
          _ref: 'city-ref',
          _type: 'reference'
        },
        location: {
          _type: 'geopoint',
          lat: 13.7563,
          lng: 100.5018
        },
        address_string: 'Test Address',
        shortDescription: 'Short description',
        longDescription: 'Long description',
        eco_focus_tags: [],
        digital_nomad_features: [],
        primaryImage: {
          _type: 'image',
          asset: {
            _ref: 'image-ref',
            _type: 'reference'
          },
          alt: 'Test image'
        },
        moderation: {
          status: 'published',
          featured: true,
          verificationStatus: 'verified'
        }
      };

      // Validate structure
      expect(mockListing._id).toBe('test-id');
      expect(mockListing._type).toBe('listing');
      expect(mockListing.name).toBe('Test Listing');
      expect(mockListing.type).toBe('coworking');
      
      // Check optional fields are properly typed
      if (mockListing.location) {
        expect(mockListing.location.lat).toBe(13.7563);
      }
      if (mockListing.moderation) {
        expect(mockListing.moderation.status).toBe('published');
      }
    });

    it('should have proper City type structure', () => {
      const mockCity: City = {
        _id: 'city-id',
        _type: 'city',
        _createdAt: '2025-01-01T00:00:00Z',
        _updatedAt: '2025-01-01T00:00:00Z',
        _rev: 'city-rev',
        title: 'Bangkok',
        slug: { _type: 'slug', current: 'bangkok' },
        country: 'Thailand',
        description: 'City description',
        sustainabilityScore: 85,
        highlights: ['Great for nomads', 'Eco-friendly']
      };

      expect(mockCity._id).toBe('city-id');
      expect(mockCity._type).toBe('city');
      expect(mockCity.title).toBe('Bangkok');
      expect(mockCity.country).toBe('Thailand');
      expect(mockCity.sustainabilityScore).toBe(85);
    });

    it('should have proper EcoTag type structure', () => {
      const mockEcoTag: EcoTag = {
        _id: 'eco-tag-id',
        _type: 'ecoTag',
        _createdAt: '2025-01-01T00:00:00Z',
        _updatedAt: '2025-01-01T00:00:00Z',
        _rev: 'eco-tag-rev',
        name: 'Solar Powered',
        description: 'Uses solar energy'
      };

      expect(mockEcoTag._id).toBe('eco-tag-id');
      expect(mockEcoTag._type).toBe('ecoTag');
      expect(mockEcoTag.name).toBe('Solar Powered');
      expect(mockEcoTag.description).toBe('Uses solar energy');
    });

    it('should have proper BlogPost type structure', () => {
      const mockBlogPost: BlogPost = {
        _id: 'blog-post-id',
        _type: 'blogPost',
        _createdAt: '2025-01-01T00:00:00Z',
        _updatedAt: '2025-01-01T00:00:00Z',
        _rev: 'blog-post-rev',
        title: 'Test Blog Post',
        slug: { _type: 'slug', current: 'test-blog-post' },
        author: {
          _ref: 'author-ref',
          _type: 'reference'
        },
        publishedAt: '2025-01-01T00:00:00Z'
      };

      expect(mockBlogPost._id).toBe('blog-post-id');
      expect(mockBlogPost._type).toBe('blogPost');
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

  describe('Enum Value Validation', () => {
    it('should enforce proper type enum values', () => {
      const validCategories: Array<Listing['type']> = [
        'coworking',
        'cafe', 
        'accommodation',
        'restaurant',
        'activities'
      ];

      validCategories.forEach(type => {
        const listing: Partial<Listing> = { type };
        expect(listing.type).toBe(type);
      });
    });

    it('should enforce proper moderation status enum values', () => {
      const validStatuses: Array<NonNullable<Listing['moderation']>['status']> = [
        'draft',
        'pending', 
        'published',
        'archived',
        'flagged'
      ];

      validStatuses.forEach(status => {
        const moderation: NonNullable<Listing['moderation']> = { status };
        expect(moderation.status).toBe(status);
      });
    });

    it('should enforce proper verification status enum values', () => {
      const validVerificationStatuses: Array<NonNullable<Listing['moderation']>['verificationStatus']> = [
        'unverified',
        'verified',
        'needs_verification'
      ];

      validVerificationStatuses.forEach(verificationStatus => {
        const moderation: NonNullable<Listing['moderation']> = { verificationStatus };
        expect(moderation.verificationStatus).toBe(verificationStatus);
      });
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
      expect(minimalListing.location).toBeUndefined();
      expect(minimalListing.moderation).toBeUndefined();
    });

    it('should handle nested optional fields', () => {
      const listingWithPartialModeration: Listing = {
        _id: 'partial-id',
        _type: 'listing',
        _createdAt: '2025-01-01T00:00:00Z',
        _updatedAt: '2025-01-01T00:00:00Z',
        _rev: 'partial-rev',
        moderation: {
          status: 'published'
          // featured and verificationStatus are optional
        }
      };

      expect(listingWithPartialModeration.moderation?.status).toBe('published');
      expect(listingWithPartialModeration.moderation?.featured).toBeUndefined();
      expect(listingWithPartialModeration.moderation?.verificationStatus).toBeUndefined();
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
        city: {
          _ref: 'city-reference-id',
          _type: 'reference'
        },
        eco_focus_tags: [
          {
            _ref: 'eco-tag-1',
            _type: 'reference',
            _key: 'tag-key-1'
          }
        ]
      };

      expect(listingWithReferences.city?._ref).toBe('city-reference-id');
      expect(listingWithReferences.city?._type).toBe('reference');
      expect(listingWithReferences.eco_focus_tags?.[0]?._ref).toBe('eco-tag-1');
      expect(listingWithReferences.eco_focus_tags?.[0]?._key).toBe('tag-key-1');
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
        digital_nomad_features: ['wifi', 'power-outlets', 'quiet-space'],
        source_urls: ['https://example.com', 'https://another.com']
      };

      expect(Array.isArray(listingWithArrays.digital_nomad_features)).toBe(true);
      expect(listingWithArrays.digital_nomad_features?.length).toBe(3);
      expect(listingWithArrays.digital_nomad_features?.[0]).toBe('wifi');
      
      expect(Array.isArray(listingWithArrays.source_urls)).toBe(true);
      expect(listingWithArrays.source_urls?.length).toBe(2);
      expect(listingWithArrays.source_urls?.[0]).toBe('https://example.com');
    });
  });
});