// Jest unit tests for listings.ts
import * as listingsModule from '../listings';

const mockListings = [
  {
    name: 'Eco Hostel',
    slug: 'eco-hostel',
    city: 'Bangkok',
    category: 'hostel',
    eco_focus_tags: ['solar', 'recycling'],
    digital_nomad_features: ['wifi', 'coworking'],
  },
  {
    name: 'Nomad Cafe',
    slug: 'nomad-cafe',
    city: 'Chiang Mai',
    category: 'cafe',
    eco_focus_tags: [],
    digital_nomad_features: ['wifi'],
  },
  {
    name: 'Green Resort',
    slug: 'green-resort',
    city: 'Bangkok',
    category: 'resort',
    eco_focus_tags: ['organic'],
    digital_nomad_features: [],
  },
];

jest.spyOn(listingsModule, 'getListings').mockImplementation(() => mockListings as any);

describe('getListingsByCity', () => {
  it('returns listings for a city (case-insensitive)', () => {
    const result = listingsModule.getListingsByCity('bangkok');
    expect(result).toHaveLength(2);
    expect(result.map(l => l.name)).toEqual(expect.arrayContaining(['Eco Hostel', 'Green Resort']));
  });

  it('returns listings for a city with different case', () => {
    const result = listingsModule.getListingsByCity('CHIANG MAI');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Nomad Cafe');
  });

  it('returns empty array if no listings in city', () => {
    const result = listingsModule.getListingsByCity('Phuket');
    expect(result).toEqual([]);
  });
});

describe('filterListings', () => {
  it('returns all listings if no filters', () => {
    const result = listingsModule.filterListings({});
    expect(result).toHaveLength(3);
  });

  it('filters by category', () => {
    const result = listingsModule.filterListings({ category: 'hostel' });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Eco Hostel');
  });

  it('filters by city (case-insensitive)', () => {
    const result = listingsModule.filterListings({ city: 'bangkok' });
    expect(result).toHaveLength(2);
    expect(result.map(l => l.name)).toEqual(expect.arrayContaining(['Eco Hostel', 'Green Resort']));
  });

  it('filters by hasEcoTags', () => {
    const result = listingsModule.filterListings({ hasEcoTags: true });
    expect(result).toHaveLength(2);
    expect(result.map(l => l.name)).toEqual(expect.arrayContaining(['Eco Hostel', 'Green Resort']));
  });

  it('filters by hasDnFeatures', () => {
    const result = listingsModule.filterListings({ hasDnFeatures: true });
    expect(result).toHaveLength(2);
    expect(result.map(l => l.name)).toEqual(expect.arrayContaining(['Eco Hostel', 'Nomad Cafe']));
  });

  it('filters by multiple criteria', () => {
    const result = listingsModule.filterListings({
      city: 'Bangkok',
      hasEcoTags: true,
      hasDnFeatures: true,
    });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Eco Hostel');
  });

  it('returns empty array if no listings match', () => {
    const result = listingsModule.filterListings({
      city: 'Bangkok',
      category: 'cafe',
    });
    expect(result).toEqual([]);
  });

  it('returns empty array if all filters exclude all', () => {
    const result = listingsModule.filterListings({
      city: 'Phuket',
      category: 'villa',
      hasEcoTags: true,
      hasDnFeatures: true,
    });
    expect(result).toEqual([]);
  });
});
