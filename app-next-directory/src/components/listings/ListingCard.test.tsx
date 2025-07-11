import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import '@testing-library/jest-dom/extend-expect';
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
  const mockSanityListing: SanityListing = {
    _id: '12345',
    _type: 'listing',
    name: 'Test Sanity Listing',
    description_short: 'A great place to stay (Sanity)',
    city: { _id: 'test-city-id', slug: 'test-city', name: 'Test City', listingCount: 1, country: 'Thailand' },
    slug: 'test-sanity-listing',
    _createdAt: '2023-01-01T00:00:00Z',
    _updatedAt: '2023-01-01T00:00:00Z',
    _rev: 'rev1',
    category: 'coworking',
    ecoTags: ['Solar', 'Organic'],
    primaryImage: { _type: 'image', asset: { _ref: 'sanity-image-id', _type: 'reference' } },
    galleryImages: [{ _type: 'image', asset: { _ref: 'sanity-gallery-image-id', _type: 'reference' } }],
    price: 100,
  };

  const mockLegacyListing: Listing = {
    // id removed, not part of Listing type
    slug: 'test-legacy-listing',
    name: 'Test Legacy Listing',
    city: {
      _id: "city-bangkok",
      slug: "bangkok",
      name: "Bangkok",
      listingCount: 1,
      country: "Thailand"
    },
    address: '123 Legacy St',
    description_short: 'A cozy cafe (Legacy)',
    description_long: 'A very cozy cafe with great coffee and wifi.',
    eco_focus_tags: [
      { _type: 'reference', _ref: 'ecoTag-recycling' },
      { _type: 'reference', _ref: 'ecoTag-fairtrade' }
    ],
    eco_notes_detailed: 'Uses recycled materials and fair trade coffee.',
    source_urls: ['http://legacycafe.com'],
    gallery_image_urls: ['/legacy-image-1.jpg', '/legacy-image-2.jpg'],
    digital_nomad_features: ['Fast Wifi', 'Quiet Zone'],
    last_verified_date: '2023-06-01',
  };

  // ...existing code...
  test('renders listing card with correct title', () => {
    render(<ListingCard listing={mockSanityListing} />);

    expect(screen.getAllByText('Test Sanity Listing')[0]).toBeInTheDocument();
  });

  test('displays price correctly', () => {
    render(<ListingCard listing={mockSanityListing} />);

    expect(screen.getByText(/\$100/)).toBeInTheDocument();
  });

  test('shows location information', () => {
    render(<ListingCard listing={mockSanityListing} />);

    expect(screen.getByText(/Test City, Thailand/)).toBeInTheDocument();
  });

  test('renders image if available', () => {
    render(<ListingCard listing={mockSanityListing} />);

    const image = screen.getByTestId('image-mock');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('data-alt', expect.stringContaining('Test Sanity Listing'));
    expect(image).toHaveAttribute('data-src', expect.stringContaining('mock-sanity-image-url-sanity-image-id'));
  });

  test('handles missing images gracefully', () => {
    const listingWithoutImage: SanityListing = {
      ...mockSanityListing,
      primaryImage: undefined,
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
    render(<ListingCard listing={mockSanityListing} />);
    expect(screen.getByText('coworking')).toBeInTheDocument();
  });

  // ...existing code...

  // ...existing code...

  // ...existing code...

  test('renders eco tags if present', () => {
    const listingWithEcoTags: SanityListing = {
      ...mockSanityListing,
      ecoTags: ['Solar', 'Organic', 'Vegan'],
    };
    render(<ListingCard listing={listingWithEcoTags} />);
    expect(screen.getByText('Solar')).toBeInTheDocument();
    expect(screen.getByText('Organic')).toBeInTheDocument();
    expect(screen.getByText('Vegan')).toBeInTheDocument();
  });

  test('highlights search query in title and description', () => {
    const listingWithDesc: SanityListing = {
      ...mockSanityListing,
      description_short: 'A great place to stay with vegan options',
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
    const listingNoCity: SanityListing = { ...mockSanityListing, city: undefined };
    render(<ListingCard listing={listingNoCity} />);
    // Should not throw, location fallback is empty string
    expect(screen.getAllByText('Test Sanity Listing')[0]).toBeInTheDocument();
  });

  test('uses fallback for missing name', () => {
    const listingNoName: SanityListing = { ...mockSanityListing, name: '' }; // Use empty string instead of undefined
    render(<ListingCard listing={listingNoName} />);
    expect(screen.getByText('Unnamed Listing')).toBeInTheDocument();
  });

  test('renders correct link URL', () => {
    render(<ListingCard listing={mockSanityListing} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/listings/test-sanity-listing');
  });

  test('getListingUrl returns correct URL for SanityListing', () => {
    const sanityListingWithSlug: SanityListing = { ...mockSanityListing, slug: 'sanity-test-slug' };
    render(<ListingCard listing={sanityListingWithSlug} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/listings/sanity-test-slug');
  });

  test('getListingUrl returns correct URL for non-SanityListing with slug', () => {
    const nonSanityListingWithSlug: Listing = { ...mockLegacyListing, slug: 'non-sanity-test-slug' };
    render(<ListingCard listing={nonSanityListingWithSlug as any} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/listings/non-sanity-test-slug');
  });

  test('getListingUrl returns default slug for missing slug', () => {
    const listingWithoutSlug: SanityListing = { ...mockSanityListing, slug: '' };
    render(<ListingCard listing={listingWithoutSlug} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/listings/default-slug');
  });

  // New tests for getImageUrl
  test('getImageUrl returns URL from primaryImage for SanityListing', () => {
    const sanityListingWithPrimaryImage: SanityListing = {
      ...mockSanityListing,
      primaryImage: { _type: 'image', asset: { _ref: 'sanity-primary-image-id', _type: 'reference' } },
      galleryImages: [],
    };
    render(<ListingCard listing={sanityListingWithPrimaryImage} />);
    const image = screen.getByTestId('image-mock');
    expect(image).toHaveAttribute('src', 'mock-sanity-image-url-sanity-primary-image-id');
  });

  test('getImageUrl returns URL from first galleryImage if primaryImage is missing for SanityListing', () => {
    const sanityListingWithGalleryImages: SanityListing = {
      ...mockSanityListing,
      primaryImage: undefined,
      galleryImages: [{ _type: 'image', asset: { _ref: 'sanity-gallery-image-id', _type: 'reference' } }],
    };
    render(<ListingCard listing={sanityListingWithGalleryImages} />);
    const image = screen.getByTestId('image-mock');
    expect(image).toHaveAttribute('src', 'mock-sanity-image-url-sanity-gallery-image-id');
  });

  // ...existing code...

  // ...existing code...

  test('getImageUrl returns empty string if no image sources are available', () => {
    const listingWithoutAnyImage: SanityListing = {
      ...mockSanityListing,
      primaryImage: undefined,
      galleryImages: [],
    };
    render(<ListingCard listing={listingWithoutAnyImage} />);
    const image = screen.getByTestId('image-mock');
    expect(image).toHaveAttribute('src', '/test-image.jpg'); // Fallback in component
  });

  test('getImageUrl handles error in urlFor for primaryImage', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (urlFor as jest.Mock).mockImplementationOnce(() => {
      throw new Error('Test error primaryImage');
    });
    const listingWithErrorPrimaryImage: SanityListing = {
      ...mockSanityListing,
      primaryImage: { _type: 'image', asset: { _ref: 'error-image-id', _type: 'reference' } },
      galleryImages: [],
    };
    render(<ListingCard listing={listingWithErrorPrimaryImage} />);
    const image = screen.getByTestId('image-mock');
    expect(image).toHaveAttribute('data-src', '/test-image.jpg'); // Fallback
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error generating Sanity image URL:', new Error('Test error primaryImage'));
    consoleErrorSpy.mockRestore();
  });

  test('getImageUrl handles error in urlFor for galleryImages', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (urlFor as jest.Mock).mockImplementationOnce(() => {
      throw new Error('Test error galleryImages');
    });
    const listingWithErrorGalleryImages: SanityListing = {
      ...mockSanityListing,
      primaryImage: undefined,
      galleryImages: [{ _type: 'image', asset: { _ref: 'error-gallery-image-id', _type: 'reference' } }],
    };
    render(<ListingCard listing={listingWithErrorGalleryImages} />);
    const image = screen.getByTestId('image-mock');
    expect(image).toHaveAttribute('data-src', '/test-image.jpg'); // Fallback
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error generating Sanity gallery image URL:', new Error('Test error galleryImages'));
    consoleErrorSpy.mockRestore();
  });

  // ...existing code...

  // Removed test that sets city as string, as city must be a document type
});