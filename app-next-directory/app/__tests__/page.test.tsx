import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import type React from 'react';
import HomePage from '../page';

jest.mock('@/lib/sanity/queries', () => ({
  getFeaturedListings: jest.fn(() => Promise.resolve([])),
  getAllCities: jest.fn(() => Promise.resolve([])),
}));

// Mock PageLayout
jest.mock('@/components/layout/PageLayout', () => ({
  PageLayout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="page-layout">{children}</div>
  ),
}));

// Mock HeroSection
jest.mock('@/components/sections/HeroSection', () => ({
  HeroSection: () => <div data-testid="hero-section">Hero Section</div>,
}));

// Mock FeaturedListings
jest.mock('@/components/sections/FeaturedListings', () => ({
  FeaturedListings: () => <div data-testid="featured-listings">Featured Listings</div>,
}));

// Mock CityCarousel
jest.mock('@/components/sections/CityCarousel', () => ({
  CityCarousel: () => <div data-testid="city-carousel">City Carousel</div>,
}));

describe('HomePage', () => {
  it('renders the page layout', async () => {
    const page = await HomePage();
    render(page);
    expect(screen.getByTestId('page-layout')).toBeInTheDocument();
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
    const sections = container.querySelectorAll('[data-testid]');
    const testIds = Array.from(sections).map(el => el.getAttribute('data-testid'));

    expect(testIds).toEqual(['page-layout', 'hero-section']);
    expect(screen.getByText(/loading featured venues/i)).toBeInTheDocument();
    expect(screen.getByText(/loading cities/i)).toBeInTheDocument();
  });
});
