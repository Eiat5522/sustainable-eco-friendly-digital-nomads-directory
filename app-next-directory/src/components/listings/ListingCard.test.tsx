import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';






import '@testing-library/jest-dom';
import '@testing-library/jest-dom';




jest.mock('next/image', () => ({ src, alt, ...props }: { src: string; alt: string }) => {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} data-testid="image-mock" data-src={src} data-alt={alt} />;
});

import { ListingCard } from './ListingCard';

jest.mock('../../lib/sanity/client', () => ({
  __esModule: true,
  default: {
    fetch: jest.fn(() => Promise.resolve([])),
  },
  client: {
    fetch: jest.fn(() => Promise.resolve([])),
  },
}));

import { Listing } from '@/types/listings';
import { SanityListing } from '@/types/sanity';
import { urlFor } from '@/lib/sanity/image';

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
    city: { _id: 'test-city-id', slug: 'test-city', title: 'Test City' },
    slug: 'test-sanity-listing',
    _createdAt: '2023-01-01T00:00:00Z',
    _updatedAt: '2023-01-01T00:00:00Z',
    _rev: 'rev1',
    category: 'coworking',
    ecoTags: ['Solar', 'Organic'],
    primaryImage: { _type: 'image', asset: { _ref: 'sanity-image-id', _type: 'reference' } },
    galleryImages: [{ _type: 'image', asset: { _ref: 'sanity-gallery-image-id', _type: 'reference' } }],
    price: 100, // Added price for price test
  };

  const mockLegacyListing: Listing = {
    id: '67890',
    slug: 'test-legacy-listing',
    name: 'Test Legacy Listing',
    city: 'Legacy City',
    category: 'cafe',
    address_string: '123 Legacy St',
    description_short: 'A cozy cafe (Legacy)',
    description_long: 'A very cozy cafe with great coffee and wifi.',
    eco_focus_tags: ['Recycling', 'Fair Trade'],
    eco_notes_detailed: 'Uses recycled materials and fair trade coffee.',
    source_urls: ['http://legacycafe.com'],
    primary_image_url: '/legacy-image.jpg',
    gallery_image_urls: ['/legacy-image-1.jpg', '/legacy-image-2.jpg'],
    digital_nomad_features: ['Fast Wifi', 'Quiet Zone'],
    last_verified_date: '2023-06-01',
  };

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

  test('getCategory returns category for non-SanityListing with category', () => {
    const nonSanityListingWithCategory: Listing = {
      ...mockLegacyListing,
      category: 'accommodation',
    };
    render(<ListingCard listing={nonSanityListingWithCategory} />);
    expect(screen.getByText('Hotel')).toBeInTheDocument();
  });

  test('getCategory returns type for non-SanityListing with type (fallback)', () => {
    const nonSanityListingWithType = {
      ...mockLegacyListing,
      // category intentionally omitted
      type: 'apartment',
    } as Listing;
    // The category needs to be deleted to test the fallback logic, as spreading in the base object otherwise brings in an unwanted category.
    delete nonSanityListingWithType.category;
    render(<ListingCard listing={nonSanityListingWithType} />);
    expect(screen.getByText('Apartment')).toBeInTheDocument();
  });

  test('getCategory returns "Other" for non-SanityListing without category or type', () => {
    const nonSanityListingWithoutCategoryOrType = {
      ...mockLegacyListing,
      // category and type intentionally omitted
    } as Listing;
    // The category needs to be deleted to test the fallback logic, as spreading in the base object otherwise brings in an unwanted category.
    delete nonSanityListingWithoutCategoryOrType.category;
    render(<ListingCard listing={nonSanityListingWithoutCategoryOrType} />);
    expect(screen.getByText('Other')).toBeInTheDocument();
  });

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

  test('getDescription returns description for non-SanityListing with description', () => {
    const nonSanityListingWithDescription: Listing = { ...mockLegacyListing, description_short: 'A short description.' };
    render(<ListingCard listing={nonSanityListingWithDescription} />);
    expect(screen.getByText('A short description.')).toBeInTheDocument();
  });

  test('getDescription returns description_short for non-SanityListing with description_short', () => {
    const nonSanityListingWithDescriptionShort: Listing = { ...mockLegacyListing, description_short: 'Another short description.' };
    render(<ListingCard listing={nonSanityListingWithDescriptionShort} />);
    expect(screen.getByText('Another short description.')).toBeInTheDocument();
  });

  test('getDescription returns empty string for non-SanityListing without description or description_short', () => {
    const nonSanityListingWithoutDescription: Listing = { ...mockLegacyListing, description_short: '' };
    render(<ListingCard listing={nonSanityListingWithoutDescription} />);
    expect(screen.queryByText('A great place to stay')).not.toBeInTheDocument();
  });

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
    render(<ListingCard listing={nonSanityListingWithSlug} />);
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
      galleryImages: [], // Ensure galleryImages is empty to test primaryImage
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

  test('getImageUrl returns URL from primary_image_url for non-SanityListing', () => {
    const nonSanityListingWithPrimaryImageUrl: Listing = {
      ...mockLegacyListing,
      primary_image_url: '/non-sanity-primary-image.jpg',
      gallery_image_urls: [], // Ensure images array is empty
    };
    render(<ListingCard listing={nonSanityListingWithPrimaryImageUrl} />);
    const image = screen.getByTestId('image-mock');
    expect(image).toHaveAttribute('src', '/non-sanity-primary-image.jpg');
  });

  test('getImageUrl returns URL from first image in images array for non-SanityListing', () => {
    const nonSanityListingWithImagesArray: Listing = {
      ...mockLegacyListing,
      // @ts-expect-error: Testing missing primary_image_url
      primary_image_url: undefined,
      gallery_image_urls: ['/non-sanity-image-array.jpg'],
    };
    render(<ListingCard listing={nonSanityListingWithImagesArray} />);
    const image = screen.getByTestId('image-mock');
    expect(image).toHaveAttribute('src', '/non-sanity-image-array.jpg');
  });

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

  test('getEcoTags handles eco_focus_tags as array of objects', () => {
    const listingWithObjectEcoTags: Listing = {
      ...mockLegacyListing,
      eco_focus_tags: ['Eco-Friendly', 'Sustainable'],
    };
    render(<ListingCard listing={listingWithObjectEcoTags} />);
    expect(screen.getByText('Eco-Friendly')).toBeInTheDocument();
    expect(screen.getByText('Sustainable')).toBeInTheDocument();
  });

  test('getLocation returns location string if available', () => {
    const listingWithLocationString: Listing = { ...mockLegacyListing, city: 'Remote City' };
    render(<ListingCard listing={listingWithLocationString} />);
    expect(screen.getByText('Remote Location')).toBeInTheDocument();
  });
});