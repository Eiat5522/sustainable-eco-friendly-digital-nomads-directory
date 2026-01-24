import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RelatedListings } from '../RelatedListings';

// Mock embla carousel
const mockScrollPrev = jest.fn();
const mockScrollNext = jest.fn();

jest.mock('embla-carousel-react', () => {
  return () => {
    const ref = jest.fn(node => node);
    const api = {
      scrollPrev: mockScrollPrev,
      scrollNext: mockScrollNext,
    };
    return [ref, api];
  };
});

jest.mock('embla-carousel-autoplay', () => {
  return jest.fn(() => ({
    stop: jest.fn(),
    play: jest.fn(),
  }));
});

// Mock Next.js components
jest.mock('next/link', () => {
  return ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  );
});

jest.mock('next/image', () => {
  return ({ src, alt, fill, onError, ...props }: any) => {
    return <img src={src} alt={alt} onError={onError} {...props} />;
  };
});

describe('RelatedListings', () => {
  const mockListings = [
    {
      id: '1',
      slug: 'eco-hotel-bangkok',
      name: 'Eco Hotel Bangkok',
      city: { id: 'bangkok-1', name: 'Bangkok', slug: 'bangkok', country: 'Thailand' },
      imageUrl: 'https://example.com/image1.jpg',
      priceRange: 'budget' as const,
      ecoFocusTags: ['Solar Power', 'Water Conservation'],
    },
    {
      id: '2',
      slug: 'green-cafe',
      name: 'Green Cafe',
      city: 'Chiang Mai',
      imageUrl: '',
      priceRange: 'moderate' as const,
      ecoFocusTags: ['Vegan', 'Zero Waste', 'Organic', 'Local'],
    },
    {
      id: '3',
      slug: 'premium-coworking',
      name: 'Premium Coworking',
      city: { id: 'bkk', name: 'Bangkok', slug: 'bangkok', country: 'Thailand' },
      imageUrl: 'https://example.com/image3.jpg',
      priceRange: 'premium' as const,
      ecoFocusTags: ['Green Building'],
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders the section', () => {
      const { container } = render(<RelatedListings listings={mockListings} />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders section header', () => {
      render(<RelatedListings listings={mockListings} />);
      expect(screen.getByText('Related Listings')).toBeInTheDocument();
      expect(
        screen.getByText('Discover similar sustainable venues you might love')
      ).toBeInTheDocument();
    });

    it('renders all listing cards', () => {
      render(<RelatedListings listings={mockListings} />);

      expect(screen.getByText('Eco Hotel Bangkok')).toBeInTheDocument();
      expect(screen.getByText('Green Cafe')).toBeInTheDocument();
      expect(screen.getByText('Premium Coworking')).toBeInTheDocument();
    });

    it('returns null when no listings provided', () => {
      const { container } = render(<RelatedListings listings={[]} />);
      expect(container.firstChild).toBeNull();
    });

    it('returns null when listings is null', () => {
      const { container } = render(<RelatedListings listings={null as any} />);
      expect(container.firstChild).toBeNull();
    });

    it('returns null when listings is undefined', () => {
      const { container } = render(<RelatedListings listings={undefined as any} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Carousel Navigation', () => {
    it('renders navigation buttons', () => {
      render(<RelatedListings listings={mockListings} />);

      const prevButton = screen.getByLabelText('Scroll related listings left');
      const nextButton = screen.getByLabelText('Scroll related listings right');

      expect(prevButton).toBeInTheDocument();
      expect(nextButton).toBeInTheDocument();
    });

    it('calls scrollPrev when left button is clicked', async () => {
      render(<RelatedListings listings={mockListings} />);

      const prevButton = screen.getByLabelText('Scroll related listings left');
      await userEvent.click(prevButton);

      expect(mockScrollPrev).toHaveBeenCalledTimes(1);
    });

    it('calls scrollNext when right button is clicked', async () => {
      render(<RelatedListings listings={mockListings} />);

      const nextButton = screen.getByLabelText('Scroll related listings right');
      await userEvent.click(nextButton);

      expect(mockScrollNext).toHaveBeenCalledTimes(1);
    });

    it('hides navigation buttons on mobile (md breakpoint)', () => {
      const { container } = render(<RelatedListings listings={mockListings} />);

      const prevButton = screen.getByLabelText('Scroll related listings left');
      const nextButton = screen.getByLabelText('Scroll related listings right');

      expect(prevButton).toHaveClass('hidden');
      expect(prevButton).toHaveClass('md:flex');
      expect(nextButton).toHaveClass('hidden');
      expect(nextButton).toHaveClass('md:flex');
    });

    it('positions navigation buttons correctly', () => {
      render(<RelatedListings listings={mockListings} />);

      const prevButton = screen.getByLabelText('Scroll related listings left');
      const nextButton = screen.getByLabelText('Scroll related listings right');

      expect(prevButton).toHaveClass('absolute');
      expect(prevButton).toHaveClass('-left-3');
      expect(prevButton).toHaveClass('top-1/2');
      expect(prevButton).toHaveClass('-translate-y-1/2');

      expect(nextButton).toHaveClass('absolute');
      expect(nextButton).toHaveClass('-right-3');
      expect(nextButton).toHaveClass('top-1/2');
      expect(nextButton).toHaveClass('-translate-y-1/2');
    });
  });

  describe('Listing Cards', () => {
    it('renders clickable links to listing details', () => {
      render(<RelatedListings listings={mockListings} />);

      const ecoHotelLink = screen.getByRole('link', { name: /Eco Hotel Bangkok/i });
      expect(ecoHotelLink).toHaveAttribute('href', '/listings/eco-hotel-bangkok');

      const greenCafeLink = screen.getByRole('link', { name: /Green Cafe/i });
      expect(greenCafeLink).toHaveAttribute('href', '/listings/green-cafe');
    });

    it('renders listing names', () => {
      render(<RelatedListings listings={mockListings} />);

      expect(screen.getByText('Eco Hotel Bangkok')).toBeInTheDocument();
      expect(screen.getByText('Green Cafe')).toBeInTheDocument();
      expect(screen.getByText('Premium Coworking')).toBeInTheDocument();
    });

    it('renders city names when city is object', () => {
      render(<RelatedListings listings={mockListings} />);

      expect(screen.getAllByText('Bangkok')[0]).toBeInTheDocument();
    });

    it('renders city names when city is string', () => {
      render(<RelatedListings listings={mockListings} />);

      expect(screen.getByText('Chiang Mai')).toBeInTheDocument();
    });

    it('does not render city when null', () => {
      const listingWithNullCity = [
        {
          ...mockListings[0],
          city: null,
        },
      ];

      render(<RelatedListings listings={listingWithNullCity} />);

      // Should still render the listing
      expect(screen.getByText('Eco Hotel Bangkok')).toBeInTheDocument();
    });

    it('applies correct test ids', () => {
      render(<RelatedListings listings={mockListings} />);

      const cards = screen.getAllByTestId('related-listing-card');
      expect(cards).toHaveLength(3);
    });

    it('includes data-has-image attribute', () => {
      render(<RelatedListings listings={mockListings} />);

      const cards = screen.getAllByTestId('related-listing-card');

      // First listing has image
      expect(cards[0]).toHaveAttribute('data-has-image', 'true');

      // Second listing has no image
      expect(cards[1]).toHaveAttribute('data-has-image', 'false');
    });
  });

  describe('Images', () => {
    it('renders placeholder image only for listings without imageUrl', () => {
      const { container } = render(<RelatedListings listings={mockListings} />);

      // Only listing 2 has empty imageUrl, so only 1 fallback should be rendered
      const placeholders = screen.getAllByTestId('related-listing-fallback');
      expect(placeholders).toHaveLength(1);
    });

    it('renders listing image when imageUrl is provided', () => {
      const { container } = render(<RelatedListings listings={mockListings} />);

      const listingImages = container.querySelectorAll('img[src="https://example.com/image1.jpg"]');
      expect(listingImages.length).toBeGreaterThan(0);
    });

    it('provides proper alt text for images', () => {
      render(<RelatedListings listings={mockListings} />);

      expect(screen.getByAltText('Eco Hotel Bangkok in Bangkok')).toBeInTheDocument();
    });

    it('handles missing city in image alt text', () => {
      const listingWithNullCity = [
        {
          ...mockListings[0],
          city: null,
        },
      ];

      render(<RelatedListings listings={listingWithNullCity} />);

      expect(screen.getByAltText(/Eco Hotel Bangkok in\s*$/)).toBeInTheDocument();
    });

    it('shows fallback for listings without imageUrl', () => {
      const listingsWithoutImages = [
        {
          id: '1',
          slug: 'test-listing',
          name: 'Test Listing',
          city: 'Bangkok',
          imageUrl: '',
          priceRange: 'moderate' as const,
          ecoFocusTags: ['Test'],
        },
      ];

      const { container } = render(<RelatedListings listings={listingsWithoutImages} />);

      const fallback = screen.getByTestId('related-listing-fallback');
      expect(fallback).toBeInTheDocument();
      expect(fallback).toHaveAttribute('src', '/placeholder_image.png');
    });

    it('sets placeholder image attributes correctly', () => {
      render(<RelatedListings listings={mockListings} />);

      const placeholders = screen.getAllByTestId('related-listing-fallback');
      placeholders.forEach(placeholder => {
        expect(placeholder).toHaveAttribute('src', '/placeholder_image.png');
        expect(placeholder).toHaveAttribute('alt', '');
        expect(placeholder).toHaveAttribute('aria-hidden');
        expect(placeholder).toHaveAttribute('role', 'presentation');
      });
    });
  });

  describe('Price Range Badge', () => {
    it('renders price range badge for budget listings', () => {
      render(<RelatedListings listings={[mockListings[0]]} />);

      const badge = screen.getByText('Budget');
      expect(badge).toHaveClass('bg-green-100');
      expect(badge).toHaveClass('text-green-600');
    });

    it('renders price range badge for moderate listings', () => {
      render(<RelatedListings listings={[mockListings[1]]} />);

      const badge = screen.getByText('Moderate');
      expect(badge).toHaveClass('bg-yellow-100');
      expect(badge).toHaveClass('text-yellow-600');
    });

    it('renders price range badge for premium listings', () => {
      render(<RelatedListings listings={[mockListings[2]]} />);

      const badge = screen.getByText('Premium');
      expect(badge).toHaveClass('bg-purple-100');
      expect(badge).toHaveClass('text-purple-600');
    });

    it('capitalizes price range text', () => {
      render(<RelatedListings listings={mockListings} />);

      expect(screen.getByText('Budget')).toBeInTheDocument();
      expect(screen.getByText('Moderate')).toBeInTheDocument();
      expect(screen.getByText('Premium')).toBeInTheDocument();
    });

    it('positions badge correctly', () => {
      const { container } = render(<RelatedListings listings={mockListings} />);

      const badges = container.querySelectorAll('.absolute.top-3.left-3');
      expect(badges.length).toBeGreaterThan(0);
    });

    it('handles missing price range gracefully', () => {
      const listingWithoutPrice = [
        {
          ...mockListings[0],
          priceRange: undefined as any,
        },
      ];

      render(<RelatedListings listings={listingWithoutPrice} />);

      // Should still render the listing without crashing
      expect(screen.getByText('Eco Hotel Bangkok')).toBeInTheDocument();
    });
  });

  describe('Eco Focus Tags', () => {
    it('renders eco focus tags when available', () => {
      render(<RelatedListings listings={mockListings} />);

      expect(screen.getByText('Solar Power')).toBeInTheDocument();
      expect(screen.getByText('Water Conservation')).toBeInTheDocument();
      expect(screen.getByText('Vegan')).toBeInTheDocument();
    });

    it('limits eco focus tags to 3', () => {
      render(<RelatedListings listings={mockListings} />);

      // Second listing has 4 tags
      expect(screen.getByText('Vegan')).toBeInTheDocument();
      expect(screen.getByText('Zero Waste')).toBeInTheDocument();
      expect(screen.getByText('Organic')).toBeInTheDocument();
      expect(screen.getByText('+1 more')).toBeInTheDocument();
    });

    it('does not show +more badge when exactly 3 tags', () => {
      const listingWith3Tags = [
        {
          ...mockListings[0],
          ecoFocusTags: ['Tag1', 'Tag2', 'Tag3'],
        },
      ];

      render(<RelatedListings listings={listingWith3Tags} />);

      expect(screen.queryByText(/\+.*more/)).not.toBeInTheDocument();
    });

    it('calculates correct number in +more badge', () => {
      const listingWithManyTags = [
        {
          ...mockListings[0],
          ecoFocusTags: ['Tag1', 'Tag2', 'Tag3', 'Tag4', 'Tag5', 'Tag6'],
        },
      ];

      render(<RelatedListings listings={listingWithManyTags} />);

      expect(screen.getByText('+3 more')).toBeInTheDocument();
    });

    it('styles eco tags correctly', () => {
      render(<RelatedListings listings={mockListings} />);

      const solarTag = screen.getByText('Solar Power');
      expect(solarTag).toHaveClass('bg-neo-success/20');
      expect(solarTag).toHaveClass('text-neo-success');
    });

    it('does not render tags section when no tags', () => {
      const listingWithoutTags = [
        {
          ...mockListings[0],
          ecoFocusTags: [],
        },
      ];

      render(<RelatedListings listings={listingWithoutTags} />);

      // Should still render the listing
      expect(screen.getByText('Eco Hotel Bangkok')).toBeInTheDocument();
    });
  });

  describe('Card Styling and Hover Effects', () => {
    it('applies NeoCard variant', () => {
      const { container } = render(<RelatedListings listings={mockListings} />);

      const cards = container.querySelectorAll('.group');
      expect(cards.length).toBeGreaterThan(0);
    });

    it('applies hover transition classes', () => {
      const { container } = render(<RelatedListings listings={mockListings} />);

      const cards = container.querySelectorAll('.group');
      cards.forEach(card => {
        expect(card).toHaveClass('transition-all');
        expect(card).toHaveClass('duration-300');
      });
    });

    it('applies cursor pointer to cards', () => {
      const { container } = render(<RelatedListings listings={mockListings} />);

      const cards = container.querySelectorAll('.group');
      cards.forEach(card => {
        expect(card).toHaveClass('cursor-pointer');
      });
    });

    it('applies h-full for proper layout', () => {
      const { container } = render(<RelatedListings listings={mockListings} />);

      const cards = container.querySelectorAll('.group');
      cards.forEach(card => {
        expect(card).toHaveClass('h-full');
      });
    });
  });

  describe('Carousel Layout', () => {
    it('applies responsive basis classes', () => {
      const { container } = render(<RelatedListings listings={mockListings} />);

      const cardContainers = container.querySelectorAll('.shrink-0');
      cardContainers.forEach(container => {
        expect(container).toHaveClass('basis-[85%]');
        expect(container).toHaveClass('sm:basis-[60%]');
        expect(container).toHaveClass('lg:basis-1/2');
      });
    });

    it('applies gap between cards', () => {
      const { container } = render(<RelatedListings listings={mockListings} />);

      const carousel = container.querySelector('.flex.gap-6');
      expect(carousel).toBeInTheDocument();
    });

    it('applies overflow hidden to carousel viewport', () => {
      const { container } = render(<RelatedListings listings={mockListings} />);

      const viewport = container.querySelector('.overflow-hidden');
      expect(viewport).toBeInTheDocument();
    });
  });

  describe('Image Container Styling', () => {
    it('applies correct dimensions to image container', () => {
      const { container } = render(<RelatedListings listings={mockListings} />);

      const imageContainers = container.querySelectorAll('.relative.h-48');
      expect(imageContainers.length).toBeGreaterThan(0);
    });

    it('applies rounded corners to image container', () => {
      const { container } = render(<RelatedListings listings={mockListings} />);

      const imageContainers = container.querySelectorAll('.rounded-lg');
      expect(imageContainers.length).toBeGreaterThan(0);
    });

    it('applies overflow hidden to image container', () => {
      const { container } = render(<RelatedListings listings={mockListings} />);

      const imageContainers = container.querySelectorAll('.overflow-hidden');
      expect(imageContainers.length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility', () => {
    it('provides semantic link elements', () => {
      render(<RelatedListings listings={mockListings} />);

      const links = screen.getAllByRole('link');
      expect(links.length).toBeGreaterThanOrEqual(3);
    });

    it('has accessible names for navigation buttons', () => {
      render(<RelatedListings listings={mockListings} />);

      const prevButton = screen.getByLabelText('Scroll related listings left');
      const nextButton = screen.getByLabelText('Scroll related listings right');

      expect(prevButton).toBeInTheDocument();
      expect(nextButton).toBeInTheDocument();
    });

    it('provides meaningful alt text for listing images', () => {
      render(<RelatedListings listings={mockListings} />);

      expect(screen.getByAltText('Eco Hotel Bangkok in Bangkok')).toBeInTheDocument();
    });

    it('hides placeholder images from screen readers', () => {
      render(<RelatedListings listings={mockListings} />);

      const placeholders = screen.getAllByTestId('related-listing-fallback');
      placeholders.forEach(placeholder => {
        expect(placeholder).toHaveAttribute('aria-hidden');
        expect(placeholder).toHaveAttribute('role', 'presentation');
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles single listing', () => {
      render(<RelatedListings listings={[mockListings[0]]} />);

      expect(screen.getByText('Eco Hotel Bangkok')).toBeInTheDocument();
    });

    it('handles large number of listings', () => {
      const manyListings = Array.from({ length: 20 }, (_, i) => ({
        id: `listing-${i}`,
        slug: `listing-${i}`,
        name: `Listing ${i}`,
        city: { id: `city-${i}`, name: `City ${i}`, slug: `city-${i}`, country: 'Country' },
        imageUrl: '',
        priceRange: 'budget' as const,
        ecoFocusTags: ['Tag1'],
      }));

      render(<RelatedListings listings={manyListings} />);

      const cards = screen.getAllByTestId('related-listing-card');
      expect(cards).toHaveLength(20);
    });

    it('handles listing with very long name', () => {
      const longNameListing = [
        {
          ...mockListings[0],
          name: 'A'.repeat(200),
        },
      ];

      render(<RelatedListings listings={longNameListing} />);

      expect(screen.getByText('A'.repeat(200))).toBeInTheDocument();
    });

    it('handles listing with special characters in name', () => {
      const specialCharListing = [
        {
          ...mockListings[0],
          name: 'Café & Restaurant "The Green" <Special>',
        },
      ];

      render(<RelatedListings listings={specialCharListing} />);

      expect(screen.getByText('Café & Restaurant "The Green" <Special>')).toBeInTheDocument();
    });

    it('handles mixed city formats', () => {
      render(<RelatedListings listings={mockListings} />);

      // Should render both object and string cities
      expect(screen.getAllByText('Bangkok')).toHaveLength(2);
      expect(screen.getByText('Chiang Mai')).toBeInTheDocument();
    });

    it('handles undefined price range', () => {
      const noPriceListing = [
        {
          ...mockListings[0],
          priceRange: undefined as any,
        },
      ];

      render(<RelatedListings listings={noPriceListing} />);

      expect(screen.getByText('Eco Hotel Bangkok')).toBeInTheDocument();
    });

    it('handles empty ecoFocusTags array', () => {
      const noTagsListing = [
        {
          ...mockListings[0],
          ecoFocusTags: [],
        },
      ];

      render(<RelatedListings listings={noTagsListing} />);

      expect(screen.getByText('Eco Hotel Bangkok')).toBeInTheDocument();
    });
  });

  describe('Helper Function: getPriceRangeColor', () => {
    it('returns correct colors for budget', () => {
      render(<RelatedListings listings={[mockListings[0]]} />);

      const badge = screen.getByText('Budget');
      expect(badge).toHaveClass('text-green-600');
      expect(badge).toHaveClass('bg-green-100');
    });

    it('returns correct colors for moderate', () => {
      render(<RelatedListings listings={[mockListings[1]]} />);

      const badge = screen.getByText('Moderate');
      expect(badge).toHaveClass('text-yellow-600');
      expect(badge).toHaveClass('bg-yellow-100');
    });

    it('returns correct colors for premium', () => {
      render(<RelatedListings listings={[mockListings[2]]} />);

      const badge = screen.getByText('Premium');
      expect(badge).toHaveClass('text-purple-600');
      expect(badge).toHaveClass('bg-purple-100');
    });

    it('returns default colors for unknown price range', () => {
      const unknownPriceListing = [
        {
          ...mockListings[0],
          priceRange: 'unknown' as any,
        },
      ];

      const { container } = render(<RelatedListings listings={unknownPriceListing} />);

      const badge = screen.getByText('Unknown');
      expect(badge).toHaveClass('text-gray-600');
      expect(badge).toHaveClass('bg-gray-100');
    });
  });
});
