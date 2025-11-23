import {
  buildE2ESearchResponse,
  e2eDiscoveryCities,
  e2eDiscoveryListings,
  getE2ECityDetail,
  getE2ECityList,
  getE2ECitySummary,
  getE2EListingsForCity,
  isE2ERun,
  parseSearchParamsForE2E,
} from '../discovery-fixtures';

describe('E2E discovery fixtures', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('detects E2E mode from environment variables', () => {
    delete process.env.E2E;
    process.env.NEXT_PUBLIC_E2E = 'true';
    expect(isE2ERun()).toBe(true);

    delete process.env.NEXT_PUBLIC_E2E;
    process.env.E2E = 'yes';
    expect(isE2ERun()).toBe(true);

    process.env.NEXT_PUBLIC_E2E = 'nope';
    process.env.E2E = '0';
    expect(isE2ERun()).toBe(false);
  });

  it('normalises search params for the e2e API', () => {
    const params = parseSearchParamsForE2E({
      q: ['coworking'],
      category: 'cafe',
      destination: ['bangkok', 'phuket'],
      amenities: undefined,
      nomadFeatures: ['Fast WiFi', '24/7 Access'],
    });

    expect(params).toEqual({
      q: 'coworking',
      categories: ['cafe'],
      destinations: ['bangkok', 'phuket'],
      amenities: [],
      nomadFeatures: ['Fast WiFi', '24/7 Access'],
    });
  });

  it('filters search results and paginates them deterministically', () => {
    const response = buildE2ESearchResponse({
      q: 'chiang',
      categories: ['accommodation'],
      destinations: ['chiang-mai'],
      amenities: [],
      nomadFeatures: [],
      page: 1,
      limit: 5,
      includeFacets: true,
    });

    expect(response.pagination.total).toBeGreaterThan(0);
    expect(response.results.every(result => result.slug.includes('chiang'))).toBe(true);
    expect(response.filters).toEqual({
      query: 'chiang',
      category: ['accommodation'],
      destination: ['chiang-mai'],
      amenities: [],
      nomadFeatures: [],
    });
    expect(response.facets?.category.length).toBeGreaterThan(0);
    expect(
      response.facets?.destination.find(bucket => bucket.value === 'Chiang Mai')?.count
    ).toBeGreaterThan(0);
  });

  it('creates a city summary without detail-only fields', () => {
    const baseCity = e2eDiscoveryCities[0];
    const summary = getE2ECitySummary(baseCity.slug);

    expect(summary).toMatchObject({
      id: baseCity.id,
      name: baseCity.name,
      slug: baseCity.slug,
      country: baseCity.country,
    });
    expect(summary).not.toHaveProperty('galleryImages');
    expect(getE2ECitySummary('does-not-exist')).toBeNull();
  });

  it('returns a complete city detail when found', () => {
    const detail = getE2ECityDetail(e2eDiscoveryCities[1].slug);
    expect(detail).toEqual(e2eDiscoveryCities[1]);
    expect(getE2ECityDetail('missing')).toBeNull();
  });

  it('limits the city list and reuses summary logic', () => {
    const list = getE2ECityList(2);
    expect(list).toHaveLength(2);
    expect(list[0]).toEqual(getE2ECitySummary(e2eDiscoveryCities[0].slug));
    expect(getE2ECityList(99)).toHaveLength(e2eDiscoveryCities.length);
  });

  it('maps listings for a city using the summary DTO shape', () => {
    const targetCity = e2eDiscoveryCities[0];
    const listings = getE2EListingsForCity(targetCity.id);
    expect(listings.every(listing => listing.city.id === targetCity.id)).toBe(true);
    expect(listings[0]).toHaveProperty('digitalNomadFeatures');
    expect(getE2EListingsForCity('nope')).toEqual([]);
  });

  it('exposes the raw fixture datasets for direct assertions', () => {
    expect(e2eDiscoveryListings.length).toBeGreaterThan(0);
    expect(e2eDiscoveryCities.length).toBeGreaterThan(0);
  });
});
