import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import type React from 'react';
import HomePage from '../page';

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
  it('renders the page layout', () => {
    render(<HomePage />);
    expect(screen.getByTestId('page-layout')).toBeInTheDocument();
  });

  it('renders the hero section', () => {
    render(<HomePage />);
    expect(screen.getByTestId('hero-section')).toBeInTheDocument();
  });

  it('renders the featured listings section', () => {
    render(<HomePage />);
    expect(screen.getByTestId('featured-listings')).toBeInTheDocument();
  });

  it('renders the city carousel within suspense boundary', () => {
    render(<HomePage />);
    expect(screen.getByTestId('city-carousel')).toBeInTheDocument();
  });

  it('renders all sections in correct order', () => {
    const { container } = render(<HomePage />);
    const sections = container.querySelectorAll('[data-testid]');
    const testIds = Array.from(sections).map(el => el.getAttribute('data-testid'));

    expect(testIds).toEqual(['page-layout', 'hero-section', 'featured-listings', 'city-carousel']);
  });
});
