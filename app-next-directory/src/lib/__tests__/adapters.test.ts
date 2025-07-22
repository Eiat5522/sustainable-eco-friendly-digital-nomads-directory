import { jsonToSanityListing, calculateEcoRating } from '../adapters';
import { JsonListing } from '@/types/sanity-compatible-json';
import { ListingCategory, PriceRange } from '@/types/enums';

// Mock Date for deterministic createdAt/updatedAt
const MOCK_DATE = '2023-01-01T00:00:00.000Z';
beforeAll(() => {
  jest.spyOn(global, 'Date').mockImplementation(() => ({
    toISOString: () => MOCK_DATE,
  } as any));
});
afterAll(() => {
  (Date as any).mockRestore && (Date as any).mockRestore();
});

describe('jsonToSanityListing', () => {
  const baseJsonListing: JsonListing = {
    _type: 'listing',
    name: 'Eco Space Coworking',
    slug: { current: 'eco-space-coworking' },
    type: ListingCategory.COWORKING,
    shortDescription: 'A sustainable coworking space',
    longDescription: 'A long eco-friendly description for digital nomads with sustainable practices.',
    address: '123 Green Road, Bangkok',
    website: 'https://ecospace.com',
    phone: '+66 2 123 4567',
    email: 'hello@ecospace.com',
    location: {
      lat: 13.7563,
      lng: 100.5018
    },
    city: {
      _id: 'bangkok-city-id',
      name: 'Bangkok',
      slug: { current: 'bangkok' },
      listingCount: 25,
      country: 'Thailand'
    },
    mainImage: {
      _type: 'image',
      asset: {
        _ref: 'image-main-ref',
        _type: 'reference',
        url: 'https://example.com/main.jpg'
      },
      alt: 'Main image'
    },
    galleryImages: [
      {
        _type: 'image',
        asset: {
          _ref: 'image-gallery-1',
          _type: 'reference',
          url: 'https://example.com/gallery1.jpg'
        },
        alt: 'Gallery image 1'
      }
    ],
    ecoTags: [
      {
        _id: 'solar-tag',
        name: 'Solar Powered',
        slug: { current: 'solar-powered' },
        description: 'Uses solar energy'
      },
      {
        _id: 'recycling-tag', 
        name: 'Recycling Program',
        slug: { current: 'recycling-program' },
        description: 'Has recycling initiatives'
      }
    ],
    digitalNomadFeatures: ['High-speed WiFi', '24/7 Access', 'Meeting Rooms'],
    priceRange: PriceRange.MODERATE,
    lastVerifiedDate: '2023-01-01',
    sourceUrls: ['https://ecospace.com'],
    ecoRating: 85
  };

  it('should convert a full JsonListing to SanityListing format', () => {
    const result = jsonToSanityListing(baseJsonListing);
    
    expect(result._id).toBe('listing-eco-space-coworking');
    expect(result.type).toBe(ListingCategory.COWORKING);
    expect(result.createdAt).toBe(MOCK_DATE);
    expect(result.updatedAt).toBe(MOCK_DATE);
    
    expect(result.name).toBe('Eco Space Coworking');
    expect(result.slug).toEqual({ current: 'eco-space-coworking' });
 
    expect(result.shortDescription).toBe('A sustainable coworking space');
    expect(result.longDescription).toBe('A long eco-friendly description for digital nomads with sustainable practices.');
    
    expect(result.city).toEqual({
      _id: 'bangkok-city-id',
      name: 'Bangkok',
      slug: { current: 'bangkok' },
      listingCount: 25,
      country: 'Thailand'
    });
    
    expect(result.location).toEqual({
      lat: 13.7563,
      lng: 100.5018,
      coordinates: [100.5018, 13.7563] // [lng, lat] for GeoJSON
    });
    
    expect(result.ecoTags).toHaveLength(2);
    expect(result.ecoTags?.[0]).toEqual({
      _id: 'solar-tag',
      name: 'Solar Powered',
      slug: { current: 'solar-powered' }
    });
    
    expect(result.digitalNomadFeatures).toEqual(['High-speed WiFi', '24/7 Access', 'Meeting Rooms']);
    expect(result.priceRange).toBe(PriceRange.MODERATE);
  });

  it('should handle minimal JsonListing data', () => {
    const minimalListing: JsonListing = {
      _type: 'listing',
      name: 'Simple Café',
      slug: { current: 'simple-cafe' },
      type: ListingCategory.CAFE
    };
    
    const result = jsonToSanityListing(minimalListing);
    
    expect(result.name).toBe('Simple Café');
    expect(result.slug).toEqual({ current: 'simple-cafe' });
    expect(result.type).toBe(ListingCategory.CAFE);
    expect(result.city).toBeUndefined();
    expect(result.location).toBeUndefined();
    expect(result.ecoTags).toEqual([]);
    expect(result.moderationStatus).toBe('pending');
    expect(result.verificationStatus).toBe('unverified');
  });

  it('should generate ID from slug when _id is not provided', () => {
    const listingWithoutId: JsonListing = {
      _type: 'listing',
      name: 'Test Listing',
      slug: { current: 'test-listing' },
      type: ListingCategory.COWORKING
    };
    
    const result = jsonToSanityListing(listingWithoutId);
    expect(result._id).toBe('listing-test-listing');
  });

  it('should use provided _id when available', () => {
    const listingWithId: JsonListing = {
      _id: 'custom-id-123',
      _type: 'listing',
      name: 'Test Listing',
      slug: { current: 'test-listing' },
      type: ListingCategory.COWORKING
    };
    
    const result = jsonToSanityListing(listingWithId);
    expect(result._id).toBe('custom-id-123');
  });
});

describe('calculateEcoRating', () => {
  it('returns base score 50 for minimal listing', () => {
    const minimalListing: JsonListing = {
      _type: 'listing',
      name: 'Test',
      slug: { current: 'test' },
      type: ListingCategory.CAFE
    };
    
    expect(calculateEcoRating(minimalListing)).toBe(50);
  });

  it('adds 10 points per eco tag, max 30', () => {
    const listingWith4Tags: JsonListing = {
      _type: 'listing',
      name: 'Test',
      slug: { current: 'test' },
      type: ListingCategory.CAFE,
      ecoTags: [
        { _id: '1', name: 'Tag 1', slug: { current: 'tag-1' } },
        { _id: '2', name: 'Tag 2', slug: { current: 'tag-2' } },
        { _id: '3', name: 'Tag 3', slug: { current: 'tag-3' } },
        { _id: '4', name: 'Tag 4', slug: { current: 'tag-4' } }
      ]
    };
    
    expect(calculateEcoRating(listingWith4Tags)).toBe(80); // 50 + 30 (max for tags)
  });

  it('adds 10 points for detailed eco notes > 50 chars', () => {
    const listingWithDetails: JsonListing = {
      _type: 'listing',
      name: 'Test',
      slug: { current: 'test' },
      type: ListingCategory.CAFE,
      longDescription: 'This is a very long description with detailed eco information that exceeds fifty characters'
    };
    
    expect(calculateEcoRating(listingWithDetails)).toBe(60); // 50 + 10
  });

  it('adds 5 points for digital nomad features', () => {
    const listingWithFeatures: JsonListing = {
      _type: 'listing',
      name: 'Test',
      slug: { current: 'test' },
      type: ListingCategory.CAFE,
      digitalNomadFeatures: ['WiFi', 'Power outlets']
    };
    
    expect(calculateEcoRating(listingWithFeatures)).toBe(55); // 50 + 5
  });

  it('caps the score at 100', () => {
    const maxScoreListing: JsonListing = {
      _type: 'listing',
      name: 'Test',
      slug: { current: 'test' },
      type: ListingCategory.CAFE,
      ecoTags: [
        { _id: '1', name: 'Tag 1', slug: { current: 'tag-1' } },
        { _id: '2', name: 'Tag 2', slug: { current: 'tag-2' } },
        { _id: '3', name: 'Tag 3', slug: { current: 'tag-3' } },
        { _id: '4', name: 'Tag 4', slug: { current: 'tag-4' } },
        { _id: '5', name: 'Tag 5', slug: { current: 'tag-5' } }
      ],
      longDescription: 'This is a very long description with detailed eco information that exceeds fifty characters and provides comprehensive sustainability details',
      digitalNomadFeatures: ['WiFi', 'Power outlets', 'Meeting rooms']
    };
    
    expect(calculateEcoRating(maxScoreListing)).toBe(95); // 50 + 30 + 10 + 5 = 95 (< 100)
  });
});