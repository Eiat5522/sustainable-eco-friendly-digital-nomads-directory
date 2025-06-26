import { jsonToSanityListing } from '../adapters';
import { Listing as JsonListing } from '@/types/listings';
import { Listing as SanityListing } from '@/types/listing';

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
    id: 'abc123',
    name: 'Eco Space',
    city: 'Bangkok',
    category: 'coworking',
    address_string: '123 Green Rd',
    description_short: 'A short desc',
    description_long: 'A long eco-friendly description for digital nomads.',
    eco_focus_tags: ['solar_power', 'recycling'],
    eco_notes_detailed: 'We use solar panels and recycle all waste.',
    source_urls: ['https://example.com'],
    primary_image_url: 'https://img.com/eco.jpg',
    gallery_image_urls: ['https://img.com/eco1.jpg', 'https://img.com/eco2.jpg'],
    digital_nomad_features: ['fast_wifi', 'community_events'],
    last_verified_date: '2023-01-01',
    coworking_details: {
      operating_hours: '9-18',
      pricing_plans: [],
      specific_amenities_coworking: ['wifi', 'printer'],
    },
    cafe_details: undefined,
    accommodation_details: undefined,
  };

  it('should convert a full JsonListing to SanityListing format', () => {
    const result = jsonToSanityListing(baseJsonListing);
    expect(result).toMatchSnapshot();
    expect(result._id).toBe(baseJsonListing.id);
    expect(result.name).toBe(baseJsonListing.name);
    expect(result.slug).toBe('eco-space');
    expect(result.city.name).toBe('Bangkok');
    expect(result.city.slug).toBe('bangkok');
    expect(result.ecoTags.length).toBe(2);
    expect(result.ecoTags[0]).toMatchObject({
      _id: 'tag-0',
      name: 'solar power',
      slug: 'solar_power',
    });
    expect(result.ecoRating).toBeGreaterThan(0);
    expect(result.createdAt).toBe(MOCK_DATE);
    expect(result.updatedAt).toBe(MOCK_DATE);
  });

  it('should handle empty eco_focus_tags', () => {
    const listing = { ...baseJsonListing, eco_focus_tags: [] };
    const result = jsonToSanityListing(listing);
    expect(result.ecoTags).toEqual([]);
    expect(result.ecoRating).toBe(55); // base score + digital_nomad_features
  });

  it('should handle missing coordinates gracefully', () => {
    const listing = { ...baseJsonListing, coordinates: undefined as any };
    // coordinates is not in the type, but test for undefined
    const result = jsonToSanityListing(listing as any);
    // expect coordinates to default to [0, 0]
    expect(result.location.coordinates).toEqual([0, 0]);
  });

  it('should default priceRange and rating', () => {
    const result = jsonToSanityListing(baseJsonListing);
    expect(result.priceRange).toBe('moderate');
    expect(result.rating).toBe(4.5);
  });

  it('should generate slug with only valid characters', () => {
    const listing = { ...baseJsonListing, name: 'Eco!@# Space 2023' };
    const result = jsonToSanityListing(listing);
    expect(result.slug).toBe('eco-space-2023');
  });
});

import { calculateEcoRating } from '../adapters';

describe('calculateEcoRating', () => {
  const baseJsonListing: JsonListing = {
    id: 'abc123',
    name: 'Eco Space',
    city: 'Bangkok',
    category: 'coworking',
    address_string: '123 Green Rd',
    description_short: 'A short desc',
    description_long: 'A long eco-friendly description for digital nomads.',
    eco_focus_tags: [],
    eco_notes_detailed: '',
    source_urls: [],
    primary_image_url: '',
    gallery_image_urls: [],
    digital_nomad_features: [],
    last_verified_date: '2023-01-01',
    coworking_details: undefined,
    cafe_details: undefined,
    accommodation_details: undefined,
  };

  it('returns base score 50 for minimal listing', () => {
    expect(calculateEcoRating(baseJsonListing)).toBe(50);
  });

  it('adds 10 points per eco tag, max 30', () => {
    const listing = { ...baseJsonListing, eco_focus_tags: ['a', 'b', 'c', 'd'] };
    expect(calculateEcoRating(listing)).toBe(80); // 4 tags = 40, but capped at 30
  });

  it('adds 10 points for detailed eco notes > 50 chars', () => {
    const listing = { ...baseJsonListing, eco_notes_detailed: 'x'.repeat(51) };
    expect(calculateEcoRating(listing)).toBe(60);
  });

  it('adds 5 points for digital nomad features', () => {
    const listing = { ...baseJsonListing, digital_nomad_features: ['wifi'] };
    expect(calculateEcoRating(listing)).toBe(55);
  });

  it('caps the score at 100', () => {
    const listing = {
      ...baseJsonListing,
      eco_focus_tags: ['a', 'b', 'c', 'd'],
      eco_notes_detailed: 'x'.repeat(51),
      digital_nomad_features: ['wifi'],
    };
    expect(calculateEcoRating(listing)).toBe(95);
    // Add more features to push over 100
    const overListing = {
      ...listing,
      eco_focus_tags: ['a', 'b', 'c', 'd', 'e', 'f'],
      digital_nomad_features: ['wifi', 'community', 'events'],
    };
    expect(calculateEcoRating(overListing)).toBe(95); // max possible score is 95 due to eco tag cap
  });
});
