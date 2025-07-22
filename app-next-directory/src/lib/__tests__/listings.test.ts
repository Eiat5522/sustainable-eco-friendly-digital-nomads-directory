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
    name: 'Eco Hostel',
    slug: { current: 'eco-hostel' },
    city: { name: 'Bangkok', slug: { current: 'bangkok' } },
    type: 'accommodation',
    address: '123 Eco St',
    shortDescription: 'Eco-friendly hostel',
    longDescription: 'A very eco-friendly hostel.',
    ecoTags: [
  { _id: 'solar', name: 'Solar Powered', slug: { current: 'solar-powered' } },
  { _id: 'recycling', name: 'Recycling Program', slug: { current: 'recycling-program' } }
],
    ecoDetails: { description: '', ecoTags: [], certifications: [] },
    sourceUrls: ['http://example.com/eco-hostel'],
    mainImage: '/images/eco-hostel.jpg',
    galleryImages: ['/images/eco-hostel-1.jpg'],
    digitalNomadFeatures: ['wifi', 'coworking'],
    lastVerifiedDate: '2025-01-01',
    coordinates: { latitude: 13.7563, longitude: 100.5018 },
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
    ecoTags: [],
    ecoDetails: { description: '', ecoTags: [], certifications: [] },
    sourceUrls: ['http://example.com/nomad-cafe'],
    mainImage: '/images/nomad-cafe.jpg',
    galleryImages: ['/images/nomad-cafe-1.jpg'],
    digitalNomadFeatures: ['wifi'],
    lastVerifiedDate: '2025-01-01',
    coordinates: { latitude: 18.7880, longitude: 98.9870 },
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
    ecoTags: [
      { _id: 'organic', name: 'Organic', slug: { current: 'organic' } }
    ],
    ecoDetails: { description: '', ecoTags: [], certifications: [] },
    sourceUrls: ['http://example.com/green-resort'],
    mainImage: '/images/green-resort.jpg',
    galleryImages: ['/images/green-resort-1.jpg'],
    digitalNomadFeatures: [],
    lastVerifiedDate: '2025-01-01',
    coordinates: { latitude: 13.7123, longitude: 100.5555 },
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
