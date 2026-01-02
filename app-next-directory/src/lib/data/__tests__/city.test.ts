import {
  getAllCitySlugs,
  getCitiesList,
  getCityBySlug,
  getCityDetailBySlug,
  getListingsByCityId,
} from '../city';

jest.mock('@/lib/sanity/cached-client', () => ({
  cachedClient: { fetch: jest.fn() },
}));

jest.mock('@/lib/sanity/client', () => ({
  client: { fetch: jest.fn() },
  sanityFetch: jest.fn(),
}));

jest.mock('@/lib/dto-transformer', () => ({
  transformToSummaryDTO: jest.fn(value => ({ id: value._id, name: value.name })),
}));

jest.mock('@/data/e2e/discovery-fixtures', () => ({
  isE2ERun: jest.fn(),
  getE2ECitySummary: jest.fn(),
  getE2ECityDetail: jest.fn(),
  getE2ECityList: jest.fn(),
  getE2EListingsForCity: jest.fn(),
}));

const { cachedClient } = require('@/lib/sanity/cached-client');
const { client, sanityFetch } = require('@/lib/sanity/client');
const { transformToSummaryDTO } = require('@/lib/dto-transformer');
const fixtures = require('@/data/e2e/discovery-fixtures');

describe('city data helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Make sanityFetch proxy to the cachedClient.fetch mock by default so
    // existing tests that set cachedClient.fetch will continue to work.
    if (sanityFetch && typeof sanityFetch.mockImplementation === 'function') {
      sanityFetch.mockImplementation(async ({ query, params }: any) => {
        return cachedClient.fetch(query, params ?? {});
      });
    }
  });

  it('uses E2E fixtures when running in E2E mode', async () => {
    fixtures.isE2ERun.mockReturnValue(true);
    fixtures.getE2ECitySummary.mockResolvedValue({ id: 'city-1' });

    const result = await getCityBySlug('lisbon');
    expect(result).toEqual({ id: 'city-1' });
    expect(cachedClient.fetch).not.toHaveBeenCalled();
  });

  it('returns null when Sanity has no matching city', async () => {
    fixtures.isE2ERun.mockReturnValue(false);
    cachedClient.fetch.mockResolvedValue(null);

    const result = await getCityBySlug('unknown');
    expect(result).toBeNull();
  });

  it('returns null for invalid input to toCityDTO', async () => {
    fixtures.isE2ERun.mockReturnValue(false);
    cachedClient.fetch.mockResolvedValue(null);
    const result = await getCityBySlug('unknown');
    expect(result).toBeNull();
  });

  it('returns null for invalid input to toCityDetailDTO', async () => {
    fixtures.isE2ERun.mockReturnValue(false);
    cachedClient.fetch.mockResolvedValue(null);
    const result = await getCityDetailBySlug('unknown');
    expect(result).toBeNull();
  });

  it('normalizes city summaries from Sanity', async () => {
    fixtures.isE2ERun.mockReturnValue(false);
    cachedClient.fetch.mockResolvedValue({
      _id: 'city-1',
      name: 'Lisbon',
      slug: 'lisbon',
      country: 'Portugal',
      sustainabilityScore: 105,
      highlights: ['Sunshine'],
      description: 'Great city',
      primaryImage: {
        asset: {
          url: 'https://example.com/image.jpg',
          metadata: { dimensions: { width: 800, height: 600 } },
        },
      },
    });

    const result = await getCityBySlug('lisbon');
    expect(result).toEqual({
      id: 'city-1',
      name: 'Lisbon',
      slug: 'lisbon',
      country: 'Portugal',
      sustainabilityScore: 100,
      highlights: ['Sunshine'],
      imageUrl: 'https://example.com/image.jpg',
      imageDimensions: { width: 800, height: 600 },
      description: 'Great city',
    });
  });

  it('sanitizes highlights and dimensions when source data is malformed', async () => {
    fixtures.isE2ERun.mockReturnValue(false);
    cachedClient.fetch.mockResolvedValue({
      _id: 'city-2',
      name: 'Porto',
      slug: 'porto',
      country: 'Portugal',
      sustainabilityScore: -5,
      highlights: 'not-an-array',
      primaryImage: {
        asset: {
          url: 'https://example.com/porto.jpg',
          metadata: { dimensions: { width: 'wide' } },
        },
      },
    });

    const result = await getCityBySlug('porto');
    expect(result).toEqual({
      id: 'city-2',
      name: 'Porto',
      slug: 'porto',
      country: 'Portugal',
      sustainabilityScore: 0,
      highlights: [],
      imageUrl: 'https://example.com/porto.jpg',
      imageDimensions: undefined,
      description: undefined,
    });
  });

  it('falls back to default country when none provided', async () => {
    fixtures.isE2ERun.mockReturnValue(false);
    cachedClient.fetch.mockResolvedValue({
      _id: 'city-3',
      name: 'Coimbra',
      slug: 'coimbra',
      highlights: [],
    });

    const result = await getCityBySlug('coimbra');
    expect(result).toEqual({
      id: 'city-3',
      name: 'Coimbra',
      slug: 'coimbra',
      country: '',
      highlights: [],
      imageUrl: undefined,
      imageDimensions: undefined,
      sustainabilityScore: undefined,
      description: undefined,
    });
  });

  it('returns detailed city information with derived arrays', async () => {
    fixtures.isE2ERun.mockReturnValue(false);
    cachedClient.fetch.mockResolvedValue({
      _id: 'city-1',
      name: 'Lisbon',
      slug: 'lisbon',
      country: 'Portugal',
      sustainabilityScore: 75,
      highlights: ['Sunshine'],
      shortDescription: 'Short',
      airQuality: 'Good',
      internetSpeed: 200,
      costOfLiving: 'Medium',
      climate: 'Mild',
      safety: 'Safe',
      walkability: 'High',
      sustainabilityInitiatives: ['Recycling'],
      digitalNomadFeatures: [{ name: 'Coworking' }],
      galleryImages: [{ asset: { url: 'https://example.com/gallery.jpg' } }, null],
      primaryImage: {
        asset: {
          url: 'https://example.com/cover.jpg',
          metadata: { dimensions: { width: 800, height: 600 } },
        },
      },
    });

    const result = await getCityDetailBySlug('lisbon');
    expect(result?.digitalNomadFeatures).toEqual(['Coworking']);
    expect(result?.galleryImages).toEqual(['https://example.com/gallery.jpg']);
    expect(result?.sustainabilityInitiatives).toEqual(['Recycling']);
  });

  it('falls back to empty arrays for non-array detail fields', async () => {
    fixtures.isE2ERun.mockReturnValue(false);
    cachedClient.fetch.mockResolvedValue({
      _id: 'city-5',
      name: 'Faro',
      slug: 'faro',
      highlights: [],
      digitalNomadFeatures: 'not-array',
      sustainabilityInitiatives: 'not-array',
      galleryImages: 'not-array',
    });

    const result = await getCityDetailBySlug('faro');
    expect(result).toMatchObject({
      digitalNomadFeatures: [],
      sustainabilityInitiatives: [],
      galleryImages: [],
    });
  });

  it('delegates to E2E fixtures for detailed city lookups when available', async () => {
    fixtures.isE2ERun.mockReturnValue(true);
    fixtures.getE2ECityDetail.mockResolvedValue({ id: 'city-3', name: 'Test City' });

    const detail = await getCityDetailBySlug('city-3');
    expect(detail).toEqual({ id: 'city-3', name: 'Test City' });
    expect(cachedClient.fetch).not.toHaveBeenCalled();
  });

  it('returns null when detailed city lookup is missing', async () => {
    fixtures.isE2ERun.mockReturnValue(false);
    cachedClient.fetch.mockResolvedValue(undefined);

    const detail = await getCityDetailBySlug('city-4');
    expect(detail).toBeNull();
  });

  it('transforms listings from Sanity responses', async () => {
    fixtures.isE2ERun.mockReturnValue(false);
    cachedClient.fetch.mockResolvedValue([
      {
        _id: 'listing-1',
        name: 'Eco Hub',
        slug: 'eco-hub',
        city: { _id: 'city-1', name: 'Lisbon', slug: 'lisbon', country: 'Portugal' },
      },
    ]);

    const listings = await getListingsByCityId('city-1');
    expect(transformToSummaryDTO).toHaveBeenCalledWith({
      _id: 'listing-1',
      name: 'Eco Hub',
      slug: { current: 'eco-hub' },
      city: { _id: 'city-1', name: 'Lisbon', slug: { current: 'lisbon' }, country: 'Portugal' },
    });
    expect(listings).toEqual([{ id: 'listing-1', name: 'Eco Hub' }]);
  });

  it('handles empty listings array from Sanity', async () => {
    fixtures.isE2ERun.mockReturnValue(false);
    cachedClient.fetch.mockResolvedValue([]);
    const listings = await getListingsByCityId('city-1');
    expect(listings).toEqual([]);
  });

  it('handles listings without populated city reference', async () => {
    fixtures.isE2ERun.mockReturnValue(false);
    cachedClient.fetch.mockResolvedValue([
      {
        _id: 'listing-2',
        name: 'Nomad Space',
        slug: 'nomad-space',
        city: undefined,
      },
    ]);

    const listings = await getListingsByCityId('city-2');
    expect(transformToSummaryDTO).toHaveBeenCalledWith({
      _id: 'listing-2',
      name: 'Nomad Space',
      slug: { current: 'nomad-space' },
      city: undefined,
    });
  });

  it('supports E2E listings shortcut', async () => {
    fixtures.isE2ERun.mockReturnValue(true);
    fixtures.getE2EListingsForCity.mockResolvedValue([{ id: 'listing-1' }]);

    const listings = await getListingsByCityId('city-1');
    expect(listings).toEqual([{ id: 'listing-1' }]);
    expect(cachedClient.fetch).not.toHaveBeenCalled();
  });

  it('returns sanitized city lists', async () => {
    fixtures.isE2ERun.mockReturnValue(false);
    cachedClient.fetch.mockResolvedValue([
      { _id: '1', name: 'Lisbon', slug: 'lisbon', country: 'Portugal', highlights: ['Sun'] },
      null,
    ]);

    const cities = await getCitiesList(1);
    expect(cities).toEqual([
      {
        id: '1',
        name: 'Lisbon',
        slug: 'lisbon',
        country: 'Portugal',
        highlights: ['Sun'],
        imageUrl: undefined,
        imageDimensions: undefined,
        sustainabilityScore: undefined,
        description: undefined,
      },
    ]);
  });

  it('handles empty cities list from Sanity', async () => {
    fixtures.isE2ERun.mockReturnValue(false);
    cachedClient.fetch.mockResolvedValue([]);
    const cities = await getCitiesList(1);
    expect(cities).toEqual([]);
  });

  it('uses E2E city list fixtures when flagged', async () => {
    fixtures.isE2ERun.mockReturnValue(true);
    fixtures.getE2ECityList.mockResolvedValue([{ id: 'fixture-city' }]);

    const result = await getCitiesList(5);
    expect(result).toEqual([{ id: 'fixture-city' }]);
    expect(cachedClient.fetch).not.toHaveBeenCalled();
  });

  it('returns empty list when Sanity payload is not an array', async () => {
    fixtures.isE2ERun.mockReturnValue(false);
    cachedClient.fetch.mockResolvedValue({});

    const cities = await getCitiesList(2);
    expect(cities).toEqual([]);
  });
});

describe('getAllCitySlugs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns all city slugs from Sanity', async () => {
    fixtures.isE2ERun.mockReturnValue(false);
    cachedClient.fetch.mockResolvedValue(['tokyo', 'new-york', 'london', 'paris']);

    const result = await getAllCitySlugs();
    expect(result).toEqual(['tokyo', 'new-york', 'london', 'paris']);
    expect(cachedClient.fetch).toHaveBeenCalledTimes(1);
  });

  it('filters out non-string slugs', async () => {
    fixtures.isE2ERun.mockReturnValue(false);
    cachedClient.fetch.mockResolvedValue(['tokyo', null, '', 'new-york', undefined, 'london']);

    const result = await getAllCitySlugs();
    expect(result).toEqual(['tokyo', 'new-york', 'london']);
  });

  it('returns empty array when Sanity returns null', async () => {
    fixtures.isE2ERun.mockReturnValue(false);
    cachedClient.fetch.mockResolvedValue(null);

    const result = await getAllCitySlugs();
    expect(result).toEqual([]);
  });

  it('returns empty array when Sanity returns non-array', async () => {
    fixtures.isE2ERun.mockReturnValue(false);
    cachedClient.fetch.mockResolvedValue({ invalid: 'data' });

    const result = await getAllCitySlugs();
    expect(result).toEqual([]);
  });

  it('uses E2E fixtures when running in E2E mode', async () => {
    fixtures.isE2ERun.mockReturnValue(true);
    fixtures.getE2ECityList.mockReturnValue([
      { id: '1', slug: 'testopolis', name: 'Testopolis' },
      { id: '2', slug: 'demo-city', name: 'Demo City' },
    ]);

    const result = await getAllCitySlugs();
    expect(result).toEqual(['testopolis', 'demo-city']);
    expect(cachedClient.fetch).not.toHaveBeenCalled();
  });
});
