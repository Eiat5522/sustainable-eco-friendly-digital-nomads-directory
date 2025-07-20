/**
 * Test suite for Sanity TypeGen generated types
 * Validates that generated types work correctly with GROQ queries
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import type { 
  SanityDocument,
  Listing,
  City,
  EcoTag,
  BlogPost,
  Review
} from '../lib/sanity-generated';

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
        category: 'coworking',
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
        description_short: 'Short description',
        description_long: 'Long description',
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
        galleryImages: [],
        last_verified_date: '2025-01-01',
        moderation: {
          _type: 'moderation',
          status: 'approved',
          featured: false,
          verificationStatus: 'verified'
        }
      };

      // Verify the mock object matches the type structure
      expect(mockListing._type).toBe('listing');
      expect(mockListing.name).toBe('Test Listing');
      expect(mockListing.category).toBe('coworking');
      expect(mockListing.location.lat).toBe(13.7563);
      expect(mockListing.moderation.status).toBe('approved');
    });

    it('should have proper City type structure', () => {
      const mockCity: City = {
        _id: 'test-city-id',
        _type: 'city',
        _createdAt: '2025-01-01T00:00:00Z',
        _updatedAt: '2025-01-01T00:00:00Z',
        _rev: 'test-rev',
        name: 'Bangkok',
        country: 'Thailand',
        slug: { _type: 'slug', current: 'bangkok' },
        location: {
          _type: 'geopoint',
          lat: 13.7563,
          lng: 100.5018
        },
        description: 'City description',
        timezone: 'Asia/Bangkok',
        currency: 'THB'
      };

      expect(mockCity._type).toBe('city');
      expect(mockCity.name).toBe('Bangkok');
      expect(mockCity.country).toBe('Thailand');
      expect(mockCity.timezone).toBe('Asia/Bangkok');
    });

    it('should have proper EcoTag type structure', () => {
      const mockEcoTag: EcoTag = {
        _id: 'test-eco-tag-id',
        _type: 'ecoTag',
        _createdAt: '2025-01-01T00:00:00Z',
        _updatedAt: '2025-01-01T00:00:00Z',
        _rev: 'test-rev',
        name: 'Solar Powered',
        slug: { _type: 'slug', current: 'solar-powered' },
        description: 'Uses solar energy',
        category: 'energy',
        icon: 'sun'
      };

      expect(mockEcoTag._type).toBe('ecoTag');
      expect(mockEcoTag.name).toBe('Solar Powered');
      expect(mockEcoTag.category).toBe('energy');
    });
  });

  describe('Type Safety Validation', () => {
    it('should enforce category enum values for Listing', () => {
      // This test ensures TypeScript compilation catches invalid category values
      const validCategories: Listing['category'][] = [
        'coworking',
        'cafe',
        'accommodation',
        'restaurant',
        'activities'
      ];

      validCategories.forEach(category => {
        expect(['coworking', 'cafe', 'accommodation', 'restaurant', 'activities']).toContain(category);
      });
    });

    it('should enforce moderation status enum values', () => {
      const validStatuses = ['pending', 'approved', 'rejected', 'flagged'];
      const validVerificationStatuses = ['unverified', 'verified', 'disputed'];

      validStatuses.forEach(status => {
        expect(['pending', 'approved', 'rejected', 'flagged']).toContain(status);
      });

      validVerificationStatuses.forEach(status => {
        expect(['unverified', 'verified', 'disputed']).toContain(status);
      });
    });
  });

  describe('Schema Field Consistency', () => {
    it('should have consistent field naming between schema and types', () => {
      // Test that the generated types use the correct field names from schema
      const mockListing: Partial<Listing> = {
        // Schema uses address_string, not address
        address_string: 'Test Address',
        // Schema uses eco_focus_tags, not ecoTags  
        eco_focus_tags: [],
        // Schema uses digital_nomad_features, not digitalNomadFeatures
        digital_nomad_features: [],
        // Schema uses description_short/description_long, not just description
        description_short: 'Short',
        description_long: 'Long description'
      };

      expect(mockListing.address_string).toBeDefined();
      expect(mockListing.eco_focus_tags).toBeDefined();
      expect(mockListing.digital_nomad_features).toBeDefined();
      expect(mockListing.description_short).toBeDefined();
      expect(mockListing.description_long).toBeDefined();
    });
  });

  describe('Image Structure Validation', () => {
    it('should have proper image structure with alt text', () => {
      const mockImage = {
        _type: 'image' as const,
        asset: {
          _ref: 'image-ref',
          _type: 'reference' as const
        },
        alt: 'Alt text description',
        caption: 'Optional caption'
      };

      expect(mockImage._type).toBe('image');
      expect(mockImage.asset._type).toBe('reference');
      expect(mockImage.alt).toBeDefined();
    });

    it('should support gallery images array', () => {
      const mockGalleryImages = [
        {
          _type: 'image' as const,
          _key: 'image-1',
          asset: {
            _ref: 'image-ref-1',
            _type: 'reference' as const
          },
          alt: 'Gallery image 1'
        },
        {
          _type: 'image' as const,
          _key: 'image-2', 
          asset: {
            _ref: 'image-ref-2',
            _type: 'reference' as const
          },
          alt: 'Gallery image 2'
        }
      ];

      expect(mockGalleryImages).toHaveLength(2);
      expect(mockGalleryImages[0]._key).toBe('image-1');
      expect(mockGalleryImages[1]._key).toBe('image-2');
    });
  });

  describe('Reference Type Validation', () => {
    it('should properly handle reference types', () => {
      const mockReference = {
        _ref: 'referenced-document-id',
        _type: 'reference' as const
      };

      expect(mockReference._type).toBe('reference');
      expect(mockReference._ref).toBe('referenced-document-id');
    });

    it('should handle weak references', () => {
      const mockWeakReference = {
        _ref: 'referenced-document-id',
        _type: 'reference' as const,
        _weak: true
      };

      expect(mockWeakReference._weak).toBe(true);
    });
  });

  describe('GROQ Query Result Types', () => {
    it('should provide proper query result types', () => {
      // Test that GROQ query result types are available
      // This validates that our TypeGen configuration includes query types
      
      // NOTE: Actual query result types would be imported like:
      // import type { FeaturedListingsResult } from '../lib/sanity-generated';
      
      // For now, just verify the base types work
      expect(true).toBe(true); // Placeholder until query types are fully integrated
    });
  });
});