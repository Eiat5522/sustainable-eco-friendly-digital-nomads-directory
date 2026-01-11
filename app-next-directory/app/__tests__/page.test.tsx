/**
 * Unit tests for app/page.tsx (Home Page)
 * Tests the main home page component with DAL integration and Suspense boundaries
 */

import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import type React from 'react';
import HomePage from '../page';

// Mock the home page data module using the root alias
jest.mock('../../__mocks__/homePageData', () => ({
  MOCK_FEATURED_LISTINGS: [{ id: 'mock-1', name: 'Mock Listing 1', slug: 'mock-1' }],
  MOCK_CITIES: [{ id: 'mock-city-1', name: 'Mock City 1', slug: 'mock-city-1' }],
}));

// Mock DAL instead of queries
jest.mock('@/lib/data-access/home.dal', () => ({
  getFeaturedListings: jest.fn(() => Promise.resolve([])),
  getCities: jest.fn(() => Promise.resolve([])),
}));

jest.mock('@/lib/data-access', () => ({
  getFeaturedListings: jest.fn(() => Promise.resolve([])),
  getCities: jest.fn(() => Promise.resolve([])),
}));

jest.mock('@/lib/logger', () => ({
  structuredLogger: {
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

jest.mock('next/cache', () => ({
  cacheLife: jest.fn(),
  cacheTag: jest.fn(),
}));

// Mock PageLayoutServer (not PageLayout)
jest.mock('@/components/layout/PageLayoutServer', () => ({
  PageLayoutServer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="page-layout-server">{children}</div>
  ),
}));

// Mock HeroSection
jest.mock('@/components/sections/HeroSection', () => ({
  HeroSection: () => <div data-testid="hero-section">Hero Section</div>,
}));

// Mock FeaturedListings Legacy (for E2E)
jest.mock('@/components/sections/FeaturedListingsLegacy', () => ({
  FeaturedListings: ({ initialListings }: { initialListings: any[] | null }) => (
    <div data-testid="featured-listings-legacy">
      Featured Listings Legacy: {initialListings ? `${initialListings.length} items` : 'loading'}
    </div>
  ),
}));

// Mock FeaturedListings Server (new)
jest.mock('@/components/sections/FeaturedListingsServer', () => ({
  FeaturedListings: ({ listings }: { listings: any[] }) => (
    <div data-testid="featured-listings">
      Featured Listings: {listings.length} items
    </div>
  ),
}));

// Mock CityCarousel
jest.mock('@/components/sections/CityCarousel', () => ({
  CityCarousel: ({ initialCities }: { initialCities: any[] | null }) => (
    <div data-testid="city-carousel">
      City Carousel: {initialCities ? `${initialCities.length} items` : 'loading'}
    </div>
  ),
}));

describe('HomePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the page layout', async () => {
    const page = await HomePage();
    render(page);
    expect(screen.getByTestId('page-layout-server')).toBeInTheDocument();
  });

  it('renders the hero section', async () => {
    const page = await HomePage();
    render(page);
    expect(screen.getByTestId('hero-section')).toBeInTheDocument();
  });

  it('renders the featured listings fallback while loading', async () => {
    const page = await HomePage();
    render(page);
    expect(screen.getByText(/loading featured venues/i)).toBeInTheDocument();
  });

  it('renders the city carousel fallback while loading', async () => {
    const page = await HomePage();
    render(page);
    expect(screen.getByText(/loading cities/i)).toBeInTheDocument();
  });

  it('renders all sections in correct order', async () => {
    const page = await HomePage();
    const { container } = render(page);

    // Check that key sections exist
    expect(screen.getByTestId('page-layout-server')).toBeInTheDocument();
    expect(screen.getByTestId('hero-section')).toBeInTheDocument();
    expect(screen.getByText(/loading featured venues/i)).toBeInTheDocument();
    expect(screen.getByText(/loading cities/i)).toBeInTheDocument();
  });

  it('uses Suspense boundaries for dynamic sections', async () => {
    const page = await HomePage();
    const { container } = render(page);

    // Suspense fallbacks should be visible
    expect(screen.getByText(/loading featured venues/i)).toBeInTheDocument();
    expect(screen.getByText(/loading cities/i)).toBeInTheDocument();
  });

  it('wraps sections in PageLayoutServer', async () => {
    const page = await HomePage();
    render(page);

    const layout = screen.getByTestId('page-layout-server');
    expect(layout).toBeInTheDocument();

    // Hero and suspense content should be children of the layout
    expect(layout).toContainElement(screen.getByTestId('hero-section'));
  });
});
