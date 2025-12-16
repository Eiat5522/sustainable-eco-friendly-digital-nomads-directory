import { render, screen } from '@testing-library/react';
import type { CityDTO, ListingDetailDTO } from '@/types/dto';
import { HeroSection } from '../HeroSection';

// Mock Next.js Image component
jest.mock('next/image', () => {
  return function MockImage({
    src,
    alt,
    fill,
    sizes,
    className,
    priority,
  }: React.ComponentProps<'img'> & { fill?: boolean; sizes?: string; priority?: boolean }) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        className={className}
        data-testid="next-image"
        data-fill={fill}
        data-sizes={sizes}
        data-priority={priority}
      />
    );
  };
});

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  MapPin: function MockMapPin({ size, className }: { size?: number | string; className?: string }) {
    return (
      <span data-testid="map-pin-icon" data-size={size} className={className}>
        📍
      </span>
    );
  },
  Heart: function MockHeart({ size, className }: { size?: number | string; className?: string }) {
    return (
      <span data-testid="heart-icon" data-size={size} className={className}>
        ❤️
      </span>
    );
  },
}));

// Mock UI components
jest.mock('@/components/ui/neo-card', () => ({
  NeoCard: function MockNeoCard({
    children,
    variant,
    className,
  }: React.PropsWithChildren<{ variant?: string; className?: string }>) {
    return (
      <div className={className} data-variant={variant} data-testid="neo-card">
        {children}
      </div>
    );
  },
  NeoCardHeader: function MockNeoCardHeader({ children }: React.PropsWithChildren) {
    return <div data-testid="neo-card-header">{children}</div>;
  },
  NeoCardTitle: function MockNeoCardTitle({
    children,
    className,
  }: React.PropsWithChildren<{ className?: string }>) {
    return (
      <h1 className={className} data-testid="neo-card-title">
        {children}
      </h1>
    );
  },
}));

jest.mock('@/components/ui/neo-button', () => ({
  NeoButton: function MockNeoButton({
    children,
    onClick,
    variant,
    size,
    className,
    'aria-label': ariaLabel,
  }: React.PropsWithChildren<{
    onClick?: () => void;
    variant?: string;
    size?: string;
    className?: string;
    'aria-label'?: string;
  }>) {
    return (
      <button
        onClick={onClick}
        className={className}
        data-variant={variant}
        data-size={size}
        data-testid="neo-button"
        aria-label={ariaLabel}
      >
        {children}
      </button>
    );
  },
}));

// Mock FALLBACK_IMAGE constant
jest.mock('@/lib/dto-transformer', () => ({
  FALLBACK_IMAGE: '/placeholder_image.png',
}));

describe('HeroSection', () => {
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

  const mockListing: ListingDetailDTO = {
    id: 'listing-1',
    name: 'Sustainable Coffee Shop',
    slug: 'sustainable-coffee-shop',
    imageUrl: '/coffee-shop.jpg',
    city: mockCity,
    priceRange: 'moderate',
    shortDescription: 'Eco-friendly coffee shop with organic beans and solar power',
    description: 'Detailed description of the coffee shop',
    website: 'https://sustainablecoffee.com',
    address: '123 Green Street',
    amenities: ['wifi', 'coffee', 'vegan-options'],
    sustainabilityFeatures: ['solar-power', 'organic', 'fair-trade'],
    galleryImages: ['/gallery1.jpg', '/gallery2.jpg'],
    ecoFocusTags: ['eco-friendly', 'sustainable'],
    rating: 4.5,
    reviewCount: 10,
    isFeatured: true,
    status: 'active',
    seoTitle: 'Sustainable Coffee Shop SEO',
    seoDescription: 'Eco-friendly coffee shop SEO description',
  };

  const mockOnToggleFavorite = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders listing information correctly', () => {
    render(<HeroSection listing={mockListing} />);

    expect(screen.getByTestId('neo-card-title')).toHaveTextContent('Sustainable Coffee Shop');
    expect(screen.getByText('Test City, Test Country')).toBeInTheDocument();
    expect(
      screen.getByText('Eco-friendly coffee shop with organic beans and solar power')
    ).toBeInTheDocument();
    expect(screen.getByText(/moderate.*Range/)).toBeInTheDocument();
  });

  it('renders hero image when available', () => {
    render(
      <HeroSection
        listing={mockListing}
        isFavorited={false}
        onToggleFavorite={mockOnToggleFavorite}
      />
    );

    const image = screen.getByTestId('next-image');
    expect(image).toHaveAttribute('src', '/coffee-shop.jpg');
    expect(image).toHaveAttribute('alt', 'Sustainable Coffee Shop - Test City sustainable venue');
    expect(image).toHaveAttribute('data-fill', 'true');
    expect(image).toHaveAttribute('data-priority', 'true');
  });

  it('does not render image when using fallback image', () => {
    const listingWithFallback = {
      ...mockListing,
      imageUrl: '/placeholder_image.png',
    };

    render(
      <HeroSection
        listing={listingWithFallback}
        isFavorited={false}
        onToggleFavorite={mockOnToggleFavorite}
      />
    );

    expect(screen.queryByTestId('next-image')).not.toBeInTheDocument();
  });

  it('does not render image when imageUrl is empty', () => {
    const listingWithEmptyImage = {
      ...mockListing,
      imageUrl: '',
    };

    render(
      <HeroSection
        listing={listingWithEmptyImage}
        isFavorited={false}
        onToggleFavorite={mockOnToggleFavorite}
      />
    );

    expect(screen.queryByTestId('next-image')).not.toBeInTheDocument();
  });

  it('renders MapPin icon with city information', () => {
    render(
      <HeroSection
        listing={mockListing}
        isFavorited={false}
        onToggleFavorite={mockOnToggleFavorite}
      />
    );

    const mapIcon = screen.getByTestId('map-pin-icon');
    expect(mapIcon).toBeInTheDocument();
    expect(mapIcon).toHaveAttribute('data-size', '20');
  });

  it('handles listing without city information', () => {
    const listingWithoutCity = {
      ...mockListing,
      city: null,
    };

    render(
      <HeroSection
        listing={listingWithoutCity}
        isFavorited={false}
        onToggleFavorite={mockOnToggleFavorite}
      />
    );

    expect(screen.queryByTestId('map-pin-icon')).not.toBeInTheDocument();
    expect(screen.queryByText('Test City, Test Country')).not.toBeInTheDocument();
  });

  it('handles listing without short description', () => {
    const listingWithoutDescription = {
      ...mockListing,
      shortDescription: undefined,
    };

    render(
      <HeroSection
        listing={listingWithoutDescription}
        isFavorited={false}
        onToggleFavorite={mockOnToggleFavorite}
      />
    );

    expect(
      screen.queryByText('Eco-friendly coffee shop with organic beans and solar power')
    ).not.toBeInTheDocument();
  });

  it('handles listing without price range', () => {
    const listingWithoutPriceRange = {
      ...mockListing,
      priceRange: undefined,
    };

    render(
      <HeroSection
        listing={listingWithoutPriceRange}
        isFavorited={false}
        onToggleFavorite={mockOnToggleFavorite}
      />
    );

    expect(screen.queryByText(/Range$/)).not.toBeInTheDocument();
  });

  describe('Favorite functionality', () => {
    it('renders FavoriteButton with correct props', () => {
      render(<HeroSection listing={mockListing} />);

      const favoriteButton = screen.getByTestId('neo-button');
      expect(favoriteButton).toHaveAttribute('data-size', 'sm');
      expect(favoriteButton).toHaveClass('bg-white/90', 'hover:bg-white');
    });

    it('positions favorite button correctly in hero image overlay', () => {
      render(<HeroSection listing={mockListing} />);

      const favoriteButton = screen.getByTestId('neo-button');
      const buttonContainer = favoriteButton.parentElement;
      expect(buttonContainer).toHaveClass('absolute', 'top-4', 'right-4');
    });

    it('renders heart icon', () => {
      render(<HeroSection listing={mockListing} />);

      const heartIcon = screen.getByTestId('heart-icon');
      expect(heartIcon).toBeInTheDocument();
    });
  });

  describe('Price range display', () => {
    it('displays budget price range correctly', () => {
      const budgetListing = {
        ...mockListing,
        priceRange: 'budget' as const,
      };

      render(<HeroSection listing={budgetListing} />);

      expect(screen.getByText(/budget.*Range/)).toBeInTheDocument();
    });

    it('displays premium price range correctly', () => {
      const premiumListing = {
        ...mockListing,
        priceRange: 'premium' as const,
      };

      render(<HeroSection listing={premiumListing} />);

      expect(screen.getByText(/premium.*Range/)).toBeInTheDocument();
    });

    it('capitalizes price range text correctly', () => {
      render(<HeroSection listing={mockListing} />);

      const priceRangeElement = screen.getByText(/moderate.*Range/);
      expect(priceRangeElement).toHaveClass('capitalize');
    });
  });

  describe('Accessibility', () => {
    it('provides proper alt text for hero image', () => {
      render(
        <HeroSection
          listing={mockListing}
          isFavorited={false}
          onToggleFavorite={mockOnToggleFavorite}
        />
      );

      const image = screen.getByTestId('next-image');
      expect(image).toHaveAttribute('alt', 'Sustainable Coffee Shop - Test City sustainable venue');
    });

    it('provides proper alt text for listing without city', () => {
      const listingWithoutCity = {
        ...mockListing,
        city: null,
      };

      render(
        <HeroSection
          listing={listingWithoutCity}
          isFavorited={false}
          onToggleFavorite={mockOnToggleFavorite}
        />
      );

      const image = screen.getByTestId('next-image');
      expect(image).toHaveAttribute('alt', 'Sustainable Coffee Shop sustainable venue');
    });

    it('provides proper aria-label for favorite button when not favorited', () => {
      render(
        <HeroSection
          listing={mockListing}
          isFavorited={false}
          onToggleFavorite={mockOnToggleFavorite}
        />
      );

      const favoriteButton = screen.getByTestId('neo-button');
      expect(favoriteButton).toHaveAttribute('aria-label', 'Add to favorites');
    });

    it('provides proper aria-label for favorite button when favorited', () => {
      render(
        <HeroSection
          listing={mockListing}
          isFavorited={true}
          onToggleFavorite={mockOnToggleFavorite}
        />
      );

      const favoriteButton = screen.getByTestId('neo-button');
      expect(favoriteButton).toHaveAttribute('aria-label', 'Remove from favorites');
    });
  });

  describe('Component structure and styling', () => {
    it('renders with correct card variant', () => {
      render(<HeroSection listing={mockListing} />);

      const card = screen.getByTestId('neo-card');
      expect(card).toHaveAttribute('data-variant', 'elevated');
      expect(card).toHaveClass('mb-8');
    });

    it('applies correct heading styles to listing title', () => {
      render(<HeroSection listing={mockListing} />);

      const title = screen.getByTestId('neo-card-title');
      expect(title).toHaveClass('heading-xl', 'mb-2');
    });

    it('renders with correct hero image container styles', () => {
      render(<HeroSection listing={mockListing} />);

      // Use a more specific selector or add a data-testid to the container
      const image = screen.getByTestId('next-image');
      const heroContainer = image.closest('[class*="relative"]');
      expect(heroContainer).toHaveClass(
        'relative',
        'h-64',
        'md:h-80',
        'mb-6',
        'overflow-hidden',
        'rounded-lg'
      );
    });
  });
});
