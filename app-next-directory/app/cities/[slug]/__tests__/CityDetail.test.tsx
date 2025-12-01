import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { CityDetail } from '../CityDetail';

const cityDetailViewSpy = jest.fn((props: any) => (
  <div data-testid="city-detail-view">
    <span data-testid="city-name">{props.city?.name}</span>
    <span data-testid="listing-count">{props.listings?.length ?? 0}</span>
  </div>
));

jest.mock('../ClientCityDetailViewWrapper', () => ({
  __esModule: true,
  default: (props: unknown) => cityDetailViewSpy(props),
}));

jest.mock('@/lib/data/city', () => ({
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

describe('CityDetail (server component)', () => {
  it('uses fetched city detail and listings when validation passes', async () => {
    const cityDataModule = await import('@/lib/data/city');
    const getCityDetailBySlug = cityDataModule.getCityDetailBySlug as jest.Mock;
    const getCityBySlug = cityDataModule.getCityBySlug as jest.Mock;
    const getListingsByCityId = cityDataModule.getListingsByCityId as jest.Mock;

    getCityDetailBySlug.mockResolvedValue({
      id: 'city-eco',
      name: 'Eco City',
      slug: 'eco-city',
      country: 'Wonderland',
      highlights: ['Clean transit'],
      imageUrl: null,
      imageDimensions: null,
      description: 'Detailed description',
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

    const element = await CityDetail({ slug: 'eco-city' });
    render(element);

    const props = cityDetailViewSpy.mock.calls.at(-1)?.[0];
    expect(props.city.name).toBe('Eco City');
    expect(props.listings).toHaveLength(1);
  });

  it('logs fetch failures and renders fallback city when data cannot be loaded', async () => {
    const [cityDataModule, loggerModule] = await Promise.all([
      import('@/lib/data/city'),
      import('@/lib/logger'),
    ]);

    const getCityDetailBySlug = cityDataModule.getCityDetailBySlug as jest.Mock;
    const getCityBySlug = cityDataModule.getCityBySlug as jest.Mock;

    getCityDetailBySlug.mockRejectedValue(new Error('database offline'));
    getCityBySlug.mockResolvedValue(null);

    const element = await CityDetail({ slug: 'missing-city' });
    render(element);

    const props = cityDetailViewSpy.mock.calls.at(-1)?.[0];
    expect(props.city.name).toBe('Missing City');
    expect(props.listings).toEqual([]);

    const logger = loggerModule.structuredLogger.error as jest.Mock;
    expect(logger).toHaveBeenCalled();
  });
});
