import { render, screen } from '@testing-library/react';
import type { ListingSummaryDTO } from '@/types/dto';
import { ListingGrid } from '../ListingGrid';

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
    return (
      // eslint-disable-next-line @next/next/no-img-element
      // biome-ignore lint/performance/noImgElement: test-only Next/Image mock
      <img src={src} alt={alt} onError={onError} {...props} />
    );
  };
});

describe('ListingGrid', () => {
  const mockListings: ListingSummaryDTO[] = [
    {
      id: '1',
      slug: 'eco-hotel-bangkok',
      name: 'Eco Hotel Bangkok',
      city: { id: 'bangkok-1', name: 'Bangkok', slug: 'bangkok', country: 'Thailand' },
      imageUrl: 'https://example.com/image1.jpg',
      featured: true,
      ecoFocusTags: ['Solar Power', 'Water Conservation', 'Organic Food'],
      amenityNames: ['Free WiFi', 'Co-working Space'],
    },
    {
      id: '2',
      slug: 'green-cafe-chiang-mai',
      name: 'Green Cafe',
      city: { id: 'cm-1', name: 'Chiang Mai', slug: 'chiang-mai', country: 'Thailand' },
      imageUrl: '',
      featured: false,
      ecoFocusTags: ['Vegan', 'Zero Waste'],
      amenityNames: ['WiFi', 'Outdoor Seating'],
    },
  ];

  describe('Basic Rendering', () => {
    it('renders the grid with listings', () => {
      render(<ListingGrid listings={mockListings} />);

      expect(screen.getByText('Eco Hotel Bangkok')).toBeInTheDocument();
      expect(screen.getByText('Green Cafe')).toBeInTheDocument();
    });

    it('renders NoListingsFound when listings array is empty', () => {
      render(<ListingGrid listings={[]} />);

      expect(screen.getByText(/No listings found/i)).toBeInTheDocument();
    });

    it('renders NoListingsFound when listings is not an array', () => {
      render(<ListingGrid listings={null as any} />);

      expect(screen.getByText(/No listings found/i)).toBeInTheDocument();
    });

    it('renders correct number of listing cards', () => {
      const { container } = render(<ListingGrid listings={mockListings} />);

      const cards = container.querySelectorAll('a[href^="/listings/"]');
      expect(cards).toHaveLength(2);
    });
  });

  describe('Grid Layout', () => {
    it('applies grid layout classes', () => {
      const { container } = render(<ListingGrid listings={mockListings} />);

      const grid = container.firstChild as HTMLElement;
      expect(grid).toHaveClass('grid');
      expect(grid).toHaveClass('grid-cols-1');
      expect(grid).toHaveClass('md:grid-cols-2');
      expect(grid).toHaveClass('lg:grid-cols-3');
      expect(grid).toHaveClass('gap-8');
    });

    it('renders cards in grid format', () => {
      const { container } = render(<ListingGrid listings={mockListings} />);

      const links = container.querySelectorAll('a');
      links.forEach(link => {
        expect(link).toHaveClass('block');
        expect(link).toHaveClass('h-full');
      });
    });
  });

  describe('Listing Cards', () => {
    it('renders clickable links to listing details', () => {
      render(<ListingGrid listings={mockListings} />);

      const ecoHotelLink = screen.getByRole('link', { name: /Eco Hotel Bangkok/i });
      expect(ecoHotelLink).toHaveAttribute('href', '/listings/eco-hotel-bangkok');

      const greenCafeLink = screen.getByRole('link', { name: /Green Cafe/i });
      expect(greenCafeLink).toHaveAttribute('href', '/listings/green-cafe-chiang-mai');
    });

    it('renders listing names', () => {
      render(<ListingGrid listings={mockListings} />);

      expect(screen.getByText('Eco Hotel Bangkok')).toBeInTheDocument();
      expect(screen.getByText('Green Cafe')).toBeInTheDocument();
    });

    it('renders city names', () => {
      render(<ListingGrid listings={mockListings} />);

      expect(screen.getByText('Bangkok')).toBeInTheDocument();
      expect(screen.getByText('Chiang Mai')).toBeInTheDocument();
    });

    it('handles missing city information gracefully', () => {
      const listingsWithoutCity: ListingSummaryDTO[] = [
        {
          id: '3',
          slug: 'nomad-spot',
          name: 'Nomad Spot',
          city: null,
          imageUrl: '',
          featured: false,
          ecoFocusTags: [],
          amenityNames: [],
        },
      ];

      render(<ListingGrid listings={listingsWithoutCity} />);

      expect(screen.getByText('Nomad Spot')).toBeInTheDocument();
      // City should not cause a crash
    });
  });

  describe('Images', () => {
    it('renders placeholder image for all listings', () => {
      const { container } = render(<ListingGrid listings={mockListings} />);

      const placeholders = container.querySelectorAll('img[src="/placeholder_image.png"]');
      expect(placeholders.length).toBeGreaterThanOrEqual(2);
    });

    it('renders listing image when imageUrl is provided', () => {
      const { container } = render(<ListingGrid listings={mockListings} />);

      const listingImages = container.querySelectorAll('img[src="https://example.com/image1.jpg"]');
      expect(listingImages.length).toBeGreaterThan(0);
    });

    it('provides proper alt text for images', () => {
      render(<ListingGrid listings={mockListings} />);

      expect(screen.getAllByAltText('Listing placeholder').length).toBeGreaterThan(0);
      expect(screen.getByAltText('Eco Hotel Bangkok, Bangkok')).toBeInTheDocument();
    });

    it('handles missing city in image alt text', () => {
      const listingsWithoutCity: ListingSummaryDTO[] = [
        {
          ...mockListings[0],
          city: null,
        },
      ];

      render(<ListingGrid listings={listingsWithoutCity} />);

      // When city is null, the alt text should still work (may be empty string for city part)
      const images = screen.getAllByAltText(/Eco Hotel Bangkok/);
      expect(images.length).toBeGreaterThan(0);
    });

    it('hides remote image on error', () => {
      const { container } = render(<ListingGrid listings={mockListings} />);

      const remoteImage = container.querySelector('img[src="https://example.com/image1.jpg"]');
      expect(remoteImage).toBeInTheDocument();

      // Trigger error handler
      if (remoteImage) {
        const errorEvent = new Event('error');
        remoteImage.dispatchEvent(errorEvent);
        expect(remoteImage).toHaveAttribute('hidden');
      }
    });
  });

  describe('Featured Badge', () => {
    it('displays featured badge for featured listings', () => {
      render(<ListingGrid listings={mockListings} />);

      expect(screen.getByText('Featured')).toBeInTheDocument();
    });

    it('does not display featured badge for non-featured listings', () => {
      render(<ListingGrid listings={[mockListings[1]]} />);

      expect(screen.queryByText('Featured')).not.toBeInTheDocument();
    });

    it('displays star icon in featured badge', () => {
      const { container } = render(<ListingGrid listings={mockListings} />);

      const featuredBadge = screen.getByText('Featured').closest('div');
      expect(featuredBadge).toContainHTML('svg');
    });

    it('applies correct styling to featured badge', () => {
      render(<ListingGrid listings={mockListings} />);

      const badge = screen.getByText('Featured').parentElement;
      expect(badge).toHaveClass('bg-yellow-400');
      expect(badge).toHaveClass('text-black');
      expect(badge).toHaveClass('rounded-full');
    });
  });

  describe('Eco Focus Tags', () => {
    it('renders eco focus tags when available', () => {
      render(<ListingGrid listings={mockListings} />);

      expect(screen.getByText('Solar Power')).toBeInTheDocument();
      expect(screen.getByText('Water Conservation')).toBeInTheDocument();
      expect(screen.getByText('Organic Food')).toBeInTheDocument();
    });

    it('limits eco focus tags to 3', () => {
      const listingWithManyTags: ListingSummaryDTO[] = [
        {
          ...mockListings[0],
          ecoFocusTags: ['Tag1', 'Tag2', 'Tag3', 'Tag4', 'Tag5'],
        },
      ];

      render(<ListingGrid listings={listingWithManyTags} />);

      expect(screen.getByText('Tag1')).toBeInTheDocument();
      expect(screen.getByText('Tag2')).toBeInTheDocument();
      expect(screen.getByText('Tag3')).toBeInTheDocument();
      expect(screen.getByText('+2 more')).toBeInTheDocument();
    });

    it('applies color coding to eco tags', () => {
      render(<ListingGrid listings={mockListings} />);

      const solarTag = screen.getByText('Solar Power');
      expect(solarTag).toHaveClass('bg-emerald-100');
      expect(solarTag).toHaveClass('text-emerald-700');

      const waterTag = screen.getByText('Water Conservation');
      expect(waterTag).toHaveClass('bg-cyan-100');
      expect(waterTag).toHaveClass('text-cyan-700');

      const veganTag = screen.getByText('Vegan');
      expect(veganTag).toHaveClass('bg-teal-100');
      expect(veganTag).toHaveClass('text-teal-700');
    });

    it('does not render eco tags section when empty', () => {
      const listingWithoutTags: ListingSummaryDTO[] = [
        {
          ...mockListings[0],
          ecoFocusTags: [],
          amenityNames: [],
        },
      ];

      const { container } = render(<ListingGrid listings={listingWithoutTags} />);

      // Should not have the tags container
      const card = container.querySelector('a[href="/listings/eco-hotel-bangkok"]');
      const cardContent = card?.querySelector('.mt-auto');
      expect(cardContent).not.toBeInTheDocument();
    });
  });

  describe('Amenity Tags', () => {
    it('renders amenity tags when available', () => {
      render(<ListingGrid listings={mockListings} />);

      expect(screen.getByText('Free WiFi')).toBeInTheDocument();
      expect(screen.getByText('Co-working Space')).toBeInTheDocument();
    });

    it('limits amenity tags to 3', () => {
      const listingWithManyAmenities: ListingSummaryDTO[] = [
        {
          ...mockListings[0],
          ecoFocusTags: [],
          amenityNames: ['WiFi', 'Kitchen', 'Gym', 'Pool', 'Parking'],
        },
      ];

      render(<ListingGrid listings={listingWithManyAmenities} />);

      expect(screen.getByText('WiFi')).toBeInTheDocument();
      expect(screen.getByText('Kitchen')).toBeInTheDocument();
      expect(screen.getByText('Gym')).toBeInTheDocument();
      expect(screen.getByText('+2 more')).toBeInTheDocument();
    });

    it('applies color coding to amenity tags', () => {
      render(<ListingGrid listings={mockListings} />);

      const wifiTag = screen.getByText('Free WiFi');
      expect(wifiTag).toHaveClass('bg-blue-100');
      expect(wifiTag).toHaveClass('text-blue-700');

      // 'Co-working Space' doesn't match meeting/conference pattern, so gets default blue color
      const coworkingTag = screen.getByText('Co-working Space');
      expect(coworkingTag).toHaveClass('bg-blue-100');
      expect(coworkingTag).toHaveClass('text-blue-700');
    });

    it('handles amenity names case-insensitively for color coding', () => {
      const listingWithVariedCase: ListingSummaryDTO[] = [
        {
          ...mockListings[0],
          ecoFocusTags: [],
          amenityNames: ['WIFI', 'WiFi', 'wifi'],
        },
      ];

      render(<ListingGrid listings={listingWithVariedCase} />);

      const tags = screen.getAllByText(/wifi/i);
      tags.forEach(tag => {
        expect(tag).toHaveClass('bg-blue-100');
        expect(tag).toHaveClass('text-blue-700');
      });
    });
  });

  describe('Tag Color Logic', () => {
    it('applies correct colors for solar/renewable energy tags', () => {
      const listing: ListingSummaryDTO[] = [
        {
          ...mockListings[0],
          ecoFocusTags: ['Solar Panels', 'Renewable Energy'],
        },
      ];

      render(<ListingGrid listings={listing} />);

      const solarTag = screen.getByText('Solar Panels');
      expect(solarTag).toHaveClass('bg-emerald-100');
    });

    it('applies correct colors for waste management tags', () => {
      const listing: ListingSummaryDTO[] = [
        {
          ...mockListings[0],
          ecoFocusTags: ['Zero Waste', 'Recycling Program'],
        },
      ];

      render(<ListingGrid listings={listing} />);

      const zeroWasteTag = screen.getByText('Zero Waste');
      expect(zeroWasteTag).toHaveClass('bg-lime-100');
    });

    it('applies correct colors for water conservation tags', () => {
      const listing: ListingSummaryDTO[] = [
        {
          ...mockListings[0],
          ecoFocusTags: ['Water Conservation System'],
        },
      ];

      render(<ListingGrid listings={listing} />);

      const waterTag = screen.getByText('Water Conservation System');
      expect(waterTag).toHaveClass('bg-cyan-100');
    });

    it('applies correct colors for food-related tags', () => {
      const listing: ListingSummaryDTO[] = [
        {
          ...mockListings[0],
          ecoFocusTags: ['Vegan Options', 'Organic Produce'],
        },
      ];

      render(<ListingGrid listings={listing} />);

      const veganTag = screen.getByText('Vegan Options');
      expect(veganTag).toHaveClass('bg-teal-100');

      const organicTag = screen.getByText('Organic Produce');
      expect(organicTag).toHaveClass('bg-teal-100');
    });

    it('applies correct colors for garden/bike/green tags', () => {
      const listing: ListingSummaryDTO[] = [
        {
          ...mockListings[0],
          ecoFocusTags: ['Garden', 'Bike Friendly', 'Green Building'],
        },
      ];

      render(<ListingGrid listings={listing} />);

      const gardenTag = screen.getByText('Garden');
      expect(gardenTag).toHaveClass('bg-green-100');
    });

    it('applies default emerald color for unmatched eco tags', () => {
      const listing: ListingSummaryDTO[] = [
        {
          ...mockListings[0],
          ecoFocusTags: ['Sustainable Materials'],
        },
      ];

      render(<ListingGrid listings={listing} />);

      const tag = screen.getByText('Sustainable Materials');
      expect(tag).toHaveClass('bg-emerald-100');
    });

    it('applies correct colors for internet amenities', () => {
      const listing: ListingSummaryDTO[] = [
        {
          ...mockListings[0],
          ecoFocusTags: [],
          amenityNames: ['High-speed Internet'],
        },
      ];

      render(<ListingGrid listings={listing} />);

      const tag = screen.getByText('High-speed Internet');
      expect(tag).toHaveClass('bg-blue-100');
    });

    it('applies correct colors for meeting/conference amenities', () => {
      const listing: ListingSummaryDTO[] = [
        {
          ...mockListings[0],
          ecoFocusTags: [],
          amenityNames: ['Meeting Room', 'Conference Call Facilities'],
        },
      ];

      render(<ListingGrid listings={listing} />);

      const meetingTag = screen.getByText('Meeting Room');
      expect(meetingTag).toHaveClass('bg-indigo-100');
    });

    it('applies correct colors for 24/7 access amenities', () => {
      const listing: ListingSummaryDTO[] = [
        {
          ...mockListings[0],
          ecoFocusTags: [],
          amenityNames: ['24/7 Access', '24-7 Security'],
        },
      ];

      render(<ListingGrid listings={listing} />);

      const accessTag = screen.getByText('24/7 Access');
      expect(accessTag).toHaveClass('bg-purple-100');
    });

    it('applies correct colors for food/kitchen amenities', () => {
      const listing: ListingSummaryDTO[] = [
        {
          ...mockListings[0],
          ecoFocusTags: [],
          amenityNames: ['Kitchen', 'Restaurant', 'Cafe'],
        },
      ];

      render(<ListingGrid listings={listing} />);

      const kitchenTag = screen.getByText('Kitchen');
      expect(kitchenTag).toHaveClass('bg-amber-100');
    });

    it('applies correct colors for security amenities', () => {
      const listing: ListingSummaryDTO[] = [
        {
          ...mockListings[0],
          ecoFocusTags: [],
          amenityNames: ['Security', 'Lockers', 'Safe'],
        },
      ];

      render(<ListingGrid listings={listing} />);

      const securityTag = screen.getByText('Security');
      expect(securityTag).toHaveClass('bg-orange-100');
    });

    it('applies correct colors for bike/parking amenities', () => {
      const listing: ListingSummaryDTO[] = [
        {
          ...mockListings[0],
          ecoFocusTags: [],
          amenityNames: ['Bike Storage', 'Parking'],
        },
      ];

      render(<ListingGrid listings={listing} />);

      const bikeTag = screen.getByText('Bike Storage');
      expect(bikeTag).toHaveClass('bg-sky-100');
    });

    it('applies correct colors for garden/outdoor amenities', () => {
      const listing: ListingSummaryDTO[] = [
        {
          ...mockListings[0],
          ecoFocusTags: [],
          amenityNames: ['Garden', 'Terrace', 'Rooftop'],
        },
      ];

      render(<ListingGrid listings={listing} />);

      const gardenTag = screen.getByText('Garden');
      expect(gardenTag).toHaveClass('bg-green-100');
    });

    it('applies default blue color for unmatched amenity tags', () => {
      const listing: ListingSummaryDTO[] = [
        {
          ...mockListings[0],
          ecoFocusTags: [],
          amenityNames: ['Unknown Amenity'],
        },
      ];

      render(<ListingGrid listings={listing} />);

      const tag = screen.getByText('Unknown Amenity');
      expect(tag).toHaveClass('bg-blue-100');
    });
  });

  describe('Card Styling and Hover Effects', () => {
    it('applies NeoCard variant', () => {
      const { container } = render(<ListingGrid listings={mockListings} />);

      const cards = container.querySelectorAll('.group');
      expect(cards.length).toBeGreaterThan(0);
    });

    it('applies hover transition classes', () => {
      const { container } = render(<ListingGrid listings={mockListings} />);

      const cards = container.querySelectorAll('.group');
      cards.forEach(card => {
        expect(card).toHaveClass('transition-all');
        expect(card).toHaveClass('duration-300');
      });
    });

    it('applies cursor pointer to cards', () => {
      const { container } = render(<ListingGrid listings={mockListings} />);

      const cards = container.querySelectorAll('.group');
      cards.forEach(card => {
        expect(card).toHaveClass('cursor-pointer');
      });
    });

    it('applies h-full for proper layout', () => {
      const { container } = render(<ListingGrid listings={mockListings} />);

      const cards = container.querySelectorAll('.group');
      cards.forEach(card => {
        expect(card).toHaveClass('h-full');
      });
    });
  });

  describe('Image Container Styling', () => {
    it('applies correct dimensions to image container', () => {
      const { container } = render(<ListingGrid listings={mockListings} />);

      const imageContainers = container.querySelectorAll('.relative.h-48');
      expect(imageContainers.length).toBeGreaterThan(0);
    });

    it('applies rounded corners to image container', () => {
      const { container } = render(<ListingGrid listings={mockListings} />);

      const imageContainers = container.querySelectorAll('.rounded-lg');
      expect(imageContainers.length).toBeGreaterThan(0);
    });

    it('applies overflow hidden to image container', () => {
      const { container } = render(<ListingGrid listings={mockListings} />);

      const imageContainers = container.querySelectorAll('.overflow-hidden');
      expect(imageContainers.length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility', () => {
    it('provides semantic link elements', () => {
      render(<ListingGrid listings={mockListings} />);

      const links = screen.getAllByRole('link');
      expect(links.length).toBe(2);
    });

    it('has accessible names for links', () => {
      render(<ListingGrid listings={mockListings} />);

      expect(screen.getByRole('link', { name: /Eco Hotel Bangkok/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Green Cafe/i })).toBeInTheDocument();
    });

    it('provides meaningful alt text for images', () => {
      render(<ListingGrid listings={mockListings} />);

      expect(screen.getByAltText('Eco Hotel Bangkok, Bangkok')).toBeInTheDocument();
    });

    it('includes aria-hidden for decorative star icon', () => {
      const { container } = render(<ListingGrid listings={mockListings} />);

      const featuredBadge = screen.getByText('Featured').closest('div');
      const starIcon = featuredBadge?.querySelector('svg');
      expect(starIcon).toHaveAttribute('aria-hidden');
    });
  });

  describe('Edge Cases', () => {
    it('handles listing with no tags or amenities', () => {
      const minimalListing: ListingSummaryDTO[] = [
        {
          id: '1',
          slug: 'minimal-listing',
          name: 'Minimal Listing',
          city: { id: '1', name: 'Bangkok', slug: 'bangkok', country: 'Thailand' },
          imageUrl: '',
          featured: false,
          ecoFocusTags: [],
          amenityNames: [],
        },
      ];

      render(<ListingGrid listings={minimalListing} />);

      expect(screen.getByText('Minimal Listing')).toBeInTheDocument();
    });

    it('handles listing with null values', () => {
      const listingWithNulls: ListingSummaryDTO[] = [
        {
          id: '1',
          slug: 'null-listing',
          name: 'Null Listing',
          city: null,
          imageUrl: '',
          featured: false,
          ecoFocusTags: [],
          amenityNames: [],
        },
      ];

      render(<ListingGrid listings={listingWithNulls} />);

      expect(screen.getByText('Null Listing')).toBeInTheDocument();
    });

    it('handles large number of listings', () => {
      const manyListings: ListingSummaryDTO[] = Array.from({ length: 50 }, (_, i) => ({
        id: `listing-${i}`,
        slug: `listing-${i}`,
        name: `Listing ${i}`,
        city: { id: `city-${i}`, name: `City ${i}`, slug: `city-${i}`, country: 'Country' },
        imageUrl: '',
        featured: i % 5 === 0,
        ecoFocusTags: ['Tag1', 'Tag2'],
        amenityNames: ['Amenity1'],
      }));

      const { container } = render(<ListingGrid listings={manyListings} />);

      const cards = container.querySelectorAll('a[href^="/listings/"]');
      expect(cards).toHaveLength(50);
    });

    it('handles listing with very long name', () => {
      const longNameListing: ListingSummaryDTO[] = [
        {
          ...mockListings[0],
          name: 'A'.repeat(200),
        },
      ];

      render(<ListingGrid listings={longNameListing} />);

      expect(screen.getByText('A'.repeat(200))).toBeInTheDocument();
    });

    it('handles listing with special characters in name', () => {
      const specialCharListing: ListingSummaryDTO[] = [
        {
          ...mockListings[0],
          name: 'Café & Restaurant "The Green" <Special>',
        },
      ];

      render(<ListingGrid listings={specialCharListing} />);

      expect(screen.getByText('Café & Restaurant "The Green" <Special>')).toBeInTheDocument();
    });
  });

  describe('Content Section Rendering', () => {
    it('renders content section only when tags or amenities exist', () => {
      render(<ListingGrid listings={mockListings} />);

      const cards = screen.getAllByRole('link');
      cards.forEach((card, index) => {
        // Should have either eco tags or amenities from the mock data
        const listing = mockListings[index];
        const hasEcoTags = listing.ecoFocusTags.length > 0;
        const hasAmenities = listing.amenityNames.length > 0;

        if (hasEcoTags || hasAmenities) {
          // Check that at least one tag/amenity is present in the card text
          const hasContent =
            listing.ecoFocusTags.some(tag => card.textContent?.includes(tag)) ||
            listing.amenityNames.some(amenity => card.textContent?.includes(amenity));
          expect(hasContent).toBeTruthy();
        }
      });
    });

    it('does not render content section when both tags and amenities are empty', () => {
      const emptyTagsListing: ListingSummaryDTO[] = [
        {
          ...mockListings[0],
          ecoFocusTags: [],
          amenityNames: [],
        },
      ];

      const { container } = render(<ListingGrid listings={emptyTagsListing} />);

      const card = container.querySelector('a[href="/listings/eco-hotel-bangkok"]');
      const cardContent = card?.querySelector('.mt-auto');
      expect(cardContent).not.toBeInTheDocument();
    });

    it('renders eco tags section when eco tags exist', () => {
      const onlyEcoTags: ListingSummaryDTO[] = [
        {
          ...mockListings[0],
          amenityNames: [],
        },
      ];

      render(<ListingGrid listings={onlyEcoTags} />);

      expect(screen.getByText('Solar Power')).toBeInTheDocument();
    });

    it('renders amenities section when amenities exist', () => {
      const onlyAmenities: ListingSummaryDTO[] = [
        {
          ...mockListings[0],
          ecoFocusTags: [],
          amenityNames: ['WiFi', 'Kitchen'],
        },
      ];

      render(<ListingGrid listings={onlyAmenities} />);

      expect(screen.getByText('WiFi')).toBeInTheDocument();
      expect(screen.getByText('Kitchen')).toBeInTheDocument();
    });
  });
});
