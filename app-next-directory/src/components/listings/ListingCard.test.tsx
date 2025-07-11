import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import type { Listing } from '../../types/listing';
import { ListingCard } from './ListingCard';
import { urlFor } from '../../lib/sanity/image';

jest.mock('next/image', () => ({ src, alt, ...props }: { src: string; alt: string }) => {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} data-testid="image-mock" data-src={src} data-alt={alt} />;
});

jest.mock('../../lib/sanity/client', () => ({
  __esModule: true,
  default: {
    fetch: jest.fn(() => Promise.resolve([])),
  },
  client: {
    fetch: jest.fn(() => Promise.resolve([])),
  },
}));

jest.mock('@/lib/sanity/image', () => ({
  urlFor: jest.fn((source) => ({
    width: jest.fn().mockReturnThis(),
    height: jest.fn().mockReturnThis(),
    fit: jest.fn().mockReturnThis(),
    auto: jest.fn().mockReturnThis(),
    url: jest.fn(() => `mock-sanity-image-url-${source?.asset?._ref}`),
  })),
}));

describe('ListingCard', () => {
  const mockListing: Listing = {
    _id: '12345',
    name: 'Test Listing',
    slug: 'test-listing',
    description: 'A great place to stay',
    city: { _id: 'test-city-id', slug: 'test-city', name: 'Test City', listingCount: 1, country: 'Thailand' },
    type: 'coworking',
    priceRange: 'moderate',
    mainImage: { asset: { _ref: 'sanity-image-id', url: 'mock-sanity-image-url-sanity-image-id' } },
    galleryImages: [{ asset: { _ref: 'sanity-gallery-image-id', url: 'mock-sanity-image-url-sanity-gallery-image-id' } }],
    ecoTags: [],
    rating: 4.5,
    address: '123 Listing St',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  };

  // ...existing code...

  // ...existing code...
  test('renders listing card with correct title', () => {
    render(<ListingCard listing={mockListing} />);

    expect(screen.getAllByText('Test Sanity Listing')[0]).toBeInTheDocument();
  });

  test('displays price correctly', () => {
    

    expect(screen.getByText(/\$100/)).toBeInTheDocument();
  });

  test('shows location information', () => {
    

    expect(screen.getByText(/Test City, Thailand/)).toBeInTheDocument();
  });

  test('renders image if available', () => {
    

    const image = screen.getByTestId('image-mock');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('data-alt', expect.stringContaining('Test Sanity Listing'));
    expect(image).toHaveAttribute('data-src', expect.stringContaining('mock-sanity-image-url-sanity-image-id'));
  });

  test('handles missing images gracefully', () => {
    const listingWithoutImage: Listing = {
      ...mockListing,
      mainImage: { asset: { _ref: '', url: '/test-image.jpg' } },
      galleryImages: [],
      name: 'Unnamed Listing',
      slug: 'unnamed-listing',
    };
    render(<ListingCard listing={listingWithoutImage} />);

    // Check for placeholder or fallback image if implemented
    // Adjust based on actual component behavior
    expect(screen.getByText('Unnamed Listing')).toBeInTheDocument();
    const image = screen.getByTestId('image-mock');
    expect(image).toHaveAttribute('data-src', '/test-image.jpg');
    expect(image).toHaveAttribute('data-alt', 'Unnamed Listing');
  });

  test('renders category badge', () => {
    
    expect(screen.getByText('coworking')).toBeInTheDocument();
  });

  // ...existing code...

  // ...existing code...

  // ...existing code...

  test('renders eco tags if present', () => {
    const listingWithEcoTags: Listing = {
      ...mockListing,
      ecoTags: [], // Listing type expects EcoTag[]
    };
    render(<ListingCard listing={listingWithEcoTags} />);
    expect(screen.getByText('Solar')).toBeInTheDocument();
    expect(screen.getByText('Organic')).toBeInTheDocument();
    expect(screen.getByText('Vegan')).toBeInTheDocument();
  });

  test('highlights search query in title and description', () => {
    const listingWithDesc: Listing = {
      ...mockListing,
      description: 'A great place to stay with vegan options',
    };
    render(<ListingCard listing={listingWithDesc} searchQuery="vegan" />);
    // Should highlight "vegan" in description
    const highlighted = screen.getByText('vegan', { selector: 'mark' });
    expect(highlighted).toBeInTheDocument();
  });

  // ...existing code...

  // ...existing code...

  // ...existing code...

  test('uses fallback for missing city', () => {
    
    
    // Should not throw, location fallback is empty string
    expect(screen.getAllByText('Test Sanity Listing')[0]).toBeInTheDocument();
  });

  test('uses fallback for missing name', () => {
    const listingNoName: Listing = { ...mockListing, name: '' };
    render(<ListingCard listing={listingNoName} />);
    expect(screen.getByText('Unnamed Listing')).toBeInTheDocument();
  });

  test('renders correct link URL', () => {
    
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/listings/test-sanity-listing');
  });

  test('getListingUrl returns correct URL for SanityListing', () => {
    const listingWithSlug: Listing = { ...mockListing, slug: 'listing-test-slug' };
    render(<ListingCard listing={listingWithSlug} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/listings/sanity-test-slug');
  });

  test('getListingUrl returns correct URL for non-SanityListing with slug', () => {
    
    
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/listings/non-sanity-test-slug');
  });

  test('getListingUrl returns default slug for missing slug', () => {
    const listingWithoutSlug: Listing = { ...mockListing, slug: '' };
    render(<ListingCard listing={listingWithoutSlug} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/listings/default-slug');
  });

  // New tests for getImageUrl
  test('getImageUrl returns URL from primaryImage for SanityListing', () => {
    const listingWithPrimaryImage: Listing = {
      ...mockListing,
      mainImage: { asset: { _ref: 'sanity-primary-image-id', url: 'mock-sanity-image-url-sanity-primary-image-id' } },
      galleryImages: [],
    };
    render(<ListingCard listing={listingWithPrimaryImage} />);
    const image = screen.getByTestId('image-mock');
    expect(image).toHaveAttribute('src', 'mock-sanity-image-url-sanity-primary-image-id');
  });

  test('getImageUrl returns URL from first galleryImage if primaryImage is missing for SanityListing', () => {
    const listingWithGalleryImages: Listing = {
      ...mockListing,
      mainImage: { asset: { _ref: '', url: '/test-image.jpg' } },
      galleryImages: [{ asset: { _ref: 'sanity-gallery-image-id', url: 'mock-sanity-image-url-sanity-gallery-image-id' } }],
    };
    render(<ListingCard listing={listingWithGalleryImages} />);
    const image = screen.getByTestId('image-mock');
    expect(image).toHaveAttribute('src', 'mock-sanity-image-url-sanity-gallery-image-id');
  });

  test('getImageUrl returns empty string if no image sources are available', () => {
    const listingWithoutAnyImage: Listing = {
      ...mockListing,
      mainImage: { asset: { _ref: '', url: '/test-image.jpg' } },
      galleryImages: [],
    };
    render(<ListingCard listing={listingWithoutAnyImage} />);
    const image = screen.getByTestId('image-mock');
    expect(image).toHaveAttribute('src', '/test-image.jpg'); // Fallback in component
  });

  test('getImageUrl handles error in urlFor for primaryImage', () => {
    
    (urlFor as jest.Mock).mockImplementationOnce(() => {
      throw new Error('Test error primaryImage');
    });
    const listingWithErrorPrimaryImage: Listing = {
      ...mockListing,
      mainImage: { asset: { _ref: 'error-image-id', url: '' } },
      galleryImages: [],
    };
    render(<ListingCard listing={listingWithErrorPrimaryImage} />);
    const image = screen.getByTestId('image-mock');
    expect(image).toHaveAttribute('data-src', '/test-image.jpg'); // Fallback
    
  });
});
    expect(Image).toHaveAttribute('data-src', '/test-image.jpg'); // Fallback
    
    
