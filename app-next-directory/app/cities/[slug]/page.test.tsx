/** @jest-environment jsdom */

import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import CityPage, { generateStaticParams } from './page'
import { getCityBySlug, getCityDetailBySlug, getListingsByCityId, getCitiesList } from '@/lib/data/city'
import { structuredLogger } from '@/lib/logger'

jest.mock('@/lib/data/city', () => ({
  getCityBySlug: jest.fn(),
  getCityDetailBySlug: jest.fn(),
  getListingsByCityId: jest.fn(),
  getCitiesList: jest.fn(),
}))

jest.mock('@/lib/logger', () => ({
  structuredLogger: {
    error: jest.fn(),
  },
}))

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
}))

jest.mock('@/components/layout/Header', () => ({
  Header: () => <header>Header</header>,
}))

jest.mock('@/components/layout/Footer', () => ({
  Footer: () => <footer>Footer</footer>,
}))

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
  }

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
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render the city details and listings when data is fetched successfully', async () => {
    ;(getCityDetailBySlug as jest.Mock).mockResolvedValue(mockCity)
    ;(getListingsByCityId as jest.Mock).mockResolvedValue(mockListings)

    const Page = await CityPage({ params: { slug: 'test-city' } })
    render(Page)

    expect(screen.getByTestId('city-name')).toHaveTextContent('Test City')
    expect(screen.getByTestId('city-description')).toHaveTextContent('A city for testing.')
    expect(screen.getByTestId('listings')).toHaveTextContent('Test Listing 1')
    expect(screen.getByTestId('listings')).toHaveTextContent('Test Listing 2')
  })

  it('should render the city details with no listings when the city is found but has no listings', async () => {
    ;(getCityDetailBySlug as jest.Mock).mockResolvedValue(mockCity)
    ;(getListingsByCityId as jest.Mock).mockResolvedValue([])

    const Page = await CityPage({ params: { slug: 'test-city' } })
    render(Page)

    expect(screen.getByTestId('city-name')).toHaveTextContent('Test City')
    expect(screen.getByTestId('city-description')).toHaveTextContent('A city for testing.')
    expect(screen.getByTestId('listings')).toBeEmptyDOMElement()
  })

  it('should render a fallback city when city data is not found', async () => {
    ;(getCityDetailBySlug as jest.Mock).mockResolvedValue(null)
    ;(getCityBySlug as jest.Mock).mockResolvedValue(null)
    ;(getListingsByCityId as jest.Mock).mockResolvedValue([])

    const Page = await CityPage({ params: { slug: 'test-city' } })
    render(Page)

    expect(screen.getByTestId('city-name')).toHaveTextContent('Test City')
    expect(screen.getByTestId('city-description')).toHaveTextContent(
      'Preview data: city details unavailable.',
    )
  })

  it('should log an error and render a fallback city when city data fetching fails', async () => {
    ;(getCityDetailBySlug as jest.Mock).mockRejectedValue(new Error('Fetch error'))

    const Page = await CityPage({ params: { slug: 'test-city' } })
    render(Page)

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
      },
    )
    expect(screen.getByTestId('city-name')).toHaveTextContent('Test City')
  })

  it('should log an error when listing data is invalid', async () => {
    ;(getCityDetailBySlug as jest.Mock).mockResolvedValue(mockCity)
    ;(getListingsByCityId as jest.Mock).mockResolvedValue([{ id: 1, name: 'Invalid Listing' }])

    const Page = await CityPage({ params: { slug: 'test-city' } })
    render(Page)

    expect(structuredLogger.error).toHaveBeenCalledWith(
      'Invalid ListingSummaryDTO validation failed',
      null,
      {
        component: 'city-page',
        operation: 'validate_listings_dto',
        cityId: '1',
        slug: 'test-city',
        validationError: expect.any(String),
      },
    )
  })
})

describe('generateStaticParams', () => {
  it('should return an array of city slugs', async () => {
    const mockCities = [
      { id: '1', name: 'City 1', slug: 'city-1', country: 'Country 1', highlights: [], imageUrl: null, imageDimensions: null },
      { id: '2', name: 'City 2', slug: 'city-2', country: 'Country 2', highlights: [], imageUrl: null, imageDimensions: null },
      { id: '3', name: 'City 3', slug: 'city-3', country: 'Country 3', highlights: [], imageUrl: null, imageDimensions: null },
    ];
    
    (getCitiesList as jest.Mock).mockResolvedValue(mockCities);
    
    const result = await generateStaticParams();
    
    expect(getCitiesList).toHaveBeenCalledWith(1000);
    expect(result).toEqual([
      { slug: 'city-1' },
      { slug: 'city-2' },
      { slug: 'city-3' },
    ]);
  });

  it('should return an empty array when no cities are found', async () => {
    (getCitiesList as jest.Mock).mockResolvedValue([]);
    
    const result = await generateStaticParams();
    
    expect(result).toEqual([]);
  });

  it('should return an empty array and log error when fetch fails', async () => {
    (getCitiesList as jest.Mock).mockRejectedValue(new Error('Fetch failed'));
    
    const result = await generateStaticParams();
    
    expect(structuredLogger.error).toHaveBeenCalledWith(
      'Failed to fetch city slugs for static generation',
      'Fetch failed',
      {
        component: 'cities/[slug]',
        operation: 'generateStaticParams',
      }
    );
    expect(result).toEqual([]);
  });
})
