import type { SanityListing } from '@/types/sanity.types';
import {
  FALLBACK_IMAGE,
  imageOrFallback,
  transformToBlogDetailDTO,
  transformToBlogSummaryDTO,
  transformToDetailDTO,
  transformToFeaturedDTO,
  transformToSummaryDTO,
} from '../dto-transformer';

const builderCalls: Array<{
  __state: { input: unknown; width: number; height: number; fit: string; auto: string };
}> = [];

const createBuilder = (input: unknown) => {
  const state = { input, width: 0, height: 0, fit: '', auto: '' };
  const builder: any = {
    __state: state,
    width: jest.fn((value: number) => {
      state.width = value;
      return builder;
    }),
    height: jest.fn((value: number) => {
      state.height = value;
      return builder;
    }),
    fit: jest.fn((value: string) => {
      state.fit = value;
      return builder;
    }),
    auto: jest.fn((value: string) => {
      state.auto = value;
      return builder;
    }),
    url: jest.fn(() => `cdn/${state.width}x${state.height}/${state.fit}/${state.auto}`),
  };
  builderCalls.push(builder);
  return builder;
};

const urlForMock = jest.fn((input: unknown) => createBuilder(input));

jest.mock('@/lib/sanity/client', () => ({
  urlFor: (input: unknown) => urlForMock(input),
}));

const isImageAssetIdMock = jest.fn();

jest.mock('@sanity/asset-utils', () => ({
  isImageAssetId: (value: unknown) => isImageAssetIdMock(value),
}));

describe('dto-transformer image helpers', () => {
  beforeEach(() => {
    builderCalls.length = 0;
    urlForMock.mockClear();
    isImageAssetIdMock.mockReset();
  });

  it('appends transformations to absolute urls', () => {
    const url = imageOrFallback('https://example.com/image.jpg?foo=bar', 400, 300);
    expect(url).toBe('https://example.com/image.jpg?foo=bar&w=400&h=300&fit=crop&auto=format');
  });

  it('builds urls using sanity asset ids', () => {
    isImageAssetIdMock.mockImplementation(
      value => typeof value === 'string' && value.startsWith('image-')
    );
    const url = imageOrFallback('image-asset-ref', 320, 180);
    expect(url).toBe('cdn/320x180/crop/format');
    expect(builderCalls[0].__state).toMatchObject({
      input: 'image-asset-ref',
      width: 320,
      height: 180,
      fit: 'crop',
      auto: 'format',
    });
  });

  it('falls back when image data is invalid', () => {
    isImageAssetIdMock.mockReturnValue(false);
    expect(imageOrFallback('', 100, 100)).toBe(FALLBACK_IMAGE);
    expect(imageOrFallback({ bad: true }, 100, 100)).toBe(FALLBACK_IMAGE);
  });

  it('reuses existing asset urls and appends transformations', () => {
    const url = imageOrFallback({ asset: { url: 'https://cdn.test/image.png' } }, 500, 250);
    expect(url).toBe('https://cdn.test/image.png?w=500&h=250&fit=crop&auto=format');
  });

  it('builds from sanity image objects when asset refs are valid', () => {
    isImageAssetIdMock.mockImplementation(
      value => typeof value === 'string' && value.includes('valid')
    );
    const sanityImage = { asset: { _ref: 'valid-asset-ref' } };
    const url = imageOrFallback(sanityImage, 640, 360);
    expect(url).toBe('cdn/640x360/crop/format');
    expect(builderCalls[0].__state.input).toEqual(sanityImage);
  });
});

describe('listing DTO transformers', () => {
  const baseListing: SanityListing = {
    _id: 'listing-1',
    _type: 'listing',
    name: 'Eco Space',
    slug: { current: 'eco-space' },
    type: 'coworking',
    shortDescription: 'Short',
    longDescription: 'Long description',
    address: '123 Street',
    location: { lat: 12.34, lng: 56.78 },
    priceRange: { min: 100, max: 200 },
    website: 'https://eco.example.com',
    primaryImage: 'image-primary',
    galleryImages: ['image-gallery-1', 'image-gallery-2'],
    ecoFocusTags: [{ _type: 'reference', _ref: 'tag1' }],
    digitalNomadFeatures: [{ _type: 'reference', _ref: 'feature1' }],
    amenities: [{ _type: 'reference', _ref: 'amenity1' }],
    city: {
      _type: 'reference',
      _ref: 'city1',
      _weak: false,
    },
    contactEmail: 'contact@example.com',
    contactPhone: '+66 1234',
    sustainabilityScore: 95,
    moderation: { status: 'published' },
    coworkingDetails: {
      pricingPlans: [
        { type: 'Hot desk', price: 150, period: 'day', features: ['Coffee', 'Fast WiFi'] },
        { type: 'Invalid plan', price: null, period: null },
      ],
      openingHours: [{ day: 'Mon', opens: '08:00', closes: '18:00' }],
      internetSpeed: '1Gbps',
    },
  } as unknown as SanityListing;

  beforeEach(() => {
    builderCalls.length = 0;
    urlForMock.mockClear();
    isImageAssetIdMock.mockReset();
    isImageAssetIdMock.mockImplementation(
      value => typeof value === 'string' && value.includes('image')
    );
  });

  it('transforms listings to featured DTOs', () => {
    const dto = transformToFeaturedDTO(baseListing);
    expect(dto).toMatchObject({
      id: 'listing-1',
      name: 'Eco Space',
      slug: 'eco-space',
      imageUrl: expect.stringContaining('cdn/500x300'),
    });
  });

  it('normalises summary data, including type fallback and deduplicated amenities', () => {
    const listing = {
      ...baseListing,
      slug: { current: 'eco-space' },
      type: 'unknown-type',
      website: 'ftp://invalid',
      amenities: [{ name: 'WiFi' }, { name: 'wifi ' }, { name: 'Coffee' }],
      city: {
        _id: 'city1',
        name: 'Chiang Mai',
        country: 'Thailand',
        slug: { current: 'chiang-mai' },
        sustainabilityScore: 130,
        highlights: ['Mountains'],
      },
      location: { lat: 10, lng: NaN },
    } as unknown as SanityListing;

    const dto = transformToSummaryDTO(listing);
    expect(dto.type).toBe('activities');
    expect(dto.website).toBeUndefined();
    expect(dto.city).toMatchObject({
      id: 'city1',
      name: 'Chiang Mai',
      country: 'Thailand',
      slug: 'chiang-mai',
      sustainabilityScore: 100,
    });
    expect(dto.location).toBeUndefined();
    expect(dto.amenityNames).toEqual(['WiFi', 'Coffee']);
  });

  it('builds detailed DTO for coworking listings', () => {
    const dto = transformToDetailDTO(baseListing);
    expect(dto.type).toBe('coworking');
    expect(dto.coworkingDetails?.pricingPlans).toHaveLength(1);
    expect(dto.coworkingDetails?.pricingPlans?.[0]).toMatchObject({
      type: 'Hot desk',
      price: { amount: 150, currency: 'THB', unit: 'hour' },
    });
    expect(dto.coworkingDetails?.openingHours).toEqual([
      { day: 'Mon', opens: '08:00', closes: '18:00' },
    ]);
  });

  it('builds detailed DTO for cafes', () => {
    const listing = {
      ...baseListing,
      type: 'cafe',
      cafeDetails: {
        openingHours: [{ day: 'Tue', opens: '09:00', closes: '17:00' }],
        priceIndication: 'affordable',
        menuHighlights: ['Vegan options'],
        noiseLevel: 'Moderate',
        workPolicy: 'Laptop friendly',
      },
    } as unknown as SanityListing;

    const dto = transformToDetailDTO(listing);
    expect(dto.type).toBe('cafe');
    expect(dto.cafeDetails?.menuHighlights).toEqual(['Vegan options']);
  });

  it('builds detailed DTO for restaurants', () => {
    const listing = {
      ...baseListing,
      type: 'restaurant',
      restaurantDetails: {
        cuisineType: 'Thai',
        dietaryOptions: ['Vegan'],
        averageMealPriceThb: 250,
      },
    } as unknown as SanityListing;

    const dto = transformToDetailDTO(listing);
    expect(dto.type).toBe('restaurant');
    expect(dto.restaurantDetails?.averageMealPrice).toEqual({
      amount: 250,
      currency: 'THB',
      unit: 'meal',
    });
  });

  it('builds detailed DTO for activities', () => {
    const listing = {
      ...baseListing,
      type: 'activities',
      activitiesDetails: {
        activityType: 'Hiking',
        duration: { value: 4, unit: 'hours' },
        skillLevel: 'Beginner',
      },
    } as unknown as SanityListing;

    const dto = transformToDetailDTO(listing);
    expect(dto.type).toBe('activities');
    expect(dto.activityDetails).toMatchObject({ activityType: 'Hiking', duration: '4 hours' });
  });

  it('builds detailed DTO for accommodation', () => {
    const listing = {
      ...baseListing,
      type: 'accommodation',
      accommodationDetails: {
        accommodationType: 'Hotel',
        pricePerNightThb: { min: 900 },
        roomTypesAvailable: [{ type: 'Suite' }],
        minimumStay: 3,
      },
    } as unknown as SanityListing;

    const dto = transformToDetailDTO(listing);
    expect(dto.type).toBe('accommodation');
    expect(dto.accommodationDetails).toMatchObject({
      accommodationType: 'Hotel',
      pricePerNight: { amount: 900, currency: 'THB', unit: 'night' },
      roomTypes: ['Suite'],
    });
  });

  it('throws for unsupported listing types', () => {
    const listing = { ...baseListing, type: 'other' } as unknown as SanityListing;
    expect(() => transformToDetailDTO(listing)).toThrow('Unsupported listing type: other');
  });

  it('handles missing optional fields gracefully', () => {
    const listing = {
      ...baseListing,
      shortDescription: null,
      website: null,
      location: null,
    } as unknown as SanityListing;

    const dto = transformToSummaryDTO(listing);
    expect(dto.shortDescription).toBeUndefined();
    expect(dto.website).toBeUndefined();
    expect(dto.location).toBeUndefined();
  });
});

describe('blog DTO transformers', () => {
  beforeEach(() => {
    builderCalls.length = 0;
    urlForMock.mockClear();
    isImageAssetIdMock.mockReset();
    isImageAssetIdMock.mockReturnValue(true);
  });

  it('transforms blog summary documents and filters tags', () => {
    const summary = transformToBlogSummaryDTO({
      _id: 'post-1',
      title: 'Discover Thailand',
      slug: { current: 'discover-thailand' },
      excerpt: 'Explore sustainable travel tips.',
      primaryImage: 'image-blog',
      tags: ['Travel', null, 42, ' Green '],
      readingTime: '6',
      authorName: 'Alice',
      publishedAt: '2023-01-01',
    });

    expect(summary).toMatchObject({
      id: 'post-1',
      slug: 'discover-thailand',
      readingTime: 6,
      tags: ['Travel', 'Green'],
      imageUrl: expect.stringContaining('cdn/800x450'),
    });
  });

  it('transforms blog detail documents with related posts', () => {
    const detail = transformToBlogDetailDTO({
      _id: 'post-1',
      title: 'Discover Thailand',
      slug: { current: 'discover-thailand' },
      primaryImage: 'image-blog',
      body: [{ _type: 'block', children: [] }],
      relatedPosts: [
        {
          _id: 'post-2',
          title: 'Bangkok guide',
          slug: { current: 'bangkok-guide' },
          primaryImage: 'image-related',
        },
        null,
      ],
      authorImage: 'image-author',
    });

    expect(detail.relatedPosts).toHaveLength(1);
    expect(detail.authorImageUrl).toContain('cdn/96x96');
    expect(detail.imageUrl).toContain('cdn/1200x630');
  });
});
