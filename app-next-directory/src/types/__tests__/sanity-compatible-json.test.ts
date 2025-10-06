import type { JsonListing } from '../sanity-compatible-json';

describe('sanity-compatible-json types', () => {
  describe('JsonListing interface', () => {
    it('should accept minimal json listing', () => {
      const listing: JsonListing = {
        _type: 'listing',
        name: 'Test Listing',
        slug: { current: 'test-listing' },
        type: 'coworking'
      };
      expect(listing._type).toBe('listing');
      expect(listing.name).toBe('Test Listing');
      expect(listing.slug.current).toBe('test-listing');
    });

    it('should accept listing with descriptions', () => {
      const listing: JsonListing = {
        _type: 'listing',
        name: 'Eco Workspace',
        slug: { current: 'eco-workspace' },
        type: 'coworking',
        shortDescription: 'A sustainable coworking space',
        longDescription: 'A detailed description of the eco-friendly workspace with many sustainable features.'
      };
      expect(listing.shortDescription).toBeDefined();
      expect(listing.longDescription).toBeDefined();
    });

    it('should accept listing with contact information', () => {
      const listing: JsonListing = {
        _type: 'listing',
        name: 'Contact Space',
        slug: { current: 'contact-space' },
        type: 'cafe',
        address: '123 Main St, Bangkok, Thailand',
        website: 'https://example.com',
        phone: '+66-123-4567',
        email: 'info@example.com'
      };
      expect(listing.address).toBe('123 Main St, Bangkok, Thailand');
      expect(listing.website).toBe('https://example.com');
      expect(listing.phone).toBe('+66-123-4567');
      expect(listing.email).toBe('info@example.com');
    });

    it('should accept listing with location coordinates', () => {
      const listing: JsonListing = {
        _type: 'listing',
        name: 'Located Venue',
        slug: { current: 'located-venue' },
        type: 'accommodation',
        location: {
          lat: 13.7563,
          lng: 100.5018
        }
      };
      expect(listing.location?.lat).toBe(13.7563);
      expect(listing.location?.lng).toBe(100.5018);
    });

    it('should accept listing with city reference', () => {
      const listing: JsonListing = {
        _type: 'listing',
        name: 'City Venue',
        slug: { current: 'city-venue' },
        type: 'restaurant',
        city: {
          _id: 'city-123',
          name: 'Bangkok',
          slug: { current: 'bangkok' },
          listingCount: 50,
          country: 'Thailand'
        }
      };
      expect(listing.city?.name).toBe('Bangkok');
      expect(listing.city?.country).toBe('Thailand');
      expect(listing.city?.listingCount).toBe(50);
    });

    it('should accept listing with primary image', () => {
      const listing: JsonListing = {
        _type: 'listing',
        name: 'Image Listing',
        slug: { current: 'image-listing' },
        type: 'coworking',
        primaryImage: {
          _type: 'image',
          asset: {
            _ref: 'image-abc123',
            _type: 'reference',
            url: 'https://cdn.sanity.io/images/project/dataset/image.jpg'
          },
          alt: 'Main image of the coworking space'
        }
      };
      expect(listing.primaryImage?.asset._ref).toBe('image-abc123');
      expect(listing.primaryImage?.alt).toBe('Main image of the coworking space');
    });

    it('should accept listing with gallery images', () => {
      const listing: JsonListing = {
        _type: 'listing',
        name: 'Gallery Listing',
        slug: { current: 'gallery-listing' },
        type: 'cafe',
        galleryImages: [
          {
            _type: 'image',
            asset: {
              _ref: 'image-1',
              _type: 'reference',
              url: 'https://example.com/img1.jpg'
            },
            alt: 'Gallery image 1'
          },
          {
            _type: 'image',
            asset: {
              _ref: 'image-2',
              _type: 'reference',
              url: 'https://example.com/img2.jpg'
            },
            alt: 'Gallery image 2'
          }
        ]
      };
      expect(listing.galleryImages).toHaveLength(2);
      expect(listing.galleryImages?.[0].asset._ref).toBe('image-1');
    });

    it('should accept listing with eco tags', () => {
      const listing: JsonListing = {
        _type: 'listing',
        name: 'Eco Listing',
        slug: { current: 'eco-listing' },
        type: 'accommodation',
        ecoTags: [
          {
            _id: 'tag-1',
            _type: 'reference',
            name: 'Solar Power'
          },
          {
            _id: 'tag-2',
            _type: 'reference',
            name: 'Recycling'
          }
        ]
      };
      expect(listing.ecoTags).toHaveLength(2);
      expect(listing.ecoTags?.[0].name).toBe('Solar Power');
    });

    it('should accept listing with eco details', () => {
      const listing: JsonListing = {
        _type: 'listing',
        name: 'Detailed Eco Listing',
        slug: { current: 'detailed-eco-listing' },
        type: 'coworking',
        ecoDetails: {
          description: 'We use renewable energy and sustainable practices',
          ecoTags: ['solar', 'recycling', 'organic'],
          certifications: ['LEED Gold', 'Green Key']
        }
      };
      expect(listing.ecoDetails?.description).toBeDefined();
      expect(listing.ecoDetails?.ecoTags).toHaveLength(3);
      expect(listing.ecoDetails?.certifications).toContain('LEED Gold');
    });

    it('should accept listing with digital nomad features', () => {
      const listing: JsonListing = {
        _type: 'listing',
        name: 'Nomad Friendly',
        slug: { current: 'nomad-friendly' },
        type: 'cafe',
        digitalNomadFeatures: ['high-speed-wifi', 'power-outlets', 'quiet-space', 'meeting-rooms']
      };
      expect(listing.digitalNomadFeatures).toHaveLength(4);
      expect(listing.digitalNomadFeatures).toContain('high-speed-wifi');
    });

    it('should accept listing with source URLs', () => {
      const listing: JsonListing = {
        _type: 'listing',
        name: 'Sourced Listing',
        slug: { current: 'sourced-listing' },
        type: 'restaurant',
        sourceUrls: [
          'https://source1.com/listing',
          'https://source2.com/review'
        ]
      };
      expect(listing.sourceUrls).toHaveLength(2);
    });

    it('should accept listing with verification date', () => {
      const listing: JsonListing = {
        _type: 'listing',
        name: 'Verified Listing',
        slug: { current: 'verified-listing' },
        type: 'coworking',
        lastVerifiedDate: '2024-01-15'
      };
      expect(listing.lastVerifiedDate).toBe('2024-01-15');
    });

    it('should accept listing with price range', () => {
      const listing: JsonListing = {
        _type: 'listing',
        name: 'Priced Listing',
        slug: { current: 'priced-listing' },
        type: 'accommodation',
        priceRange: 'moderate'
      };
      expect(listing.priceRange).toBe('moderate');
    });

    it('should accept listing with operating hours', () => {
      const listing: JsonListing = {
        _type: 'listing',
        name: 'Open Listing',
        slug: { current: 'open-listing' },
        type: 'cafe',
        operatingHours: 'Mon-Fri: 08:00-18:00, Sat-Sun: 09:00-17:00'
      };
      expect(listing.operatingHours).toBeDefined();
    });

    it('should accept listing with sustainability initiatives', () => {
      const listing: JsonListing = {
        _type: 'listing',
        name: 'Sustainable Listing',
        slug: { current: 'sustainable-listing' },
        type: 'restaurant',
        sustainabilityInitiatives: [
          'Local sourcing',
          'Zero waste',
          'Composting',
          'Renewable energy'
        ]
      };
      expect(listing.sustainabilityInitiatives).toHaveLength(4);
    });

    it('should accept listing with work-friendly features', () => {
      const listing: JsonListing = {
        _type: 'listing',
        name: 'Work Friendly',
        slug: { current: 'work-friendly' },
        type: 'cafe',
        workFriendlyFeatures: ['WiFi', 'Power outlets', 'Quiet environment']
      };
      expect(listing.workFriendlyFeatures).toHaveLength(3);
    });

    it('should accept listing with accessibility info', () => {
      const listing: JsonListing = {
        _type: 'listing',
        name: 'Accessible Venue',
        slug: { current: 'accessible-venue' },
        type: 'coworking',
        accessibility: {
          wheelchairAccessible: true,
          accessibilityNotes: 'Ramp available at main entrance, accessible bathroom on ground floor'
        }
      };
      expect(listing.accessibility?.wheelchairAccessible).toBe(true);
      expect(listing.accessibility?.accessibilityNotes).toBeDefined();
    });

    it('should accept listing with moderation info', () => {
      const listing: JsonListing = {
        _type: 'listing',
        name: 'Moderated Listing',
        slug: { current: 'moderated-listing' },
        type: 'accommodation',
        moderation: {
          status: 'published',
          verificationStatus: 'verified',
          featured: true,
          moderatorNotes: 'Excellent sustainable practices verified'
        }
      };
      expect(listing.moderation?.status).toBe('published');
      expect(listing.moderation?.verificationStatus).toBe('verified');
      expect(listing.moderation?.featured).toBe(true);
    });

    it('should accept complete listing with all fields', () => {
      const listing: JsonListing = {
        _type: 'listing',
        name: 'Complete Listing',
        slug: { current: 'complete-listing' },
        type: 'coworking',
        shortDescription: 'A comprehensive listing',
        longDescription: 'Full description here',
        address: '456 Test St',
        website: 'https://example.com',
        phone: '+66-123-4567',
        email: 'info@example.com',
        location: { lat: 13.7563, lng: 100.5018 },
        city: {
          _id: 'city-1',
          name: 'Bangkok',
          slug: { current: 'bangkok' },
          listingCount: 100,
          country: 'Thailand'
        },
        primaryImage: {
          _type: 'image',
          asset: { _ref: 'img-1', _type: 'reference', url: 'url' },
          alt: 'Main image'
        },
        galleryImages: [],
        ecoTags: [],
        ecoDetails: {
          description: 'Eco info',
          ecoTags: ['solar'],
          certifications: ['LEED']
        },
        digitalNomadFeatures: ['wifi'],
        sourceUrls: ['https://source.com'],
        lastVerifiedDate: '2024-01-15',
        priceRange: 'moderate',
        operatingHours: '24/7',
        sustainabilityInitiatives: ['Green energy'],
        workFriendlyFeatures: ['WiFi'],
        accessibility: {
          wheelchairAccessible: true
        },
        moderation: {
          status: 'published',
          verificationStatus: 'verified',
          featured: true
        }
      };
      
      expect(listing.name).toBe('Complete Listing');
      expect(listing._type).toBe('listing');
      expect(listing.city?.name).toBe('Bangkok');
    });
  });

  describe('Type consistency', () => {
    it('should enforce _type field as listing', () => {
      const listing: JsonListing = {
        _type: 'listing',
        name: 'Type Test',
        slug: { current: 'type-test' },
        type: 'cafe'
      };
      expect(listing._type).toBe('listing');
    });

    it('should enforce slug structure', () => {
      const listing: JsonListing = {
        _type: 'listing',
        name: 'Slug Test',
        slug: { current: 'slug-test' },
        type: 'coworking'
      };
      expect(listing.slug).toHaveProperty('current');
      expect(typeof listing.slug.current).toBe('string');
    });

    it('should handle optional fields correctly', () => {
      const minimal: JsonListing = {
        _type: 'listing',
        name: 'Minimal',
        slug: { current: 'minimal' },
        type: 'cafe'
      };
      
      expect(minimal.shortDescription).toBeUndefined();
      expect(minimal.address).toBeUndefined();
      expect(minimal.ecoTags).toBeUndefined();
    });
  });
});
