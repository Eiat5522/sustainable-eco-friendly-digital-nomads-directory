/**
 * Integration tests for DTO transformation with realistic Sanity data
 * This test file validates that DTOs properly transform Sanity GROQ query results
 * into clean, frontend-optimized data shapes.
 */

import { describe, expect, it } from '@jest/globals';
import {
  transformToFeaturedDTO,
  transformToSummaryDTO,
  transformToDetailDTO,
  transformToBlogSummaryDTO,
  transformToBlogDetailDTO,
} from '@/lib/dto-transformer';
import type { SanityListing } from '@/types/sanity.types';
import type {
  FeaturedListingDTO,
  ListingSummaryDTO,
  ListingDetailDTO,
  CityDTO,
} from '@/types/dto';

// Mock realistic Sanity data structure returned from GROQ queries
const createMockSanityListing = (overrides: Partial<SanityListing> = {}): SanityListing => ({
  _id: 'listing-integration-test-1',
  _type: 'listing',
  name: 'Eco Integration Test Workspace',
  slug: { current: 'eco-integration-test-workspace' },
  type: 'coworking',
  shortDescription: 'A sustainable coworking space for digital nomads',
  longDescription: 'Located in the heart of Bangkok, this workspace offers high-speed internet, eco-friendly amenities, and a vibrant community of remote workers committed to sustainability.',
  address: '123 Sukhumvit Road, Bangkok',
  location: { lat: 13.7563, lng: 100.5018 },
  priceRange: { min: 200, max: 500 },
  website: 'https://eco-workspace.example.com',
  primaryImage: 'image-primary-test',
  galleryImages: ['image-gallery-1', 'image-gallery-2', 'image-gallery-3'],
  ecoFocusTags: [
    { _type: 'reference', _ref: 'tag-solar' },
    { _type: 'reference', _ref: 'tag-recycling' },
  ],
  digitalNomadFeatures: [
    { _type: 'reference', _ref: 'feature-wifi' },
    { _type: 'reference', _ref: 'feature-quiet-zones' },
  ],
  amenities: [
    { _type: 'reference', _ref: 'amenity-coffee' },
    { _type: 'reference', _ref: 'amenity-bike-parking' },
  ],
  city: {
    _type: 'reference',
    _ref: 'city-bangkok',
    _weak: false,
  },
  contactEmail: 'info@eco-workspace.example.com',
  contactPhone: '+66 2 123 4567',
  sustainabilityScore: 92,
  moderation: { status: 'published' },
  coworkingDetails: {
    pricingPlans: [
      {
        type: 'Hot Desk',
        price: 250,
        period: 'day',
        features: ['Fast WiFi', 'Coffee & Tea', 'Meeting Rooms'],
      },
      {
        type: 'Dedicated Desk',
        price: 400,
        period: 'day',
        features: ['Private Desk', 'Storage Locker', 'Priority Booking'],
      },
    ],
    openingHours: [
      { day: 'Monday', opens: '08:00', closes: '20:00' },
      { day: 'Tuesday', opens: '08:00', closes: '20:00' },
      { day: 'Wednesday', opens: '08:00', closes: '20:00' },
      { day: 'Thursday', opens: '08:00', closes: '20:00' },
      { day: 'Friday', opens: '08:00', closes: '20:00' },
    ],
    internetSpeed: '500 Mbps',
  },
  ...overrides,
} as unknown as SanityListing);

describe('DTO Integration Tests - Transformation with Realistic Sanity Data', () => {
  describe('transformToFeaturedDTO', () => {
    it('should transform Sanity listing to FeaturedListingDTO with all required fields', () => {
      const sanityListing = createMockSanityListing();
      const dto: FeaturedListingDTO = transformToFeaturedDTO(sanityListing);

      expect(dto).toMatchObject({
        id: 'listing-integration-test-1',
        name: 'Eco Integration Test Workspace',
        slug: 'eco-integration-test-workspace',
      });
      expect(dto.imageUrl).toBeDefined();
      expect(typeof dto.imageUrl).toBe('string');
    });

    it('should handle missing optional fields gracefully', () => {
      const minimalListing = createMockSanityListing({
        shortDescription: undefined,
        website: undefined,
        location: undefined,
        amenities: [],
      } as any);

      const dto = transformToFeaturedDTO(minimalListing);

      expect(dto.id).toBe('listing-integration-test-1');
      expect(dto.name).toBe('Eco Integration Test Workspace');
      expect(dto.imageUrl).toBeDefined();
    });

    it('should handle various image formats from Sanity', () => {
      const listingWithAssetUrl = createMockSanityListing({
        primaryImage: {
          asset: {
            url: 'https://cdn.sanity.io/images/test/image.jpg',
          },
        },
      } as any);

      const dto = transformToFeaturedDTO(listingWithAssetUrl);
      expect(dto.imageUrl).toContain('https://');
    });
  });

  describe('transformToSummaryDTO', () => {
    it('should transform Sanity listing to ListingSummaryDTO with proper type safety', () => {
      const sanityListing = createMockSanityListing();
      const dto: ListingSummaryDTO = transformToSummaryDTO(sanityListing);

      expect(dto).toMatchObject({
        id: 'listing-integration-test-1',
        name: 'Eco Integration Test Workspace',
        slug: 'eco-integration-test-workspace',
        type: 'coworking',
      });
      expect(dto.shortDescription).toBe('A sustainable coworking space for digital nomads');
      expect(dto.address).toBe('123 Sukhumvit Road, Bangkok');
    });

    it('should transform dereferenced city data correctly', () => {
      const listingWithCity = createMockSanityListing({
        city: {
          _id: 'city-bangkok',
          name: 'Bangkok',
          country: 'Thailand',
          slug: { current: 'bangkok' },
          sustainabilityScore: 85,
          highlights: ['Green Transport', 'Urban Parks'],
        },
      } as any);

      const dto = transformToSummaryDTO(listingWithCity);

      expect(dto.city).toMatchObject({
        id: 'city-bangkok',
        name: 'Bangkok',
        country: 'Thailand',
        slug: 'bangkok',
      });
      expect(dto.city?.sustainabilityScore).toBeLessThanOrEqual(100);
    });

    it('should validate and clamp sustainability scores to 0-100 range', () => {
      const listingWithHighScore = createMockSanityListing({
        city: {
          _id: 'city-test',
          name: 'Test City',
          country: 'Test',
          slug: { current: 'test' },
          sustainabilityScore: 150, // Invalid: over 100
        },
      } as any);

      const dto = transformToSummaryDTO(listingWithHighScore);
      expect(dto.city?.sustainabilityScore).toBe(100);
    });

    it('should normalize amenity names and remove duplicates', () => {
      const listingWithDuplicates = createMockSanityListing({
        amenities: [
          { name: 'WiFi' },
          { name: 'wifi' },
          { name: ' WiFi ' },
          { name: 'Coffee' },
        ],
      } as any);

      const dto = transformToSummaryDTO(listingWithDuplicates);
      expect(dto.amenityNames).toEqual(['WiFi', 'Coffee']);
    });

    it('should handle invalid location coordinates', () => {
      const listingWithBadLocation = createMockSanityListing({
        location: { lat: 10, lng: NaN },
      } as any);

      const dto = transformToSummaryDTO(listingWithBadLocation);
      expect(dto.location).toBeUndefined();
    });

    it('should fallback invalid listing types to activities', () => {
      const listingWithInvalidType = createMockSanityListing({
        type: 'unknown-type' as any,
      });

      const dto = transformToSummaryDTO(listingWithInvalidType);
      expect(dto.type).toBe('activities');
    });

    it('should validate and reject invalid website URLs', () => {
      const listingWithBadUrl = createMockSanityListing({
        website: 'ftp://invalid-protocol.com',
      } as any);

      const dto = transformToSummaryDTO(listingWithBadUrl);
      expect(dto.website).toBeUndefined();
    });
  });

  describe('transformToDetailDTO', () => {
    it('should transform coworking listing to detailed DTO with proper discriminated union', () => {
      const sanityListing = createMockSanityListing();
      const dto: ListingDetailDTO = transformToDetailDTO(sanityListing);

      expect(dto.type).toBe('coworking');
      expect(dto.coworkingDetails).toBeDefined();
      
      if (dto.type === 'coworking') {
        expect(dto.coworkingDetails?.pricingPlans).toHaveLength(2);
        expect(dto.coworkingDetails?.pricingPlans?.[0]).toMatchObject({
          type: 'Hot Desk',
          price: { amount: 250, currency: 'THB', unit: 'hour' },
          period: 'day',
        });
        expect(dto.coworkingDetails?.openingHours).toHaveLength(5);
      }
    });

    it('should filter out invalid pricing plans', () => {
      const listingWithInvalidPlans = createMockSanityListing({
        coworkingDetails: {
          pricingPlans: [
            { type: 'Valid Plan', price: 300, period: 'day', features: [] },
            { type: 'Invalid Plan', price: null, period: null, features: [] },
            { type: null, price: null, period: null },
          ],
        },
      } as any);

      const dto = transformToDetailDTO(listingWithInvalidPlans);
      
      if (dto.type === 'coworking') {
        expect(dto.coworkingDetails?.pricingPlans).toHaveLength(1);
        expect(dto.coworkingDetails?.pricingPlans?.[0].type).toBe('Valid Plan');
      }
    });

    it('should transform cafe listing with specific cafe details', () => {
      const cafeListing = createMockSanityListing({
        type: 'cafe',
        cafeDetails: {
          openingHours: [
            { day: 'Monday', opens: '07:00', closes: '19:00' },
          ],
          priceIndication: 'affordable',
          menuHighlights: ['Organic Coffee', 'Vegan Pastries'],
          noiseLevel: 'Moderate',
          workPolicy: 'Laptop friendly with time limit',
        },
      } as any);

      const dto = transformToDetailDTO(cafeListing);

      expect(dto.type).toBe('cafe');
      if (dto.type === 'cafe') {
        expect(dto.cafeDetails).toBeDefined();
        expect(dto.cafeDetails?.menuHighlights).toContain('Organic Coffee');
        expect(dto.cafeDetails?.openingHours).toHaveLength(1);
      }
    });

    it('should transform restaurant listing with cuisine and dietary options', () => {
      const restaurantListing = createMockSanityListing({
        type: 'restaurant',
        restaurantDetails: {
          cuisineType: 'Thai Fusion',
          dietaryOptions: ['Vegetarian', 'Vegan', 'Gluten-Free'],
          averageMealPriceThb: 350,
        },
      } as any);

      const dto = transformToDetailDTO(restaurantListing);

      expect(dto.type).toBe('restaurant');
      if (dto.type === 'restaurant') {
        expect(dto.restaurantDetails).toBeDefined();
        expect(dto.restaurantDetails?.averageMealPrice).toEqual({
          amount: 350,
          currency: 'THB',
          unit: 'meal',
        });
        expect(dto.restaurantDetails?.dietaryOptions).toContain('Vegan');
      }
    });

    it('should transform activities listing with duration formatting', () => {
      const activitiesListing = createMockSanityListing({
        type: 'activities',
        activitiesDetails: {
          activityType: 'Eco Tour',
          duration: { value: 4, unit: 'hours' },
          skillLevel: 'Beginner',
          languages: ['English', 'Thai'],
        },
      } as any);

      const dto = transformToDetailDTO(activitiesListing);

      expect(dto.type).toBe('activities');
      if (dto.type === 'activities') {
        expect(dto.activityDetails).toBeDefined();
        expect(dto.activityDetails?.duration).toBe('4 hours');
        expect(dto.activityDetails?.activityType).toBe('Eco Tour');
      }
    });

    it('should transform accommodation listing with room types', () => {
      const accommodationListing = createMockSanityListing({
        type: 'accommodation',
        accommodationDetails: {
          accommodationType: 'Eco Hotel',
          pricePerNightThb: { min: 1200, max: 2500 },
          roomTypesAvailable: [
            { type: 'Single' },
            { type: 'Double' },
            { type: 'Suite' },
          ],
          minimumStay: 2,
        },
      } as any);

      const dto = transformToDetailDTO(accommodationListing);

      expect(dto.type).toBe('accommodation');
      if (dto.type === 'accommodation') {
        expect(dto.accommodationDetails).toBeDefined();
        expect(dto.accommodationDetails?.pricePerNight).toEqual({
          amount: 1200,
          currency: 'THB',
          unit: 'night',
        });
        expect(dto.accommodationDetails?.roomTypes).toEqual(['Single', 'Double', 'Suite']);
        expect(dto.accommodationDetails?.minimumStay).toBe(2);
      }
    });

    it('should throw error for unsupported listing types', () => {
      const unsupportedListing = createMockSanityListing({
        type: 'unsupported-type' as any,
      });

      expect(() => transformToDetailDTO(unsupportedListing)).toThrow(
        'Unsupported listing type: unsupported-type'
      );
    });

    it('should handle gallery images correctly', () => {
      const listingWithGallery = createMockSanityListing({
        galleryImages: [
          { asset: { url: 'https://cdn.sanity.io/images/test/gallery1.jpg' } },
          { asset: { url: 'https://cdn.sanity.io/images/test/gallery2.jpg' } },
        ],
      } as any);

      const dto = transformToDetailDTO(listingWithGallery);
      
      expect(dto.galleryImages).toBeDefined();
      expect(Array.isArray(dto.galleryImages)).toBe(true);
      expect(dto.galleryImages.length).toBeGreaterThan(0);
      dto.galleryImages.forEach(url => {
        expect(typeof url).toBe('string');
        expect(url).toContain('https://');
      });
    });
  });

  describe('Blog DTO Transformations', () => {
    it('should transform blog post to summary DTO', () => {
      const blogPost = {
        _id: 'blog-post-1',
        title: 'Sustainable Travel in Southeast Asia',
        slug: { current: 'sustainable-travel-southeast-asia' },
        excerpt: 'Discover eco-friendly destinations and practices.',
        primaryImage: 'image-blog-1',
        tags: ['Travel', 'Sustainability', 'Southeast Asia'],
        readingTime: '8',
        authorName: 'Jane Doe',
        publishedAt: '2024-01-15',
      };

      const dto = transformToBlogSummaryDTO(blogPost);

      expect(dto).toMatchObject({
        id: 'blog-post-1',
        title: 'Sustainable Travel in Southeast Asia',
        slug: 'sustainable-travel-southeast-asia',
        excerpt: 'Discover eco-friendly destinations and practices.',
        readingTime: 8,
        authorName: 'Jane Doe',
      });
      expect(dto.tags).toEqual(['Travel', 'Sustainability', 'Southeast Asia']);
      expect(dto.imageUrl).toBeDefined();
    });

    it('should filter out invalid tags from blog summary', () => {
      const blogPost = {
        _id: 'blog-post-2',
        title: 'Test Post',
        slug: { current: 'test-post' },
        primaryImage: 'image-test',
        tags: ['Valid', null, 42, ' Trimmed ', ''],
      };

      const dto = transformToBlogSummaryDTO(blogPost);
      expect(dto.tags).toEqual(['Valid', 'Trimmed']);
    });

    it('should transform blog detail with related posts', () => {
      const blogDetail = {
        _id: 'blog-detail-1',
        title: 'Detailed Guide',
        slug: { current: 'detailed-guide' },
        primaryImage: 'image-detail',
        body: [{ _type: 'block', children: [] }],
        relatedPosts: [
          {
            _id: 'related-1',
            title: 'Related Post',
            slug: { current: 'related-post' },
            primaryImage: 'image-related',
          },
          null, // Should be filtered out
        ],
        authorImage: 'image-author',
      };

      const dto = transformToBlogDetailDTO(blogDetail);

      expect(dto.relatedPosts).toHaveLength(1);
      expect(dto.relatedPosts[0]).toMatchObject({
        id: 'related-1',
        title: 'Related Post',
        slug: 'related-post',
      });
      expect(dto.authorImageUrl).toBeDefined();
    });
  });

  describe('DTO Type Safety and Validation', () => {
    it('should ensure CityDTO has proper percentage type', () => {
      const listingWithCity = createMockSanityListing({
        city: {
          _id: 'city-test',
          name: 'Test',
          country: 'Test',
          slug: { current: 'test' },
          sustainabilityScore: 75,
        },
      } as any);

      const dto = transformToSummaryDTO(listingWithCity);
      const city: CityDTO | null | undefined = dto.city;

      if (city && city.sustainabilityScore !== undefined) {
        expect(city.sustainabilityScore).toBeGreaterThanOrEqual(0);
        expect(city.sustainabilityScore).toBeLessThanOrEqual(100);
      }
    });

    it('should ensure Money type has correct structure', () => {
      const dto = transformToDetailDTO(createMockSanityListing());
      
      if (dto.type === 'coworking' && dto.coworkingDetails?.pricingPlans) {
        const plan = dto.coworkingDetails.pricingPlans[0];
        expect(plan.price).toHaveProperty('amount');
        expect(plan.price).toHaveProperty('currency');
        expect(typeof plan.price.amount).toBe('number');
        expect(typeof plan.price.currency).toBe('string');
      }
    });

    it('should ensure OpeningHour type is properly structured', () => {
      const dto = transformToDetailDTO(createMockSanityListing());
      
      if (dto.type === 'coworking' && dto.coworkingDetails?.openingHours) {
        const hours = dto.coworkingDetails.openingHours[0];
        expect(hours).toHaveProperty('day');
        expect(hours).toHaveProperty('opens');
        expect(hours).toHaveProperty('closes');
        expect(typeof hours.day).toBe('string');
      }
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle null/undefined fields gracefully', () => {
      const listingWithNulls = createMockSanityListing({
        shortDescription: null,
        website: null,
        location: null,
        contactEmail: null,
      } as any);

      const dto = transformToSummaryDTO(listingWithNulls);
      expect(dto.shortDescription).toBeUndefined();
      expect(dto.website).toBeUndefined();
      expect(dto.location).toBeUndefined();
    });

    it('should handle empty arrays correctly', () => {
      const listingWithEmptyArrays = createMockSanityListing({
        galleryImages: [],
        amenities: [],
        ecoFocusTags: [],
      } as any);

      const dto = transformToDetailDTO(listingWithEmptyArrays);
      expect(dto.galleryImages).toEqual([]);
      expect(dto.amenities).toEqual([]);
    });

    it('should preserve data integrity through transformation pipeline', () => {
      const originalListing = createMockSanityListing();
      const dto = transformToDetailDTO(originalListing);

      // Verify critical data is preserved
      expect(dto.id).toBe(originalListing._id);
      expect(dto.name).toBe(originalListing.name);
      expect(dto.slug).toBe(originalListing.slug.current);
      expect(dto.type).toBe(originalListing.type);
    });
  });
});
