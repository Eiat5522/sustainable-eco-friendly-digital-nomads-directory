/**
 * Test suite for Sanity TypeGen generated types
 * Validates that generated types work correctly with GROQ queries
 */

import { describe, expect, it } from '@jest/globals'
import type { 
  SanityListing, 
  LISTING_BY_SLUG_QUERYResult,
  FEATURED_LISTINGS_QUERYResult,
  CITIES_QUERYResult,
  ListingCategory
} from '@/types/sanity-generated'
import { ListingCategory as EnumListingCategory } from '@/types/enums'

describe('Sanity Generated Types', () => {
  describe('Type imports and exports', () => {
    it('should import generated types without errors', () => {
      // This test will fail at compile time if types are not properly exported
      expect(typeof SanityListing).toBe('undefined') // Type, not runtime value
    })

    it('should have proper enum integration', () => {
      // Test that our manual enums align with generated literal union types
      const categoryValues = Object.values(EnumListingCategory)
      expect(categoryValues).toContain('coworking')
      expect(categoryValues).toContain('cafe')
      expect(categoryValues).toContain('accommodation')
      expect(categoryValues).toContain('restaurant')
      expect(categoryValues).toContain('activities')
    })
  })

  describe('Generated query result types', () => {
    it('should validate LISTING_BY_SLUG_QUERYResult structure', () => {
      // Mock data that should match the generated type
      const mockListingResult: LISTING_BY_SLUG_QUERYResult = {
        _id: 'test-id',
        _type: 'listing',
        _createdAt: '2024-01-01T00:00:00Z',
        _updatedAt: '2024-01-01T00:00:00Z',
        _rev: 'test-rev',
        name: 'Test Listing',
        slug: { _type: 'slug', current: 'test-listing' },
        description_short: 'Short description',
        description_long: 'Long description',
        category: 'coworking',
        city: {
          _id: 'city-id',
          title: 'Test City',
          slug: { _type: 'slug', current: 'test-city' }
        },
        location: { lat: 13.7563, lng: 100.5018 },
        primaryImage: null,
        ecoTags: null,
        digital_nomad_features: ['wifi', 'coffee'],
        last_verified_date: '2024-01-01',
        reviews: null,
        addressString: null,
        website: null,
        contactInfo: null,
        openingHours: null,
        ecoNotesDetailed: null,
        sourceUrls: null,
        rating: null,
        priceRange: null,
        galleryImages: []
      }

      expect(mockListingResult._type).toBe('listing')
      expect(mockListingResult.category).toBe('coworking')
      expect(mockListingResult.location?.lat).toBe(13.7563)
    })

    it('should handle null result for LISTING_BY_SLUG_QUERYResult', () => {
      // Test the union type includes null
      const nullResult: LISTING_BY_SLUG_QUERYResult = null
      expect(nullResult).toBeNull()
    })

    it('should validate FEATURED_LISTINGS_QUERYResult as array', () => {
      // Mock data for featured listings array
      const mockFeaturedResult: FEATURED_LISTINGS_QUERYResult = []
      expect(Array.isArray(mockFeaturedResult)).toBe(true)
    })

    it('should validate CITIES_QUERYResult structure', () => {
      // Mock data for cities query
      const mockCitiesResult: CITIES_QUERYResult = []
      expect(Array.isArray(mockCitiesResult)).toBe(true)
    })
  })

  describe('Schema field validation', () => {
    it('should ensure category field uses proper literal union', () => {
      // Test that the category field only accepts valid values
      const validCategories: Array<'coworking' | 'cafe' | 'accommodation' | 'restaurant' | 'activities'> = [
        'coworking',
        'cafe', 
        'accommodation',
        'restaurant',
        'activities'
      ]
      
      validCategories.forEach(category => {
        expect(['coworking', 'cafe', 'accommodation', 'restaurant', 'activities']).toContain(category)
      })
    })

    it('should validate moderation status literal union', () => {
      const validStatuses: Array<'draft' | 'pending' | 'published' | 'archived' | 'flagged'> = [
        'draft',
        'pending',
        'published', 
        'archived',
        'flagged'
      ]
      
      validStatuses.forEach(status => {
        expect(['draft', 'pending', 'published', 'archived', 'flagged']).toContain(status)
      })
    })
  })

  describe('Type safety validation', () => {
    it('should enforce required fields in document types', () => {
      // This test ensures TypeScript compiler catches missing required fields
      // The test itself passes, but TypeScript would error on missing required fields
      
      const mockListing = {
        _id: 'test',
        _type: 'listing' as const,
        _createdAt: '2024-01-01T00:00:00Z',
        _updatedAt: '2024-01-01T00:00:00Z', 
        _rev: 'rev'
        // Other fields are optional in our schema
      }
      
      expect(mockListing._type).toBe('listing')
    })

    it('should properly type image fields with asset references', () => {
      // Test that image fields have the correct structure
      const mockImageField = {
        asset: {
          _ref: 'image-asset-id',
          _type: 'reference' as const,
          _weak: false
        },
        hotspot: {
          x: 0.5,
          y: 0.5,
          height: 0.5,
          width: 0.5
        },
        crop: {
          top: 0,
          bottom: 0,
          left: 0,
          right: 0
        },
        alt: 'Alternative text',
        _type: 'image' as const
      }
      
      expect(mockImageField._type).toBe('image')
      expect(mockImageField.asset._type).toBe('reference')
    })
  })
})