import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import type React from 'react';
import type { CityDTO, ListingDetailDTO } from '../../../types/dto';
import { ListingDetailView } from '../ListingDetailView';

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;

jest.mock('../GalleryGrid', () => {
  return function MockGalleryGrid({ images }: { images: string[] }) {
    return (
      <div data-testid="gallery-grid" data-image-count={images.length}>
        Gallery Grid
      </div>
    );
  };
});

jest.mock('../HeroSection', () => {
  return {
    HeroSection: function MockHeroSection({
      listing,
      favoriteButton,
    }: {
      listing: ListingDetailDTO;
      favoriteButton?: React.ReactNode;
    }) {
      return (
        <div data-testid="hero-section">
          <h1 data-testid="hero-title">{listing.name}</h1>
          {favoriteButton}
        </div>
      );
    },
  };
});

jest.mock('../ListingDetailsCard', () => {
  return {
    ListingDetailsCard: function MockListingDetailsCard() {
      return <div data-testid="listing-details-card">Listing Details</div>;
    },
  };
});

jest.mock('../ReviewsSection', () => {
  return {
    ReviewsSection: function MockReviewsSection({
      reviews,
      listingId,
      isSignedIn,
    }: {
      reviews: Array<{ id: string }>;
      listingId: string;
      isSignedIn: boolean;
    }) {
      return (
        <div data-testid="reviews-section" data-listing-id={listingId} data-signed-in={isSignedIn}>
          <div data-testid="reviews-count">{reviews.length}</div>
          <div data-testid="signin-status">{isSignedIn ? 'signed-in' : 'not-signed-in'}</div>
        </div>
      );
    },
  };
});

jest.mock('../RelatedListings', () => {
  return {
    RelatedListings: function MockRelatedListings({
      listings,
    }: {
      listings: Array<{ id: string }>;
    }) {
      return (
        <div data-testid="related-listings" data-count={listings.length}>
          Related Listings
        </div>
      );
    },
  };
});

jest.mock('../ListingViewTracker', () => ({
  ListingViewTracker: () => null,
}));

jest.mock('../FavoriteButtonOverlay', () => ({
  FavoriteButtonOverlay: ({
    listingSlug,
    isFavorited,
  }: {
    listingSlug: string;
    isFavorited?: boolean;
  }) => (
    <button
      data-testid="favorite-button"
      data-listing-slug={listingSlug}
      aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
    />
  ),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockUsePathname.mockReturnValue('/listings/test-listing');
});

const mockCity: CityDTO = {
  id: 'city-1',
  name: 'Test City',
  country: 'Test Country',
  slug: 'test-city',
  imageUrl: '/test-city.jpg',
  description: 'Test city description',
  population: 100000,
  averageCost: 1000,
  currency: 'USD',
  timezone: 'UTC',
  language: 'English',
  climate: 'Temperate',
  internetSpeed: 50,
  safetyRating: 4.5,
  nomadFriendliness: 4.0,
  seoTitle: 'Test City SEO',
  seoDescription: 'Test city SEO description',
  tags: [],
  featuredListings: [],
  coordinates: { lat: 0, lng: 0 },
};

const baseListing: ListingDetailDTO = {
  id: 'test-listing',
  name: 'Test Listing',
  slug: 'test-listing',
  imageUrl: '/listing.jpg',
  city: mockCity,
  priceRange: 'moderate',
  shortDescription: 'A test listing',
  description: 'Detailed description',
  website: 'https://test.com',
  address: '123 Test St',
  amenities: ['wifi'],
  sustainabilityFeatures: ['solar'],
  galleryImages: ['/gallery1.jpg', '/gallery2.jpg'],
  ecoFocusTags: ['eco-friendly'],
  rating: 4.5,
  reviewCount: 10,
  isFeatured: false,
  status: 'active',
  seoTitle: 'Test Listing SEO',
  seoDescription: 'Test listing SEO description',
};

const baseReviews = [
  {
    id: 'review-1',
    rating: 5,
    comment: 'Great place!',
    user: { name: 'John Doe', image: '/john.jpg' },
    createdAt: '2023-01-01',
    status: 'approved' as const,
  },
];

describe('ListingDetailView', () => {
  it('renders core sections of the listing detail page', () => {
    render(
      <ListingDetailView
        listing={baseListing}
        reviews={baseReviews}
        relatedListings={[
          {
            id: 'related-1',
            name: 'Related',
            slug: 'related',
            imageUrl: '/related.jpg',
            city: mockCity,
            priceRange: 'budget',
            ecoFocusTags: [],
          },
        ]}
        isSignedIn
        isFavorited={false}
      />
    );

    expect(screen.getByTestId('hero-section')).toBeInTheDocument();
    expect(screen.getByTestId('listing-details-card')).toBeInTheDocument();
    expect(screen.getByTestId('reviews-section')).toHaveAttribute(
      'data-listing-id',
      'test-listing'
    );
    expect(screen.getByTestId('gallery-grid')).toHaveAttribute('data-image-count', '2');
    expect(screen.getByTestId('related-listings')).toHaveAttribute('data-count', '1');
  });

  it('applies default props when optional values are omitted', () => {
    render(<ListingDetailView listing={baseListing} />);

    expect(screen.getByTestId('reviews-section')).toHaveAttribute(
      'data-listing-id',
      'test-listing'
    );
    expect(screen.getByTestId('reviews-count')).toHaveTextContent('0');
    expect(screen.getByTestId('signin-status')).toHaveTextContent('not-signed-in');
  });

  it('omits the gallery when no images are provided', () => {
    const listingWithoutImages = { ...baseListing, galleryImages: [] };

    render(
      <ListingDetailView
        listing={listingWithoutImages}
        reviews={baseReviews}
        isSignedIn
        isFavorited={false}
      />
    );

    expect(screen.queryByTestId('gallery-grid')).not.toBeInTheDocument();
  });

  it('does not render related listings when none are passed', () => {
    render(
      <ListingDetailView
        listing={baseListing}
        reviews={baseReviews}
        relatedListings={[]}
        isSignedIn
        isFavorited={false}
      />
    );

    expect(screen.queryByTestId('related-listings')).not.toBeInTheDocument();
  });

  it('passes authentication state through to the reviews section', () => {
    render(
      <ListingDetailView
        listing={baseListing}
        reviews={baseReviews}
        isSignedIn={false}
        isFavorited={false}
      />
    );

    expect(screen.getByTestId('signin-status')).toHaveTextContent('not-signed-in');
  });

  it('renders the favorite button when provided as a client island', () => {
    render(
      <ListingDetailView
        listing={baseListing}
        reviews={baseReviews}
        isSignedIn
        isFavorited={false}
      />
    );

    expect(screen.getByTestId('favorite-button')).toBeInTheDocument();
    expect(screen.getByTestId('favorite-button')).toHaveAttribute(
      'data-listing-slug',
      baseListing.slug
    );
  });

  it('renders with a full set of props', () => {
    render(
      <ListingDetailView
        listing={baseListing}
        reviews={baseReviews}
        relatedListings={[
          {
            id: 'related-1',
            name: 'Related',
            slug: 'related',
            imageUrl: '/related.jpg',
            city: mockCity,
            priceRange: 'budget',
            ecoFocusTags: [],
          },
        ]}
        isSignedIn
        isFavorited
      />
    );

    expect(screen.getByTestId('hero-section')).toBeInTheDocument();
    expect(screen.getByTestId('listing-details-card')).toBeInTheDocument();
    expect(screen.getByTestId('reviews-section')).toBeInTheDocument();
    expect(screen.getByTestId('gallery-grid')).toBeInTheDocument();
    expect(screen.getByTestId('related-listings')).toBeInTheDocument();
    expect(screen.getByTestId('favorite-button')).toHaveAttribute(
      'data-listing-slug',
      baseListing.slug
    );
  });

  it('excludes the current listing from the related listings', () => {
    const relatedListingsWithCurrent = [
      {
        id: 'related-1',
        name: 'Related',
        slug: 'related',
        imageUrl: '/related.jpg',
        city: mockCity,
        priceRange: 'budget' as const,
        ecoFocusTags: [],
      },
      {
        id: baseListing.id,
        name: baseListing.name,
        slug: baseListing.slug,
        imageUrl: baseListing.imageUrl,
        city: mockCity,
        priceRange: 'moderate' as const,
        ecoFocusTags: [],
      },
    ];

    render(
      <ListingDetailView listing={baseListing} relatedListings={relatedListingsWithCurrent} />
    );

    expect(screen.getByTestId('related-listings')).toHaveAttribute('data-count', '1');
  });
});
