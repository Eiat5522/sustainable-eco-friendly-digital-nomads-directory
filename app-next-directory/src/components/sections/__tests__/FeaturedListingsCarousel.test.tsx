import { render, screen } from '@testing-library/react';
import type { FeaturedListingDTO } from '@/types/dto';
import { FeaturedListingsCarousel } from '../FeaturedListingsCarousel';

// Mock embla-carousel-react
jest.mock('embla-carousel-react', () => {
  const mockEmblaApi = {
    canScrollPrev: jest.fn(() => true),
    canScrollNext: jest.fn(() => true),
    scrollPrev: jest.fn(),
    scrollNext: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
  };

  return {
    __esModule: true,
    default: jest.fn(() => [jest.fn(), mockEmblaApi]),
  };
});

// Mock embla-carousel-autoplay
jest.mock('embla-carousel-autoplay', () => {
  return {
    __esModule: true,
    default: jest.fn(() => ({
      stop: jest.fn(),
      play: jest.fn(),
    })),
  };
});

// Mock VenueCard component
jest.mock('@/components/ui/VenueCard', () => ({
  VenueCard: ({ venue, priority, className }: any) => (
    <div
      data-testid="venue-card"
      data-venue-id={venue.id}
      data-venue-name={venue.name}
      data-priority={priority}
      className={className}
    >
      {venue.name}
    </div>
  ),
}));

// Mock NeoButton component
jest.mock('@/components/ui/neo-button', () => ({
  NeoButton: ({ children, onClick, disabled, className, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} className={className} {...props}>
      {children}
    </button>
  ),
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  ChevronLeft: () => <span>ChevronLeft</span>,
  ChevronRight: () => <span>ChevronRight</span>,
}));

describe('FeaturedListingsCarousel', () => {
  const mockListings: FeaturedListingDTO[] = [
    {
      id: '1',
      slug: 'eco-hotel-bangkok',
      name: 'Eco Hotel Bangkok',
      city: { id: 'bangkok-1', name: 'Bangkok', slug: 'bangkok', country: 'Thailand' },
      imageUrl: 'https://example.com/image1.jpg',
      featured: true,
      ecoFocusTags: ['Solar Power', 'Water Conservation'],
      amenityNames: ['Free WiFi', 'Co-working Space'],
    },
    {
      id: '2',
      slug: 'green-cafe-chiang-mai',
      name: 'Green Cafe',
      city: { id: 'cm-1', name: 'Chiang Mai', slug: 'chiang-mai', country: 'Thailand' },
      imageUrl: 'https://example.com/image2.jpg',
      featured: false,
      ecoFocusTags: ['Vegan', 'Zero Waste'],
      amenityNames: ['WiFi', 'Outdoor Seating'],
    },
    {
      id: '3',
      slug: 'sustainable-hostel',
      name: 'Sustainable Hostel',
      city: { id: 'lisbon-1', name: 'Lisbon', slug: 'lisbon', country: 'Portugal' },
      imageUrl: 'https://example.com/image3.jpg',
      featured: true,
      ecoFocusTags: ['Recycling', 'Organic Food'],
      amenityNames: ['Kitchen', 'Bike Storage'],
    },
  ];

  describe('Basic Rendering', () => {
    it('renders the carousel container', () => {
      render(<FeaturedListingsCarousel listings={mockListings} />);

      const carousel = screen.getByRole('region', { name: /featured venues carousel/i });
      expect(carousel).toBeInTheDocument();
    });

    it('renders all listing cards', () => {
      render(<FeaturedListingsCarousel listings={mockListings} />);

      const cards = screen.getAllByTestId('venue-card');
      expect(cards).toHaveLength(3);
    });

    it('renders listing names in cards', () => {
      render(<FeaturedListingsCarousel listings={mockListings} />);

      expect(screen.getByText('Eco Hotel Bangkok')).toBeInTheDocument();
      expect(screen.getByText('Green Cafe')).toBeInTheDocument();
      expect(screen.getByText('Sustainable Hostel')).toBeInTheDocument();
    });

    it('renders with empty listings array', () => {
      render(<FeaturedListingsCarousel listings={[]} />);

      const carousel = screen.getByRole('region', { name: /featured venues carousel/i });
      expect(carousel).toBeInTheDocument();

      const cards = screen.queryAllByTestId('venue-card');
      expect(cards).toHaveLength(0);
    });
  });

  describe('Navigation Buttons', () => {
    it('renders previous navigation button', () => {
      render(<FeaturedListingsCarousel listings={mockListings} />);

      const prevButton = screen.getByLabelText('Scroll featured left');
      expect(prevButton).toBeInTheDocument();
    });

    it('renders next navigation button', () => {
      render(<FeaturedListingsCarousel listings={mockListings} />);

      const nextButton = screen.getByLabelText('Scroll featured right');
      expect(nextButton).toBeInTheDocument();
    });

    it('navigation buttons are hidden on mobile', () => {
      render(<FeaturedListingsCarousel listings={mockListings} />);

      const prevButton = screen.getByLabelText('Scroll featured left');
      const nextButton = screen.getByLabelText('Scroll featured right');

      expect(prevButton).toHaveClass('hidden');
      expect(prevButton).toHaveClass('md:flex');
      expect(nextButton).toHaveClass('hidden');
      expect(nextButton).toHaveClass('md:flex');
    });
  });

  describe('Card Priority', () => {
    it('sets priority for first 3 listings', () => {
      render(<FeaturedListingsCarousel listings={mockListings} />);

      const cards = screen.getAllByTestId('venue-card');
      expect(cards[0]).toHaveAttribute('data-priority', 'true');
      expect(cards[1]).toHaveAttribute('data-priority', 'true');
      expect(cards[2]).toHaveAttribute('data-priority', 'true');
    });

    it('does not set priority for listings after the third', () => {
      const manyListings = [
        ...mockListings,
        {
          id: '4',
          slug: 'fourth-listing',
          name: 'Fourth Listing',
          city: { id: 'city-4', name: 'City 4', slug: 'city-4', country: 'Country' },
          imageUrl: '',
          featured: false,
          ecoFocusTags: [],
          amenityNames: [],
        },
      ];

      render(<FeaturedListingsCarousel listings={manyListings} />);

      const cards = screen.getAllByTestId('venue-card');
      expect(cards[3]).toHaveAttribute('data-priority', 'false');
    });
  });

  describe('Card Styling', () => {
    it('applies responsive basis classes to card wrappers', () => {
      const { container } = render(<FeaturedListingsCarousel listings={mockListings} />);

      const cardWrappers = container.querySelectorAll('.shrink-0');
      expect(cardWrappers.length).toBeGreaterThan(0);

      cardWrappers.forEach(wrapper => {
        expect(wrapper).toHaveClass('basis-[85%]');
        expect(wrapper).toHaveClass('sm:basis-[60%]');
        expect(wrapper).toHaveClass('lg:basis-1/3');
      });
    });

    it('applies h-full and w-full classes to VenueCard', () => {
      render(<FeaturedListingsCarousel listings={mockListings} />);

      const cards = screen.getAllByTestId('venue-card');
      cards.forEach(card => {
        expect(card).toHaveClass('h-full');
        expect(card).toHaveClass('w-full');
      });
    });
  });

  describe('Container Styling', () => {
    it('carousel viewport has overflow-hidden', () => {
      render(<FeaturedListingsCarousel listings={mockListings} />);

      const viewport = screen.getByRole('region', { name: /featured venues carousel/i });
      expect(viewport).toHaveClass('overflow-hidden');
    });

    it('cards container uses flex layout with gap', () => {
      const { container } = render(<FeaturedListingsCarousel listings={mockListings} />);

      const cardsContainer = container.querySelector('.flex.gap-6');
      expect(cardsContainer).toBeInTheDocument();
    });

    it('outer container is positioned relatively', () => {
      const { container } = render(<FeaturedListingsCarousel listings={mockListings} />);

      const outerContainer = container.querySelector('.relative');
      expect(outerContainer).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('carousel has proper ARIA role and label', () => {
      render(<FeaturedListingsCarousel listings={mockListings} />);

      const carousel = screen.getByRole('region', { name: 'Featured venues carousel' });
      expect(carousel).toBeInTheDocument();
    });

    it('navigation buttons have descriptive aria-labels', () => {
      render(<FeaturedListingsCarousel listings={mockListings} />);

      expect(screen.getByLabelText('Scroll featured left')).toBeInTheDocument();
      expect(screen.getByLabelText('Scroll featured right')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles single listing', () => {
      render(<FeaturedListingsCarousel listings={[mockListings[0]]} />);

      const cards = screen.getAllByTestId('venue-card');
      expect(cards).toHaveLength(1);
      expect(screen.getByText('Eco Hotel Bangkok')).toBeInTheDocument();
    });

    it('handles many listings', () => {
      const manyListings = Array.from({ length: 20 }, (_, i) => ({
        id: `listing-${i}`,
        slug: `listing-${i}`,
        name: `Listing ${i}`,
        city: { id: `city-${i}`, name: `City ${i}`, slug: `city-${i}`, country: 'Country' },
        imageUrl: '',
        featured: false,
        ecoFocusTags: [],
        amenityNames: [],
      }));

      render(<FeaturedListingsCarousel listings={manyListings} />);

      const cards = screen.getAllByTestId('venue-card');
      expect(cards).toHaveLength(20);
    });

    it('handles listings with missing optional fields', () => {
      const minimalListings: FeaturedListingDTO[] = [
        {
          id: '1',
          slug: 'minimal-listing',
          name: 'Minimal Listing',
          city: null,
          imageUrl: '',
          featured: false,
          ecoFocusTags: [],
          amenityNames: [],
        },
      ];

      render(<FeaturedListingsCarousel listings={minimalListings} />);

      const card = screen.getByTestId('venue-card');
      expect(card).toBeInTheDocument();
    });
  });

  describe('Listing Card Keys', () => {
    it('uses listing id as key for cards', () => {
      const { container } = render(<FeaturedListingsCarousel listings={mockListings} />);

      // React uses keys internally, but we can verify cards are rendered correctly
      const cards = screen.getAllByTestId('venue-card');
      expect(cards[0]).toHaveAttribute('data-venue-id', '1');
      expect(cards[1]).toHaveAttribute('data-venue-id', '2');
      expect(cards[2]).toHaveAttribute('data-venue-id', '3');
    });

    it('handles duplicate ids gracefully', () => {
      const duplicateListings: FeaturedListingDTO[] = [
        { ...mockListings[0], id: 'duplicate-id' },
        { ...mockListings[1], id: 'duplicate-id' },
      ];

      // React will warn about duplicate keys, but should still render
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(<FeaturedListingsCarousel listings={duplicateListings} />);

      const cards = screen.getAllByTestId('venue-card');
      expect(cards).toHaveLength(2);

      consoleError.mockRestore();
    });
  });

  describe('Client Component', () => {
    it('renders as a client component', () => {
      // FeaturedListingsCarousel is marked with 'use client'
      // This is a smoke test to ensure it renders without errors
      const { container } = render(<FeaturedListingsCarousel listings={mockListings} />);

      expect(container.firstChild).toBeInTheDocument();
    });

    it('handles re-renders without errors', () => {
      const { rerender } = render(<FeaturedListingsCarousel listings={mockListings} />);

      expect(() => {
        rerender(<FeaturedListingsCarousel listings={mockListings.slice(0, 2)} />);
      }).not.toThrow();

      const cards = screen.getAllByTestId('venue-card');
      expect(cards).toHaveLength(2);
    });
  });
});
