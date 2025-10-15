import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';

const notFoundMock = jest.fn(() => {
  const error = new Error('NEXT_NOT_FOUND') as Error & { digest?: string };
  error.digest = 'NEXT_NOT_FOUND';
  throw error;
});

jest.mock('next/navigation', () => ({
  notFound: notFoundMock,
}));

const mockGetCityDetailBySlug = jest.fn();
const mockGetCityBySlug = jest.fn();
const mockGetListingsByCityId = jest.fn();

jest.mock('@/lib/data/city', () => ({
  __esModule: true,
  getCityDetailBySlug: mockGetCityDetailBySlug,
  getCityBySlug: mockGetCityBySlug,
  getListingsByCityId: mockGetListingsByCityId,
}));

const loggerErrorMock = jest.fn();

jest.mock('@/lib/logger', () => ({
  structuredLogger: { error: loggerErrorMock },
}));

const cityDetailViewSpy = jest.fn((props: any) => (
  <div data-testid="city-detail-view">
    <span data-testid="city-name">{props.city?.name}</span>
    <span data-testid="listings-count">{props.listings?.length ?? 0}</span>
  </div>
));

jest.mock('@/components/city/CityDetailView', () => ({
  CityDetailView: (props: unknown) => cityDetailViewSpy(props),
}));

let CityPage: typeof import('../page').default;
let generateMetadata: typeof import('../page').generateMetadata;

beforeAll(async () => {
  const mod = await import('../page');
  CityPage = mod.default;
  generateMetadata = mod.generateMetadata;
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('CityPage', () => {
  it('renders city detail view with detailed city data and listings', async () => {
    const cityDetail = {
      id: 'city-1',
      name: 'Lisbon',
      slug: 'lisbon',
      description: 'A vibrant coastal city',
      shortDescription: 'Sunshine and coworking',
      highlights: ['Waterfront'],
      imageUrl: 'https://example.com/lisbon.jpg',
    };
    const listings = [
      { id: 'listing-1', name: 'Eco Hub', slug: 'eco-hub', imageUrl: 'https://example.com/eco.jpg' },
      { id: 'listing-2', name: 'Green Cafe', slug: 'green-cafe', imageUrl: 'https://example.com/cafe.jpg' },
    ];

    mockGetCityDetailBySlug.mockResolvedValueOnce(cityDetail);
    mockGetListingsByCityId.mockResolvedValueOnce(listings);

    const element = await CityPage({ params: Promise.resolve({ slug: 'lisbon' }) });
    render(element);

    const viewProps = cityDetailViewSpy.mock.calls.at(-1)?.[0] ?? {};
    expect(viewProps).toEqual({ city: cityDetail, listings });
    expect(screen.getByTestId('city-name')).toHaveTextContent('Lisbon');
    expect(screen.getByTestId('listings-count')).toHaveTextContent('2');
    expect(mockGetCityDetailBySlug).toHaveBeenCalledWith('lisbon');
    expect(mockGetListingsByCityId).toHaveBeenCalledWith('city-1');
  });

  it('falls back to base city data when no detailed record exists', async () => {
    const baseCity = {
      id: 'city-2',
      name: 'Porto',
      slug: 'porto',
      description: 'Historic port city',
      highlights: ['Wine tours'],
      imageUrl: 'https://example.com/porto.jpg',
    };

    mockGetCityDetailBySlug.mockResolvedValueOnce(null);
    mockGetCityBySlug.mockResolvedValueOnce(baseCity);
    mockGetListingsByCityId.mockResolvedValueOnce([]);

    const element = await CityPage({ params: Promise.resolve({ slug: 'porto' }) });
    render(element);

    const viewProps = cityDetailViewSpy.mock.calls.at(-1)?.[0] ?? {};
    expect(viewProps).toEqual({ city: baseCity, listings: [] });
    expect(mockGetCityBySlug).toHaveBeenCalledWith('porto');
  });

  it('invokes notFound when the city cannot be resolved', async () => {
    mockGetCityDetailBySlug.mockResolvedValueOnce(null);
    mockGetCityBySlug.mockResolvedValueOnce(null);

    await expect(
      CityPage({ params: Promise.resolve({ slug: 'missing-city' }) })
    ).rejects.toThrow('NEXT_NOT_FOUND');
    expect(notFoundMock).toHaveBeenCalledTimes(1);
  });

  it('logs an error when resolving the city throws and surfaces notFound', async () => {
    const failure = new Error('sanity offline');
    mockGetCityDetailBySlug.mockRejectedValueOnce(failure);

    await expect(
      CityPage({ params: Promise.resolve({ slug: 'broken-city' }) })
    ).rejects.toThrow('NEXT_NOT_FOUND');

    expect(loggerErrorMock).toHaveBeenCalledWith(
      'city-page:resolveCity_failed',
      failure,
      expect.objectContaining({ slug: 'broken-city' })
    );
    expect(mockGetCityBySlug).not.toHaveBeenCalled();
  });

  it('logs errors when fetching listings fails but still renders the city', async () => {
    const cityDetail = {
      id: 'city-9',
      name: 'Barcelona',
      slug: 'barcelona',
      description: 'City by the sea',
      shortDescription: 'Mediterranean hub',
      highlights: [],
      imageUrl: null,
    };

    mockGetCityDetailBySlug.mockResolvedValueOnce(cityDetail);
    mockGetListingsByCityId.mockRejectedValueOnce(new Error('database failure'));

    const element = await CityPage({ params: Promise.resolve({ slug: 'barcelona' }) });
    render(element);

    const viewProps = cityDetailViewSpy.mock.calls.at(-1)?.[0] ?? {};
    expect(viewProps).toEqual({ city: cityDetail, listings: [] });
    expect(loggerErrorMock).toHaveBeenCalledWith(
      'city-page:listings_fetch_failed',
      expect.any(Error),
      expect.objectContaining({ cityId: 'city-9', slug: 'barcelona' })
    );
  });
});

describe('CityPage.generateMetadata', () => {
  it('returns metadata derived from city details', async () => {
    const cityDetail = {
      id: 'city-5',
      name: 'Berlin',
      slug: 'berlin',
      description: 'Culture, history, and tech',
      highlights: ['Museums', 'Nightlife'],
      country: 'Germany',
      imageUrl: 'https://example.com/berlin.jpg',
    };

    mockGetCityDetailBySlug.mockResolvedValueOnce(cityDetail);

    const metadata = await generateMetadata({ params: Promise.resolve({ slug: 'berlin' }) });

    expect(metadata.title).toBe('Berlin - Sustainable Digital Nomads Directory');
    expect(metadata.description).toBe('Culture, history, and tech');
    expect(metadata.keywords).toEqual(
      expect.arrayContaining(['Berlin', 'Germany', 'Museums', 'Nightlife', 'sustainable travel', 'digital nomad'])
    );
    expect(metadata.openGraph?.images).toEqual([{ url: 'https://example.com/berlin.jpg' }]);
    expect(metadata.twitter?.images).toEqual(['https://example.com/berlin.jpg']);
  });

  it('returns not-found metadata when the city is missing', async () => {
    mockGetCityDetailBySlug.mockResolvedValueOnce(null);
    mockGetCityBySlug.mockResolvedValueOnce(null);

    const metadata = await generateMetadata({ params: Promise.resolve({ slug: 'unknown-city' }) });

    expect(metadata).toEqual({
      title: 'City Not Found - Sustainable Digital Nomads Directory',
      description: 'The requested city could not be found.',
    });
  });

  it('deduplicates keyword metadata when using fallback city data', async () => {
    mockGetCityDetailBySlug.mockResolvedValueOnce(null);
    mockGetCityBySlug.mockResolvedValueOnce({
      id: 'city-11',
      name: 'Vienna',
      slug: 'vienna',
      description: null,
      highlights: ['Coffeehouses', 'Museums', 'Coffeehouses', ''],
      country: 'Austria',
      imageUrl: null,
    });

    const metadata = await generateMetadata({ params: Promise.resolve({ slug: 'vienna' }) });

    expect(metadata.title).toBe('Vienna - Sustainable Digital Nomads Directory');
    expect(metadata.description).toBe(
      'Discover sustainable co-working spaces, accommodations, and eco-friendly venues in Vienna.'
    );
    const keywords = metadata.keywords ?? [];
    expect(keywords).toEqual(
      expect.arrayContaining(['Vienna', 'Austria', 'Museums', 'Coffeehouses', 'sustainable travel', 'digital nomad'])
    );
    expect(new Set(keywords).size).toBe(keywords.length);
    expect(metadata.openGraph?.images).toBeUndefined();
    expect(metadata.twitter?.images).toBeUndefined();
  });
});
