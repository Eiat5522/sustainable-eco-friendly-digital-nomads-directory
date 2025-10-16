/**
 * @fileoverview
 * Jest unit tests for listings.ts.
 * Ensures robust mocking, isolation, and modern Jest best practices.
 */
import { Listing } from '../../types/listings';

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
    type: 'accommodation',
    primaryImage: { _type: 'image', asset: { _ref: 'image-ref-1' } },
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
    primaryImage: { _type: 'image', asset: { _ref: 'image-ref-2' } },
    galleryImages: [
  { _type: 'image', _key: 'img3', asset: { _ref: 'image-ref-3' } },
  { _type: 'image', _key: 'img4', asset: { _ref: 'image-ref-4' } }
],
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
    primaryImage: { _type: 'image', asset: { _ref: 'image-ref-5' } },
    galleryImages: [
  { _type: 'image', _key: 'img6', asset: { _ref: 'image-ref-6' } }
],
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
    expect(result.map(l => l.name))
      .toEqual(expect.arrayContaining([
        'Eco-Friendly Coworking Space',
        'Green Resort'
      ]));
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
    expect(result.map(l => l.name))
      .toEqual(expect.arrayContaining(['Eco-Friendly Coworking Space', 'Green Resort']));
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
    const result = filterListings({ category: 'accommodation' as const });
    expect(result).toHaveLength(2);
    expect(result.map(l => l.name))
      .toEqual(expect.arrayContaining(['Eco-Friendly Coworking Space', 'Green Resort']));
  });

  it('filters by city (case-insensitive)', () => {
    const result = filterListings({ city: 'bangkok' });
    expect(result).toHaveLength(2);
    expect(result.map(l => l.name))
      .toEqual(expect.arrayContaining(['Eco-Friendly Coworking Space', 'Green Resort']));
  });

  it('filters by hasEcoTags', () => {
    const result = filterListings({ hasEcoTags: true });
    expect(result).toHaveLength(2);
    expect(result.map(l => l.name))
      .toEqual(expect.arrayContaining(['Eco-Friendly Coworking Space', 'Green Resort']));
  });

  it('filters by hasDnFeatures', () => {
    const result = filterListings({ hasDnFeatures: true });
    expect(result).toHaveLength(2);
    expect(result.map(l => l.name))
      .toEqual(expect.arrayContaining(['Eco-Friendly Coworking Space', 'Nomad Cafe']));
  });

  it('filters by multiple criteria', () => {
    const result = filterListings({
      city: 'Bangkok',
      hasEcoTags: true,
      hasDnFeatures: true,
    });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Eco-Friendly Coworking Space');
  });

  it('returns empty array if no listings match', () => {
    const result = filterListings({
      city: 'Bangkok',
      category: 'cafe' as const,
    });
    expect(result).toEqual([]);
  });

  it('returns empty array if all filters exclude all', () => {
    const result = filterListings({
      city: 'Phuket',
      category: 'accommodation' as const,
      hasEcoTags: true,
      hasDnFeatures: true,
    });
    expect(result).toEqual([]);
  });
});
