/** @jest-environment jsdom */

import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import {
  getAllCitySlugs,
  getCityBySlug,
  getCityDetailBySlug,
  getListingsByCityId,
} from '@/lib/data-access/cities.dal';
import { structuredLogger } from '@/lib/logger';
import { CityContent, generateStaticParams } from './page';

jest.mock('@/lib/data-access/cities.dal', () => ({
  getCityBySlug: jest.fn(),
  getCityDetailBySlug: jest.fn(),
  getListingsByCityId: jest.fn(),
  getAllCitySlugs: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  structuredLogger: {
    error: jest.fn(),
  },
}));

jest.mock('@/components/city/CityDetailView', () => ({
  CityDetailView: ({ city, listings }: any) => (
    <div>
      <h1 data-testid="city-name">{city.name}</h1>
      <p data-testid="city-description">{city.description}</p>
      <div data-testid="listings">
        {listings.map((listing: any) => (
          <div key={listing.id}>{listing.name}</div>
        ))}
      </div>
    </div>
  ),
}));

jest.mock('@/components/layout/Header', () => ({
  Header: () => <header>Header</header>,
}));

jest.mock('@/components/layout/Footer', () => ({
  Footer: () => <footer>Footer</footer>,
}));

const renderCityContent = async (slug: string) => {
  const content = await CityContent({ slug });
  render(content);
};

describe('CityPage', () => {
  const mockCity = {
    id: '1',
    name: 'Test City',
    slug: 'test-city',
    country: 'Test Country',
    description: 'A city for testing.',
    highlights: [],
    imageUrl: null,
    imageDimensions: null,
    sustainabilityScore: 85,
    shortDescription: 'A short description.',
    internetSpeed: { download: 100, upload: 50 },
    costOfLiving: 'Medium',
    climate: 'Mild',
    safety: 'High',
    walkability: 'High',
    airQuality: 'Good',
    sustainabilityInitiatives: [],
    digitalNomadFeatures: [],
    galleryImages: [],
  };

  const mockListings = [
    {
      id: '1',
      name: 'Test Listing 1',
      slug: 'test-listing-1',
      type: 'coworking' as const,
      city: {
        id: '1',
        name: 'Test City',
        slug: 'test-city',
        country: 'Test Country',
      },
      shortDescription: 'desc 1',
    },
    {
      id: '2',
      name: 'Test Listing 2',
      slug: 'test-listing-2',
      type: 'accommodation' as const,
      city: {
        id: '1',
        name: 'Test City',
        slug: 'test-city',
        country: 'Test Country',
      },
      shortDescription: 'desc 2',
    },
  ];

  const originalE2E = process.env.NEXT_PUBLIC_E2E;
  const originalE2EEnv = process.env.E2E;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset E2E environment variables
    delete process.env.NEXT_PUBLIC_E2E;
    delete process.env.E2E;
  });

  afterEach(() => {
    // Restore original E2E environment variables
    if (originalE2E !== undefined) {
      process.env.NEXT_PUBLIC_E2E = originalE2E;
    }
    if (originalE2EEnv !== undefined) {
      process.env.E2E = originalE2EEnv;
    }
  });

  it('should render the city details and listings when data is fetched successfully', async () => {
    (getCityDetailBySlug as jest.Mock).mockResolvedValue(mockCity);
    (getListingsByCityId as jest.Mock).mockResolvedValue(mockListings);

    await renderCityContent('test-city');
    expect(screen.getByTestId('city-name')).toHaveTextContent('Test City');
    expect(screen.getByTestId('city-description')).toHaveTextContent('A city for testing.');
    expect(screen.getByTestId('listings')).toHaveTextContent('Test Listing 1');
    expect(screen.getByTestId('listings')).toHaveTextContent('Test Listing 2');
  });

  it('should render the city details with no listings when the city is found but has no listings', async () => {
    (getCityDetailBySlug as jest.Mock).mockResolvedValue(mockCity);
    (getListingsByCityId as jest.Mock).mockResolvedValue([]);

    await renderCityContent('test-city');
    expect(screen.getByTestId('city-name')).toHaveTextContent('Test City');
    expect(screen.getByTestId('city-description')).toHaveTextContent('A city for testing.');
    expect(screen.getByTestId('listings')).toBeEmptyDOMElement();
  });

  it('should render a fallback city when city data is not found', async () => {
    (getCityDetailBySlug as jest.Mock).mockResolvedValue(null);
    (getCityBySlug as jest.Mock).mockResolvedValue(null);
    (getListingsByCityId as jest.Mock).mockResolvedValue([]);

    await renderCityContent('test-city');
    expect(screen.getByTestId('city-name')).toHaveTextContent('Test City');
    expect(screen.getByTestId('city-description')).toHaveTextContent(
      'Preview data: city details unavailable.'
    );
  });

  it('should log an error and render a fallback city when city data fetching fails', async () => {
    (getCityDetailBySlug as jest.Mock).mockRejectedValue(new Error('Fetch error'));

    await renderCityContent('test-city');
    expect(structuredLogger.error).toHaveBeenCalledWith(
      'City fetch failed',
      {
        message: 'Fetch error',
        name: 'Error',
        stack: expect.any(String),
      },
      {
        component: 'city-page',
        operation: 'fetch_city_data',
        slug: 'test-city',
      }
    );
    expect(screen.getByTestId('city-name')).toHaveTextContent('Test City');
  });

  it('should log an error when listing data is invalid', async () => {
    (getCityDetailBySlug as jest.Mock).mockResolvedValue(mockCity);
    (getListingsByCityId as jest.Mock).mockResolvedValue([{ id: 1, name: 'Invalid Listing' }]);

    await renderCityContent('test-city');
    expect(structuredLogger.error).toHaveBeenCalledWith(
      'Invalid ListingSummaryDTO validation failed',
      null,
      {
        component: 'city-page',
        operation: 'validate_listings_dto',
        cityId: '1',
        slug: 'test-city',
        validationError: expect.any(String),
      }
    );
  });

  it('should log an error when listings fetch fails and continue with empty listings', async () => {
    (getCityDetailBySlug as jest.Mock).mockResolvedValue(mockCity);
    (getListingsByCityId as jest.Mock).mockRejectedValue(new Error('Listings fetch error'));

    await renderCityContent('test-city');
    expect(structuredLogger.error).toHaveBeenCalledWith(
      'Listings fetch failed',
      {
        message: 'Listings fetch error',
        name: 'Error',
        stack: expect.any(String),
      },
      {
        component: 'city-page',
        operation: 'fetch_city_listings',
        cityId: '1',
        slug: 'test-city',
      }
    );
    expect(screen.getByTestId('city-name')).toHaveTextContent('Test City');
    expect(screen.getByTestId('listings')).toBeEmptyDOMElement();
  });

  it('should sanitize non-Error objects for logging', async () => {
    (getCityDetailBySlug as jest.Mock).mockRejectedValue('string error');

    await renderCityContent('test-city');
    expect(structuredLogger.error).toHaveBeenCalledWith(
      'City fetch failed',
      {
        message: 'string error',
        type: 'string',
      },
      {
        component: 'city-page',
        operation: 'fetch_city_data',
        slug: 'test-city',
      }
    );
  });

  it('should render fallback city when both detail and basic city DTO validation fails', async () => {
    // Return an object that will fail both CityDetailDTO and CityDTO schema validation
    const invalidCity = {
      id: '1',
      name: 'Invalid City',
      // Missing required fields like slug
    };
    (getCityDetailBySlug as jest.Mock).mockResolvedValue(invalidCity);
    (getListingsByCityId as jest.Mock).mockResolvedValue([]);

    await renderCityContent('invalid-city');
    expect(structuredLogger.error).toHaveBeenCalledWith(
      'Invalid city DTO validation failed',
      null,
      {
        component: 'city-page',
        operation: 'validate_city_dto',
        slug: 'invalid-city',
        validationErrors: {
          detailError: expect.any(String),
          basicError: expect.any(String),
        },
      }
    );
    expect(screen.getByTestId('city-name')).toHaveTextContent('Invalid City');
    expect(screen.getByTestId('city-description')).toHaveTextContent(
      'Preview data: city details unavailable.'
    );
  });

  it('should render city with basic DTO when detail validation fails but basic succeeds', async () => {
    // Return a basic city that passes CityDTO but not CityDetailDTO
    const basicCity = {
      id: '1',
      name: 'Basic City',
      slug: 'basic-city',
      country: 'Test Country',
      highlights: [],
      imageUrl: null,
      imageDimensions: null,
      description: 'A basic city',
    };
    (getCityDetailBySlug as jest.Mock).mockResolvedValue(basicCity);
    (getListingsByCityId as jest.Mock).mockResolvedValue([]);

    await renderCityContent('basic-city');
    expect(screen.getByTestId('city-name')).toHaveTextContent('Basic City');
    expect(screen.getByTestId('city-description')).toHaveTextContent('A basic city');
  });

  it('should handle acronyms in slug-to-title conversion', async () => {
    (getCityDetailBySlug as jest.Mock).mockResolvedValue(null);
    (getCityBySlug as jest.Mock).mockResolvedValue(null);

    await renderCityContent('nyc-usa');
    // The toTitleCaseFromSlug function should convert acronyms to uppercase
    expect(screen.getByTestId('city-name')).toHaveTextContent('NYC USA');
  });
});

describe('generateStaticParams', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return an array of params with city slugs', async () => {
    const mockSlugs = ['tokyo', 'new-york', 'london'];
    (getAllCitySlugs as jest.Mock).mockResolvedValue(mockSlugs);

    const result = await generateStaticParams();

    expect(result).toEqual([{ slug: 'tokyo' }, { slug: 'new-york' }, { slug: 'london' }]);
    expect(getAllCitySlugs).toHaveBeenCalledTimes(1);
  });

  it('should return a fallback param if fetching slugs fails', async () => {
    (getAllCitySlugs as jest.Mock).mockRejectedValue(new Error('Fetch error'));

    const result = await generateStaticParams();

    // With Cache Components in Next.js 16, generateStaticParams must return at least one param
    expect(result).toEqual([{ slug: 'empty-city' }]);
    expect(structuredLogger.error).toHaveBeenCalledWith(
      'Failed to generate static params for city pages',
      expect.any(Error),
      {
        component: 'city-page',
        operation: 'generateStaticParams',
      }
    );
  });

  it('should return a fallback param if getAllCitySlugs returns empty array', async () => {
    (getAllCitySlugs as jest.Mock).mockResolvedValue([]);

    const result = await generateStaticParams();

    // With Cache Components in Next.js 16, generateStaticParams must return at least one param
    expect(result).toEqual([{ slug: 'empty-city' }]);
  });
});
