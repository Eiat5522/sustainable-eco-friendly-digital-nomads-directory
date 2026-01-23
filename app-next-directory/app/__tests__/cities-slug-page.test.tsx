import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

const cityDetailViewSpy = jest.fn((props: any) => (
  <div data-testid="city-detail-view">
    <span data-testid="city-name">{props.city?.name}</span>
    <span data-testid="listing-count">{props.listings?.length ?? 0}</span>
  </div>
));

jest.mock('@/components/city/CityDetailView', () => ({
  CityDetailView: (props: unknown) => cityDetailViewSpy(props),
}));

jest.mock('@/components/layout/Header', () => ({
  Header: () => <div data-testid="header">Header</div>,
}));

jest.mock('@/components/layout/Footer', () => ({
  Footer: () => <div data-testid="footer">Footer</div>,
}));

jest.mock('@/lib/data-access/cities.dal', () => ({
  getCityBySlug: jest.fn(),
  getCityDetailBySlug: jest.fn(),
  getListingsByCityId: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  structuredLogger: { error: jest.fn() },
}));

const originalE2E = process.env.NEXT_PUBLIC_E2E;
const originalE2EFlag = process.env.E2E;

afterEach(() => {
  process.env.NEXT_PUBLIC_E2E = originalE2E;
  process.env.E2E = originalE2EFlag;
  jest.clearAllMocks();
});

describe('CityPage', () => {
  it('renders E2E fixture when slug matches and E2E mode enabled', async () => {
    process.env.NEXT_PUBLIC_E2E = '1';
    process.env.E2E = '0';
    jest.resetModules();

    const [{ default: CityPage }] = await Promise.all([import('../cities/[slug]/page')]);

    const element = await CityPage({ params: Promise.resolve({ slug: 'testopolis' }) });
    render(element);

    // Note: Due to Suspense boundaries with async server components, we verify through mock calls
    // rather than DOM queries in test environment
    expect(cityDetailViewSpy).toHaveBeenCalled();
    const props = cityDetailViewSpy.mock.calls.at(-1)?.[0];
    expect(props?.city?.name).toBe('Testopolis');
    expect(props?.listings).toHaveLength(2);
  });

  it('uses fetched city detail and listings when validation passes', async () => {
    process.env.NEXT_PUBLIC_E2E = '0';
    process.env.E2E = '0';
    jest.resetModules();

    const [pageModule, cityDataModule] = await Promise.all([
      import('../cities/[slug]/page'),
      import('@/lib/data-access/cities.dal'),
    ]);

    const getCityDetailBySlug = cityDataModule.getCityDetailBySlug as jest.Mock;
    const getCityBySlug = cityDataModule.getCityBySlug as jest.Mock;
    const getListingsByCityId = cityDataModule.getListingsByCityId as jest.Mock;

    getCityDetailBySlug.mockResolvedValue({
      id: 'city-eco',
      name: 'Eco City',
      slug: 'eco-city',
      country: 'Wonderland',
      sustainabilityScore: 82,
      highlights: ['Clean transit'],
      imageUrl: null,
      imageDimensions: null,
      description: 'Detailed description',
      shortDescription: 'Short description',
      airQuality: 'Good',
      internetSpeed: { download: 120, upload: 45 },
      costOfLiving: 'Affordable',
      climate: 'Temperate',
      safety: 'High',
      walkability: 'Excellent',
      sustainabilityInitiatives: ['Solar grid'],
      digitalNomadFeatures: ['Coworking hubs'],
      galleryImages: ['https://example.com/gallery.jpg'],
    });
    getCityBySlug.mockResolvedValue(null);
    getListingsByCityId.mockResolvedValue([
      {
        id: 'listing-1',
        name: 'Eco Hub Workspace',
        slug: 'eco-hub-workspace',
        type: 'coworking',
        city: {
          id: 'city-eco',
          name: 'Eco City',
          slug: 'eco-city',
          country: 'Wonderland',
          sustainabilityScore: 82,
          highlights: ['Clean transit'],
          imageUrl: null,
          imageDimensions: null,
          description: 'Detailed description',
        },
        imageUrl: 'https://example.com/listing.jpg',
        ecoFocusTags: ['Solar'],
        digitalNomadFeatures: ['Fast WiFi'],
        priceRange: 'moderate',
        website: 'https://example.com',
        address: '123 Green Road',
        location: { lat: 1, lng: 2 },
        status: 'published',
        verification: 'verified',
        lastVerifiedAt: '2024-01-01',
        featured: true,
        shortDescription: 'Bright workspace',
        amenityNames: ['Fast WiFi'],
      },
    ]);

    const element = await pageModule.default({ params: Promise.resolve({ slug: 'eco-city' }) });
    render(element);

    // Note: Due to Suspense with async server components, we verify through mock calls
    expect(screen.getByTestId('header')).toBeInTheDocument();
    const props = cityDetailViewSpy.mock.calls.at(-1)?.[0];
    expect(props?.city?.name).toBe('Eco City');
    expect(props?.listings).toHaveLength(1);
  });

  it('logs fetch failures and renders fallback city when data cannot be loaded', async () => {
    process.env.NEXT_PUBLIC_E2E = '0';
    process.env.E2E = '0';
    jest.resetModules();

    const [pageModule, cityDataModule, loggerModule] = await Promise.all([
      import('../cities/[slug]/page'),
      import('@/lib/data-access/cities.dal'),
      import('@/lib/logger'),
    ]);

    const getCityDetailBySlug = cityDataModule.getCityDetailBySlug as jest.Mock;
    const getCityBySlug = cityDataModule.getCityBySlug as jest.Mock;

    getCityDetailBySlug.mockRejectedValue(new Error('database offline'));
    getCityBySlug.mockResolvedValue(null);

    const element = await pageModule.default({ params: Promise.resolve({ slug: 'missing-city' }) });
    render(element);

    // Note: Due to Suspense with async server components, we verify through mock calls
    const props = cityDetailViewSpy.mock.calls.at(-1)?.[0];
    expect(props?.city?.name).toBe('Missing City');
    expect(props?.listings).toEqual([]);

    const logger = loggerModule.structuredLogger.error as jest.Mock;
    expect(logger).toHaveBeenCalledWith(
      'City fetch failed',
      expect.objectContaining({ message: 'database offline', name: 'Error' }),
      expect.objectContaining({
        component: 'city-page',
        operation: 'fetch_city_data',
        slug: 'missing-city',
      })
    );
  });

  it('falls back when city validation fails', async () => {
    process.env.NEXT_PUBLIC_E2E = '0';
    process.env.E2E = '0';
    jest.resetModules();

    const [pageModule, cityDataModule, loggerModule] = await Promise.all([
      import('../cities/[slug]/page'),
      import('@/lib/data-access/cities.dal'),
      import('@/lib/logger'),
    ]);

    const getCityDetailBySlug = cityDataModule.getCityDetailBySlug as jest.Mock;
    const getCityBySlug = cityDataModule.getCityBySlug as jest.Mock;

    getCityDetailBySlug.mockResolvedValue({}); // invalid structure
    getCityBySlug.mockResolvedValue({}); // invalid fallback

    const element = await pageModule.default({ params: Promise.resolve({ slug: 'invalid-city' }) });
    render(element);

    // Note: Due to Suspense with async server components, we verify through mock calls
    const props = cityDetailViewSpy.mock.calls.at(-1)?.[0];
    expect(props?.city?.id).toBe('city-invalid-city');
    expect(props?.listings).toEqual([]);

    const logger = loggerModule.structuredLogger.error as jest.Mock;
    expect(logger).toHaveBeenCalledWith(
      'Invalid city DTO validation failed',
      null,
      expect.objectContaining({
        component: 'city-page',
        operation: 'validate_city_dto',
        slug: 'invalid-city',
      })
    );
  });

  it('logs listing validation issues and continues with empty list', async () => {
    process.env.NEXT_PUBLIC_E2E = '0';
    process.env.E2E = '0';
    jest.resetModules();

    const [pageModule, cityDataModule, loggerModule] = await Promise.all([
      import('../cities/[slug]/page'),
      import('@/lib/data-access/cities.dal'),
      import('@/lib/logger'),
    ]);

    const getCityDetailBySlug = cityDataModule.getCityDetailBySlug as jest.Mock;
    const getListingsByCityId = cityDataModule.getListingsByCityId as jest.Mock;

    getCityDetailBySlug.mockResolvedValue({
      id: 'city-eco',
      name: 'Eco City',
      slug: 'eco-city',
      country: 'Wonderland',
      sustainabilityScore: 82,
      highlights: ['Clean transit'],
      imageUrl: null,
      imageDimensions: null,
      description: 'Detailed description',
    });
    getListingsByCityId.mockResolvedValue([{}]); // invalid listing payload

    const element = await pageModule.default({ params: Promise.resolve({ slug: 'eco-city' }) });
    render(element);

    // Note: Due to Suspense with async server components, we verify through mock calls
    const props = cityDetailViewSpy.mock.calls.at(-1)?.[0];
    expect(props?.city?.name).toBe('Eco City');
    expect(props?.listings).toEqual([]);

    const logger = loggerModule.structuredLogger.error as jest.Mock;
    expect(logger).toHaveBeenCalledWith(
      'Invalid ListingSummaryDTO validation failed',
      null,
      expect.objectContaining({
        component: 'city-page',
        operation: 'validate_listings_dto',
        cityId: 'city-eco',
        slug: 'eco-city',
      })
    );
  });
});
