/**
 * @fileoverview
 * Jest unit tests for listings.ts.
 * Ensures robust mocking, isolation, and modern Jest best practices.
 */
import { Listing } from '../../types/listings';

// Mock data for listings
const mockListings: Listing[] = [
  {
    id: '1',
    name: 'Eco Hostel',
    slug: 'eco-hostel',
    city: 'Bangkok',
    category: 'accommodation',
    address_string: '123 Eco St',
    description_short: 'Eco-friendly hostel',
    description_long: 'A very eco-friendly hostel.',
    eco_focus_tags: ['solar', 'recycling'],
    eco_notes_detailed: 'Uses solar power and recycles everything.',
    source_urls: ['http://example.com/eco-hostel'],
    primary_image_url: '/images/eco-hostel.jpg',
    gallery_image_urls: ['/images/eco-hostel-1.jpg'],
    digital_nomad_features: ['wifi', 'coworking'],
    last_verified_date: '2025-01-01',
    coordinates: { latitude: 13.7563, longitude: 100.5018 },
  },
  {
    id: '2',
    name: 'Nomad Cafe',
    slug: 'nomad-cafe',
    city: 'Chiang Mai',
    category: 'cafe',
    address_string: '456 Nomad Rd',
    description_short: 'Cafe for digital nomads',
    description_long: 'A great cafe with fast wifi for digital nomads.',
    eco_focus_tags: [],
    eco_notes_detailed: 'No specific eco features.',
    source_urls: ['http://example.com/nomad-cafe'],
    primary_image_url: '/images/nomad-cafe.jpg',
    gallery_image_urls: ['/images/nomad-cafe-1.jpg'],
    digital_nomad_features: ['wifi'],
    last_verified_date: '2025-01-01',
    coordinates: { latitude: 18.7880, longitude: 98.9870 },
  },
  {
    id: '3',
    name: 'Green Resort',
    slug: 'green-resort',
    city: 'Bangkok',
    category: 'accommodation',
    address_string: '789 Green Blvd',
    description_short: 'Resort with organic food',
    description_long: 'A beautiful resort focusing on organic produce.',
    eco_focus_tags: ['organic'],
    eco_notes_detailed: 'Serves organic food from its own farm.',
    source_urls: ['http://example.com/green-resort'],
    primary_image_url: '/images/green-resort.jpg',
    gallery_image_urls: ['/images/green-resort-1.jpg'],
    digital_nomad_features: [],
    last_verified_date: '2025-01-01',
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
