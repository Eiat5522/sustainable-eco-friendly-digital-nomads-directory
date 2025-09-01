/**
 * Focused tests for category normalization behavior in filterListings
 * Ensures legacy 'activity' coerces to canonical 'activities'.
 */

import type { Listing } from '../../types/listings';

// Minimal mock dataset containing an activities listing
const mockListings: Listing[] = [
  {
    _id: 'a1',
    name: 'Island Adventure Tours',
    slug: { current: 'island-adventure-tours' },
    city: { name: 'Phuket', slug: { current: 'phuket' } },
    type: 'activities',
    address: 'Pier 9',
    shortDescription: 'Eco-friendly kayak and snorkel tours',
    longDescription: 'Explore marine life with certified eco guides.',
    ecoFocusTags: [],
    priceRange: 'moderate',
    website: 'https://example.com/adventure',
    primaryImage: { _type: 'image', asset: { _ref: 'image-ref-a1' } },
    galleryImages: [],
    digitalNomadFeatures: [],
    lastVerifiedDate: '2025-01-01',
    location: { lat: 7.8804, lng: 98.3923 },
  },
  {
    _id: 'b2',
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
    galleryImages: [],
    digitalNomadFeatures: [],
    lastVerifiedDate: '2025-01-01',
    location: { lat: 18.7880, lng: 98.9870 },
  },
];

describe('filterListings normalization', () => {
  let filterListings: typeof import('../listings').filterListings;

  beforeEach(() => {
    jest.resetModules();
    jest.doMock('../../data/listings.json', () => ({
      __esModule: true,
      default: mockListings,
    }));
    filterListings = require('../listings').filterListings;
  });

  it('coerces category "activity" → "activities"', () => {
    const legacy = filterListings({ category: 'activity' as any });
    const canonical = filterListings({ category: 'activities' as any });
    expect(legacy.map((l) => l.name)).toEqual(canonical.map((l) => l.name));
    expect(legacy).toHaveLength(1);
    expect(legacy[0].type).toBe('activities');
  });
});

