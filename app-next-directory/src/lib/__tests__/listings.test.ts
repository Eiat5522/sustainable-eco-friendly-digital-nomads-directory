/**
 * @fileoverview
 * Jest unit tests for listings.ts.
 * Ensures robust mocking, isolation, and modern Jest best practices.
 */
import { Listing } from '../../types/listings';
import { 
  mapSanityListingToCard, 
  mapSanityCity, 
  isSanityListing, 
  isSanityCity 
} from '../listings';

// Mock data for listings
const mockListings: Listing[] = [
  {
    _id: '1',
    name: 'Eco-Friendly Coworking Space',
    slug: { current: 'eco-friendly-coworking-space' },
    city: { name: 'Bangkok', slug: { current: 'bangkok' } },
    address: '123 Green Street, Bangkok',
    shortDescription: 'A sustainable coworking space with solar panels and recycling',
    longDescription: 'A very eco-friendly hostel.',
    ecoFocusTags: [
      { _id: 'solar', name: 'Solar Powered', slug: { current: 'solar-powered' } },
      { _id: 'recycling', name: 'Recycling Program', slug: { current: 'recycling-program' } }
    ],
    priceRange: 'moderate',
    website: 'http://example.com/eco-hostel',
    category: 'accommodation',
    primaryImage: { asset: { _ref: 'image-ref-1' } },
    galleryImages: [],
    digitalNomadFeatures: ['high_speed_wifi', 'meeting_rooms'],
    lastVerifiedDate: '2025-01-01',
    location: { lat: 13.7563, lng: 100.5018 },
  },
  {
    _id: '2',
    name: 'Nomad Cafe',
    slug: { current: 'nomad-cafe' },
    city: { name: 'Chiang Mai', slug: { current: 'chiang-mai' } },
    type: 'cafe',
    address: '456 Nomad Rd',
    shortDescription: 'Cafe for digital nomads',
    longDescription: 'A great cafe with fast wifi for digital nomads.',
    ecoFocusTags: [],
    priceRange: 'budget',
    website: 'http://example.com/nomad-cafe',
    category: 'cafe',
    primaryImage: { asset: { _ref: 'image-ref-2' } },
    galleryImages: ['image-ref-3', 'image-ref-4'],
    digitalNomadFeatures: ['wifi-available', 'power-outlets'],
    lastVerifiedDate: '2025-01-01',
    location: { lat: 18.7880, lng: 98.9870 },
  },
  {
    _id: '3',
    name: 'Green Resort',
    slug: { current: 'green-resort' },
    city: { name: 'Bangkok', slug: { current: 'bangkok' } },
    type: 'accommodation',
    address: '789 Green Blvd',
    shortDescription: 'Resort with organic food',
    longDescription: 'A beautiful resort focusing on organic produce.',
    ecoFocusTags: [
      { _id: 'organic', name: 'Organic', slug: { current: 'organic' } }
    ],
    priceRange: 'premium',
    website: 'http://example.com/green-resort',
    category: 'accommodation',
    primaryImage: { asset: { _ref: 'image-ref-5' } },
    galleryImages: ['image-ref-6'],
    digitalNomadFeatures: [],
    lastVerifiedDate: '2025-01-01',
    location: { lat: 13.7123, lng: 100.5555 },
  },
];

// Always reset modules and mock listings.json before each test suite
beforeEach(() => {
  jest.resetModules();
  jest.doMock('../../data/listings.json', () => mockListings, { virtual: true });
});

describe('getListingsByCity', () => {
  let getListingsByCity: typeof import('../listings').getListingsByCity;
  beforeEach(() => {
    // Re-import after mocking
    getListingsByCity = require('../listings').getListingsByCity;
  });

  it('returns listings for a city (case-insensitive)', () => {
    const result = getListingsByCity('bangkok');
    expect(result).toHaveLength(2);
    expect(result.map(l => l.name)).toEqual(expect.arrayContaining(['Eco Hostel', 'Green Resort']));
  });

  it('should return listings for a city with different casing', () => {
    const result = getListingsByCity('CHIANG MAI');
    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Nomad Cafe');
  });

  it('should return an empty array if no listings in city', () => {
    const result = getListingsByCity('Phuket');
    expect(result).toEqual([]);
  });

  it('should return all listings for a city with multiple listings', () => {
    const result = getListingsByCity('Bangkok');
    expect(result).toHaveLength(2);
    expect(result.map(l => l.name)).toEqual(expect.arrayContaining(['Eco Hostel', 'Green Resort']));
  });
});

describe('filterListings', () => {
  let filterListings: typeof import('../listings').filterListings;
  beforeEach(() => {
    // Re-import after mocking
    filterListings = require('../listings').filterListings;
  });

  it('returns all listings if no filters', () => {
    const result = filterListings({});
    expect(result).toHaveLength(3);
  });

  it('filters by category', () => {
    const result = filterListings({ category: 'accommodation' as 'accommodation' });
    expect(result).toHaveLength(2);
    expect(result.map(l => l.name)).toEqual(expect.arrayContaining(['Eco Hostel', 'Green Resort']));
  });

  it('filters by city (case-insensitive)', () => {
    const result = filterListings({ city: 'bangkok' });
    expect(result).toHaveLength(2);
    expect(result.map(l => l.name)).toEqual(expect.arrayContaining(['Eco Hostel', 'Green Resort']));
  });

  it('filters by hasEcoTags', () => {
    const result = filterListings({ hasEcoTags: true });
    expect(result).toHaveLength(2);
    expect(result.map(l => l.name)).toEqual(expect.arrayContaining(['Eco Hostel', 'Green Resort']));
  });

  it('filters by hasDnFeatures', () => {
    const result = filterListings({ hasDnFeatures: true });
    expect(result).toHaveLength(2);
    expect(result.map(l => l.name)).toEqual(expect.arrayContaining(['Eco Hostel', 'Nomad Cafe']));
  });

  it('filters by multiple criteria', () => {
    const result = filterListings({
      city: 'Bangkok',
      hasEcoTags: true,
      hasDnFeatures: true,
    });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Eco Hostel');
  });

  it('returns empty array if no listings match', () => {
    const result = filterListings({
      city: 'Bangkok',
      category: 'cafe' as 'cafe',
    });
    expect(result).toEqual([]);
  });

  it('returns empty array if all filters exclude all', () => {
    const result = filterListings({
      city: 'Phuket',
      category: 'accommodation' as 'accommodation',
      hasEcoTags: true,
      hasDnFeatures: true,
    });
    expect(result).toEqual([]);
  });
});

describe('Type Guards and Mapping Functions', () => {
  describe('isSanityListing', () => {
    it('should return true for valid Sanity listing', () => {
      const validListing = {
        _type: 'listing',
        _id: 'test-id',
        name: 'Test Listing'
      };
      expect(isSanityListing(validListing)).toBe(true);
    });

    it('should return false for invalid listing', () => {
      expect(isSanityListing(null)).toBe(false);
      expect(isSanityListing({})).toBe(false);
      expect(isSanityListing({ _type: 'city' })).toBe(false);
    });
  });

  describe('isSanityCity', () => {
    it('should return true for valid Sanity city', () => {
      const validCity = {
        _type: 'city',
        _id: 'test-city-id',
        name: 'Test City'
      };
      expect(isSanityCity(validCity)).toBe(true);
    });

    it('should return false for invalid city', () => {
      expect(isSanityCity(null)).toBe(false);
      expect(isSanityCity({})).toBe(false);
      expect(isSanityCity({ _type: 'listing' })).toBe(false);
    });
  });

  describe('mapSanityCity', () => {
    it('should map Sanity city to AppCity DTO', () => {
      const rawCity = {
        _id: 'city-123',
        name: 'Bangkok',
        slug: { current: 'bangkok' },
        country: 'Thailand',
        sustainabilityScore: 85,
        highlights: ['Green spaces', 'Eco transport'],
        mainImage: {
          asset: { url: 'https://example.com/image.jpg' }
        }
      };

      const result = mapSanityCity(rawCity);
      
      expect(result).toEqual({
        id: 'city-123',
        name: 'Bangkok',
        slug: 'bangkok',
        country: 'Thailand',
        sustainabilityScore: 85,
        highlights: ['Green spaces', 'Eco transport'],
        mainImage: {
          asset: { url: 'https://example.com/image.jpg' }
        }
      });
    });

    it('should handle null city', () => {
      expect(mapSanityCity(null)).toBe(null);
      expect(mapSanityCity(undefined)).toBe(null);
    });

    it('should handle string slug', () => {
      const rawCity = {
        _id: 'city-123',
        name: 'Bangkok',
        slug: 'bangkok-string',
      };

      const result = mapSanityCity(rawCity);
      expect(result?.slug).toBe('bangkok-string');
    });
  });

  describe('mapSanityListingToCard', () => {
    it('should map complete Sanity listing to AppListingCard', () => {
      const rawListing = {
        _id: 'listing-123',
        name: 'Test Coworking Space',
        slug: { current: 'test-coworking' },
        city: {
          _id: 'city-123',
          name: 'Bangkok',
          slug: { current: 'bangkok' },
          country: 'Thailand'
        },
        type: 'coworking',
        category: 'workspace',
        address: '123 Test Street',
        location: { lat: 13.7563, lng: 100.5018 },
        primaryImage: {
          asset: { url: 'https://example.com/primary.jpg' }
        },
        galleryImages: [
          { _key: 'img1', asset: { url: 'https://example.com/gallery1.jpg' } }
        ],
        ecoFocusTags: [
          { name: 'Solar Power' },
          'Recycling'
        ],
        digitalNomadFeatures: [
          { name: 'High-speed WiFi' },
          'Meeting rooms'
        ],
        priceRange: 'moderate',
        website: 'https://example.com',
        shortDescription: 'A great coworking space'
      };

      const result = mapSanityListingToCard(rawListing);

      expect(result.id).toBe('listing-123');
      expect(result.name).toBe('Test Coworking Space');
      expect(result.slug).toBe('test-coworking');
      expect(result.ecoFocusTags).toEqual(['Solar Power', 'Recycling']);
      expect(result.digitalNomadFeatures).toEqual(['High-speed WiFi', 'Meeting rooms']);
    });

    it('should handle missing or null data gracefully', () => {
      const minimalListing = {
        _id: 'listing-minimal'
      };

      const result = mapSanityListingToCard(minimalListing);

      expect(result.id).toBe('listing-minimal');
      expect(result.name).toBe('');
      expect(result.slug).toBe('');
      expect(result.city).toBe(null);
      expect(result.ecoFocusTags).toEqual([]);
      expect(result.digitalNomadFeatures).toEqual([]);
    });

    it('should throw error for null listing', () => {
      expect(() => mapSanityListingToCard(null)).toThrow('Cannot map null or undefined listing');
      expect(() => mapSanityListingToCard(undefined)).toThrow('Cannot map null or undefined listing');
    });
  });
});
