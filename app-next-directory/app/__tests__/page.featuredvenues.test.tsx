import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import FeaturedVenuesPreview from '../page.featuredvenues';

// Mock Header
jest.mock('@/components/layout/Header', () => ({
  Header: () => <div data-testid="header">Header</div>,
}));

// Mock Footer
jest.mock('@/components/layout/Footer', () => ({
  Footer: () => <div data-testid="footer">Footer</div>,
}));

// Mock FeaturedListings
jest.mock('@/components/sections/FeaturedListings', () => ({
  FeaturedListings: () => <div data-testid="featured-listings">Featured Listings</div>,
}));

describe('FeaturedVenuesPreview', () => {
  it('renders the header', () => {
    render(<FeaturedVenuesPreview />);
    expect(screen.getByTestId('header')).toBeInTheDocument();
  });

  it('renders the footer', () => {
    render(<FeaturedVenuesPreview />);
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });

  it('renders the page title', () => {
    render(<FeaturedVenuesPreview />);
    expect(screen.getByRole('heading', { name: /featured venues preview/i, level: 1 })).toBeInTheDocument();
  });

  it('renders the page description', () => {
    render(<FeaturedVenuesPreview />);
    expect(screen.getByText(/preview of the featured sustainable venues section/i)).toBeInTheDocument();
  });

  it('renders the featured listings section', () => {
    render(<FeaturedVenuesPreview />);
    expect(screen.getByTestId('featured-listings')).toBeInTheDocument();
  });

  it('has correct layout structure', () => {
    const { container } = render(<FeaturedVenuesPreview />);
    
    const rootDiv = container.querySelector('.min-h-screen.bg-background');
    expect(rootDiv).toBeInTheDocument();
    
    const main = container.querySelector('main');
    expect(main).toBeInTheDocument();
  });

  it('renders all components in correct order', () => {
    const { container } = render(<FeaturedVenuesPreview />);
    const testIds = Array.from(container.querySelectorAll('[data-testid]')).map(
      el => el.getAttribute('data-testid')
    );

    expect(testIds).toEqual(['header', 'featured-listings', 'footer']);
  });
});
