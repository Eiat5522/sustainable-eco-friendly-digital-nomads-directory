import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ListingDetailDTO } from '@/types/dto';
import { ListingDetailsCard } from '../ListingDetailsCard';

// Mock dynamic imports
jest.mock('next/dynamic', () => () => {
  const MockInteractiveMap = ({
    location,
    address,
    name,
  }: {
    location?: { lat: number; lng: number };
    address?: string;
    name?: string;
  }) => (
    <div data-testid="interactive-map">
      <span>{name}</span>
      <span>{address}</span>
      <span>
        {location?.lat},{location?.lng}
      </span>
    </div>
  );
  return MockInteractiveMap;
});

describe('ListingDetailsCard', () => {
  const baseListing = {
    id: '1',
    name: 'Eco Hotel Bangkok',
    slug: 'eco-hotel-bangkok',
    city: { id: 'bangkok-1', name: 'Bangkok', slug: 'bangkok', country: 'Thailand' },
    galleryImages: [],
    longDescription: 'A beautiful eco-friendly hotel in the heart of Bangkok.',
    address: '123 Green Street, Bangkok, Thailand',
    contactPhone: '+66 123 4567',
    contactEmail: 'info@ecohotel.com',
    website: 'https://ecohotel.com',
    location: { lat: 13.7563, lng: 100.5018 },
    amenities: [
      { id: 'wifi', name: 'Free WiFi' },
      { id: 'pool', name: 'Swimming Pool' },
    ],
    ecoFocusTags: ['Solar Power', 'Water Conservation'],
    digitalNomadFeatures: ['High-speed Internet', 'Co-working Space'],
  };

  const accommodationListing: ListingDetailDTO = {
    ...baseListing,
    type: 'accommodation',
    accommodationDetails: {
      accommodationType: 'Hotel',
      pricePerNight: { amount: 1500, currency: 'THB', unit: 'night' },
      roomTypes: ['Single', 'Double', 'Suite'],
      minimumStay: 2,
    },
  };

  const coworkingListing: ListingDetailDTO = {
    ...baseListing,
    type: 'coworking',
    coworkingDetails: {
      pricingPlans: [
        {
          type: 'daily',
          price: { amount: 300, currency: 'THB', unit: 'day' },
          period: 'day',
          features: ['Desk Space', 'WiFi'],
        },
        {
          type: 'monthly',
          price: { amount: 5000, currency: 'THB', unit: 'month' },
          period: 'month',
          features: ['Dedicated Desk', 'Meeting Room Access'],
        },
      ],
      internetSpeed: { download: 100, upload: 50 },
    },
  };

  const cafeListing: ListingDetailDTO = {
    ...baseListing,
    type: 'cafe',
    cafeDetails: {
      priceIndication: '$$',
      noiseLevel: 'moderate',
      menuHighlights: ['Espresso', 'Croissant', 'Salad'],
    },
  };

  const restaurantListing: ListingDetailDTO = {
    ...baseListing,
    type: 'restaurant',
    restaurantDetails: {
      cuisineType: ['Thai', 'Vegan'],
      dietaryOptions: ['Gluten-Free'],
      averageMealPrice: { amount: 250, currency: 'THB', unit: 'meal' },
    },
  };

  const activitiesListing: ListingDetailDTO = {
    ...baseListing,
    type: 'activities',
    activityDetails: {
      activityType: 'Guided Hike',
      duration: '4 hours',
      skillLevel: 'Intermediate',
      languages: ['English', 'Thai'],
    },
  };

  describe('Basic Rendering', () => {
    it('renders the component', () => {
      const { container } = render(<ListingDetailsCard listing={accommodationListing} />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders "About This Place" heading', () => {
      render(<ListingDetailsCard listing={accommodationListing} />);
      expect(screen.getByText('About This Place')).toBeInTheDocument();
    });

    it('renders long description', () => {
      render(<ListingDetailsCard listing={accommodationListing} />);
      expect(
        screen.getByText('A beautiful eco-friendly hotel in the heart of Bangkok.')
      ).toBeInTheDocument();
    });

    it('does not render description section when longDescription is missing', () => {
      const listingWithoutDesc = {
        ...accommodationListing,
        longDescription: undefined,
      };

      render(<ListingDetailsCard listing={listingWithoutDesc as unknown as ListingDetailDTO} />);
      expect(screen.queryByText('A beautiful eco-friendly hotel')).not.toBeInTheDocument();
    });
  });

  describe('Description Truncation', () => {
    it('truncates long descriptions', () => {
      const longDesc = 'A'.repeat(300);
      const listingWithLongDesc = {
        ...accommodationListing,
        longDescription: longDesc,
      };

      render(<ListingDetailsCard listing={listingWithLongDesc} />);

      const descElement = screen.getByTestId('long-description');
      expect(descElement).toHaveClass('max-h-32');
      expect(descElement).toHaveAttribute('data-expanded', 'false');
    });

    it('does not truncate short descriptions', () => {
      const shortDesc = 'Short description.';
      const listingWithShortDesc = {
        ...accommodationListing,
        longDescription: shortDesc,
      };

      render(<ListingDetailsCard listing={listingWithShortDesc} />);

      const descElement = screen.getByTestId('long-description');
      expect(descElement).not.toHaveClass('max-h-32');
      expect(descElement).toHaveClass('max-h-none');
    });

    it('shows "Read more" button for long descriptions', () => {
      const longDesc = 'A'.repeat(300);
      const listingWithLongDesc = {
        ...accommodationListing,
        longDescription: longDesc,
      };

      render(<ListingDetailsCard listing={listingWithLongDesc} />);

      expect(screen.getByTestId('read-more-button')).toBeInTheDocument();
      expect(screen.getByText('Read more')).toBeInTheDocument();
    });

    it('does not show "Read more" button for short descriptions', () => {
      const shortDesc = 'Short description.';
      const listingWithShortDesc = {
        ...accommodationListing,
        longDescription: shortDesc,
      };

      render(<ListingDetailsCard listing={listingWithShortDesc} />);

      expect(screen.queryByTestId('read-more-button')).not.toBeInTheDocument();
    });

    it('expands description when "Read more" is clicked', async () => {
      const longDesc = 'A'.repeat(300);
      const listingWithLongDesc = {
        ...accommodationListing,
        longDescription: longDesc,
      };

      render(<ListingDetailsCard listing={listingWithLongDesc} />);

      const button = screen.getByTestId('read-more-button');
      await userEvent.click(button);

      await waitFor(() => {
        const descElement = screen.getByTestId('long-description');
        expect(descElement).toHaveAttribute('data-expanded', 'true');
        expect(descElement).toHaveClass('max-h-none');
        expect(screen.getByText('Read less')).toBeInTheDocument();
      });
    });

    it('collapses description when "Read less" is clicked', async () => {
      const longDesc = 'A'.repeat(300);
      const listingWithLongDesc = {
        ...accommodationListing,
        longDescription: longDesc,
      };

      render(<ListingDetailsCard listing={listingWithLongDesc} />);

      const button = screen.getByTestId('read-more-button');

      // Expand
      await userEvent.click(button);
      await waitFor(() => {
        expect(screen.getByText('Read less')).toBeInTheDocument();
      });

      // Collapse
      await userEvent.click(button);
      await waitFor(() => {
        const descElement = screen.getByTestId('long-description');
        expect(descElement).toHaveAttribute('data-expanded', 'false');
        expect(screen.getByText('Read more')).toBeInTheDocument();
      });
    });

    it('shows gradient overlay when description is truncated', () => {
      const longDesc = 'A'.repeat(300);
      const listingWithLongDesc = {
        ...accommodationListing,
        longDescription: longDesc,
      };

      const { container } = render(<ListingDetailsCard listing={listingWithLongDesc} />);

      const gradient = container.querySelector('.bg-gradient-to-t');
      expect(gradient).toBeInTheDocument();
      expect(gradient).toHaveClass('pointer-events-none');
    });

    it('hides gradient overlay when description is expanded', async () => {
      const longDesc = 'A'.repeat(300);
      const listingWithLongDesc = {
        ...accommodationListing,
        longDescription: longDesc,
      };

      const { container } = render(<ListingDetailsCard listing={listingWithLongDesc} />);

      const button = screen.getByTestId('read-more-button');
      await userEvent.click(button);

      await waitFor(() => {
        const gradient = container.querySelector('.bg-gradient-to-t');
        expect(gradient).not.toBeInTheDocument();
      });
    });
  });

  describe('Amenities Section', () => {
    it('renders amenities section when amenities exist', () => {
      render(<ListingDetailsCard listing={accommodationListing} />);

      expect(screen.getByText('Amenities')).toBeInTheDocument();
      expect(screen.getByText('Free WiFi')).toBeInTheDocument();
      expect(screen.getByText('Swimming Pool')).toBeInTheDocument();
    });

    it('does not render amenities section when no amenities', () => {
      const listingWithoutAmenities = {
        ...accommodationListing,
        amenities: [],
      };

      render(<ListingDetailsCard listing={listingWithoutAmenities} />);

      expect(screen.queryByText('Amenities')).not.toBeInTheDocument();
    });

    it('styles amenity tags correctly', () => {
      render(<ListingDetailsCard listing={accommodationListing} />);

      const wifiTag = screen.getByText('Free WiFi');
      expect(wifiTag).toHaveClass('bg-neo-success/20');
      expect(wifiTag).toHaveClass('text-neo-success');
    });
  });

  describe('Eco Focus Tags', () => {
    it('renders eco focus tags section', () => {
      render(<ListingDetailsCard listing={accommodationListing} />);

      expect(screen.getByText('Sustainability Features')).toBeInTheDocument();
      expect(screen.getByText('Solar Power')).toBeInTheDocument();
      expect(screen.getByText('Water Conservation')).toBeInTheDocument();
    });

    it('does not render eco section when no tags', () => {
      const listingWithoutEcoTags = {
        ...accommodationListing,
        ecoFocusTags: [],
      };

      render(<ListingDetailsCard listing={listingWithoutEcoTags} />);

      expect(screen.queryByText('Sustainability Features')).not.toBeInTheDocument();
    });

    it('styles eco tags correctly', () => {
      render(<ListingDetailsCard listing={accommodationListing} />);

      const solarTag = screen.getByText('Solar Power');
      expect(solarTag).toHaveClass('bg-green-100');
      expect(solarTag).toHaveClass('text-green-700');
    });
  });

  describe('Digital Nomad Features', () => {
    it('renders digital nomad features section', () => {
      render(<ListingDetailsCard listing={accommodationListing} />);

      expect(screen.getByText('Digital Nomad Features')).toBeInTheDocument();
      expect(screen.getByText('High-speed Internet')).toBeInTheDocument();
      expect(screen.getByText('Co-working Space')).toBeInTheDocument();
    });

    it('does not render section when no features', () => {
      const listingWithoutFeatures = {
        ...accommodationListing,
        digitalNomadFeatures: [],
      };

      render(<ListingDetailsCard listing={listingWithoutFeatures} />);

      expect(screen.queryByText('Digital Nomad Features')).not.toBeInTheDocument();
    });

    it('styles features correctly', () => {
      render(<ListingDetailsCard listing={accommodationListing} />);

      const internetTag = screen.getByText('High-speed Internet');
      expect(internetTag).toHaveClass('bg-blue-100');
      expect(internetTag).toHaveClass('text-blue-700');
    });
  });

  describe('Accommodation Details', () => {
    it('renders accommodation details section', () => {
      render(<ListingDetailsCard listing={accommodationListing} />);

      expect(screen.getByText('Accommodation Details')).toBeInTheDocument();
    });

    it('renders accommodation type', () => {
      render(<ListingDetailsCard listing={accommodationListing} />);

      expect(screen.getByText('Type:')).toBeInTheDocument();
      expect(screen.getByText('Hotel')).toBeInTheDocument();
    });

    it('renders price per night', () => {
      render(<ListingDetailsCard listing={accommodationListing} />);

      expect(screen.getByText('Price per night:')).toBeInTheDocument();
      // The formatPrice function uses Intl.NumberFormat with currency style
      // which formats as "THB 1,500" or similar depending on locale
      expect(screen.getByText(/1,?500/i)).toBeInTheDocument();
    });

    it('renders room types', () => {
      render(<ListingDetailsCard listing={accommodationListing} />);

      expect(screen.getByText('Room Types:')).toBeInTheDocument();
      expect(screen.getByText('Single')).toBeInTheDocument();
      expect(screen.getByText('Double')).toBeInTheDocument();
      expect(screen.getByText('Suite')).toBeInTheDocument();
    });

    it('renders minimum stay', () => {
      render(<ListingDetailsCard listing={accommodationListing} />);

      expect(screen.getByText('Minimum stay:')).toBeInTheDocument();
      expect(screen.getByText(/2 nights/i)).toBeInTheDocument();
    });

    it('handles minimum stay of 1 night correctly', () => {
      const listing = {
        ...accommodationListing,
        accommodationDetails: {
          ...accommodationListing.accommodationDetails!,
          minimumStay: 1,
        },
      };

      render(<ListingDetailsCard listing={listing} />);

      expect(screen.getByText(/1 night$/i)).toBeInTheDocument();
    });

    it('does not render accommodation details when missing', () => {
      const listing = {
        ...accommodationListing,
        accommodationDetails: undefined,
      };

      render(<ListingDetailsCard listing={listing as unknown as ListingDetailDTO} />);

      expect(screen.queryByText('Accommodation Details')).not.toBeInTheDocument();
    });
  });

  describe('Coworking Details', () => {
    it('renders coworking details section', () => {
      render(<ListingDetailsCard listing={coworkingListing} />);

      expect(screen.getByText('Coworking Details')).toBeInTheDocument();
    });

    it('renders pricing plans', () => {
      render(<ListingDetailsCard listing={coworkingListing} />);

      expect(screen.getByText('Pricing Plans:')).toBeInTheDocument();
      expect(screen.getByText('daily')).toBeInTheDocument();
      expect(screen.getByText('monthly')).toBeInTheDocument();
    });

    it('renders plan prices', () => {
      render(<ListingDetailsCard listing={coworkingListing} />);

      // Match numbers with optional comma formatting
      expect(screen.getByText(/300/i)).toBeInTheDocument();
      expect(screen.getByText(/5,?000/i)).toBeInTheDocument();
    });

    it('renders plan features', () => {
      render(<ListingDetailsCard listing={coworkingListing} />);

      expect(screen.getByText(/Desk Space/i)).toBeInTheDocument();
      // WiFi appears in multiple places (amenities and plan features), use getAllByText
      expect(screen.getAllByText(/WiFi/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/Dedicated Desk/i)).toBeInTheDocument();
      expect(screen.getByText(/Meeting Room Access/i)).toBeInTheDocument();
    });

    it('renders internet speed', () => {
      render(<ListingDetailsCard listing={coworkingListing} />);

      expect(screen.getByText('Internet Speed:')).toBeInTheDocument();
      expect(screen.getByText(/100Mbps down \/ 50Mbps up/i)).toBeInTheDocument();
    });

    it('does not render coworking details when missing', () => {
      const listing = {
        ...coworkingListing,
        coworkingDetails: undefined,
      };

      render(<ListingDetailsCard listing={listing as unknown as ListingDetailDTO} />);

      expect(screen.queryByText('Coworking Details')).not.toBeInTheDocument();
    });
  });

  describe('Cafe Details', () => {
    it('renders cafe details section', () => {
      render(<ListingDetailsCard listing={cafeListing} />);

      expect(screen.getByText('Cafe Details')).toBeInTheDocument();
    });

    it('renders price indication', () => {
      render(<ListingDetailsCard listing={cafeListing} />);

      expect(screen.getByText('Price Range:')).toBeInTheDocument();
      expect(screen.getByText('$$')).toBeInTheDocument();
    });

    it('renders noise level', () => {
      render(<ListingDetailsCard listing={cafeListing} />);

      expect(screen.getByText('Noise Level:')).toBeInTheDocument();
      expect(screen.getByText('moderate')).toBeInTheDocument();
    });

    it('renders menu highlights', () => {
      render(<ListingDetailsCard listing={cafeListing} />);

      expect(screen.getByText('Menu Highlights:')).toBeInTheDocument();
      expect(screen.getByText('Espresso')).toBeInTheDocument();
      expect(screen.getByText('Croissant')).toBeInTheDocument();
      expect(screen.getByText('Salad')).toBeInTheDocument();
    });

    it('formats noise level correctly', () => {
      const listing = {
        ...cafeListing,
        cafeDetails: {
          ...cafeListing.cafeDetails!,
          noiseLevel: 'very_quiet' as const,
        },
      };

      render(<ListingDetailsCard listing={listing} />);

      expect(screen.getByText('very quiet')).toBeInTheDocument();
    });

    it('does not render cafe details when missing', () => {
      const listing = {
        ...cafeListing,
        cafeDetails: undefined,
      };

      render(<ListingDetailsCard listing={listing as unknown as ListingDetailDTO} />);

      expect(screen.queryByText('Cafe Details')).not.toBeInTheDocument();
    });
  });

  describe('Restaurant Details', () => {
    it('renders restaurant details when present', () => {
      render(<ListingDetailsCard listing={restaurantListing} />);

      expect(screen.getByText('Restaurant Details')).toBeInTheDocument();
      expect(screen.getByText('Cuisine Types:')).toBeInTheDocument();
      expect(screen.getByText('Thai')).toBeInTheDocument();
      expect(screen.getByText('Gluten-Free')).toBeInTheDocument();
    });

    it('does not render restaurant details when missing', () => {
      const listing = {
        ...restaurantListing,
        restaurantDetails: undefined,
      };

      render(<ListingDetailsCard listing={listing as unknown as ListingDetailDTO} />);

      expect(screen.queryByText('Restaurant Details')).not.toBeInTheDocument();
    });
  });

  describe('Activity Details', () => {
    it('renders activity details when present', () => {
      render(<ListingDetailsCard listing={activitiesListing} />);

      expect(screen.getByText('Activity Details')).toBeInTheDocument();
      expect(screen.getByText('Activity Type:')).toBeInTheDocument();
      expect(screen.getByText('Guided Hike')).toBeInTheDocument();
      expect(screen.getByText('4 hours')).toBeInTheDocument();
    });

    it('does not render activity details when missing', () => {
      const listing = {
        ...activitiesListing,
        activityDetails: undefined,
      };

      render(<ListingDetailsCard listing={listing as unknown as ListingDetailDTO} />);

      expect(screen.queryByText('Activity Details')).not.toBeInTheDocument();
    });
  });

  describe('Contact Information', () => {
    it('renders contact information section', () => {
      render(<ListingDetailsCard listing={accommodationListing} />);

      expect(screen.getByText('Contact Information')).toBeInTheDocument();
    });

    it('renders address', () => {
      render(<ListingDetailsCard listing={accommodationListing} />);

      expect(screen.getByText('Address')).toBeInTheDocument();
      // Address appears in multiple places (contact info and map), use getAllByText
      expect(screen.getAllByText('123 Green Street, Bangkok, Thailand').length).toBeGreaterThan(0);
    });

    it('renders phone with call button', () => {
      render(<ListingDetailsCard listing={accommodationListing} />);

      expect(screen.getByText('Phone')).toBeInTheDocument();
      expect(screen.getByText('+66 123 4567')).toBeInTheDocument();

      const callButton = screen.getByRole('link', { name: /call/i });
      expect(callButton).toHaveAttribute('href', 'tel:+66 123 4567');
    });

    it('renders email with email button', () => {
      render(<ListingDetailsCard listing={accommodationListing} />);

      // "Email" appears as both label and button text, so use getAllByText
      expect(screen.getAllByText('Email').length).toBeGreaterThan(0);
      expect(screen.getByText('info@ecohotel.com')).toBeInTheDocument();

      const emailButton = screen.getByRole('link', { name: /email/i });
      expect(emailButton).toHaveAttribute('href', 'mailto:info@ecohotel.com');
    });

    it('renders website with visit button', () => {
      render(<ListingDetailsCard listing={accommodationListing} />);

      expect(screen.getByText('Website')).toBeInTheDocument();
      expect(screen.getByText('https://ecohotel.com')).toBeInTheDocument();

      const visitButton = screen.getByRole('link', { name: /visit/i });
      expect(visitButton).toHaveAttribute('href', 'https://ecohotel.com');
      expect(visitButton).toHaveAttribute('target', '_blank');
      expect(visitButton).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('renders phone icon', () => {
      const { container } = render(<ListingDetailsCard listing={accommodationListing} />);

      const phoneSection = screen.getByText('Phone').closest('div')?.parentElement;
      const icon = phoneSection?.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('renders email icon', () => {
      const { container } = render(<ListingDetailsCard listing={accommodationListing} />);

      // "Email" appears twice, so get the first one (the label)
      const emailLabel = screen.getAllByText('Email')[0];
      const emailSection = emailLabel.closest('div')?.parentElement;
      const icon = emailSection?.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('renders globe icon for website', () => {
      const { container } = render(<ListingDetailsCard listing={accommodationListing} />);

      const websiteSection = screen.getByText('Website').closest('div')?.parentElement;
      const icon = websiteSection?.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('renders map pin icon for address', () => {
      const { container } = render(<ListingDetailsCard listing={accommodationListing} />);

      const addressSection = screen.getByText('Address').closest('div')?.parentElement;
      const icon = addressSection?.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('handles missing contact information', () => {
      const listing = {
        ...accommodationListing,
        contactPhone: undefined,
        contactEmail: undefined,
        website: undefined,
        address: undefined,
      };

      render(<ListingDetailsCard listing={listing} />);

      expect(screen.queryByText('Phone')).not.toBeInTheDocument();
      expect(screen.queryByText('Email')).not.toBeInTheDocument();
      expect(screen.queryByText('Website')).not.toBeInTheDocument();
      expect(screen.queryByText('Address')).not.toBeInTheDocument();
    });
  });

  describe('Map Section', () => {
    it('renders location section', () => {
      render(<ListingDetailsCard listing={accommodationListing} />);

      expect(screen.getByText('Location')).toBeInTheDocument();
    });

    it('renders interactive map', () => {
      render(<ListingDetailsCard listing={accommodationListing} />);

      expect(screen.getByTestId('interactive-map')).toBeInTheDocument();
    });

    it('passes correct props to InteractiveMap', () => {
      render(<ListingDetailsCard listing={accommodationListing} />);

      const map = screen.getByTestId('interactive-map');
      expect(map).toHaveTextContent('Eco Hotel Bangkok');
      expect(map).toHaveTextContent('123 Green Street, Bangkok, Thailand');
      expect(map).toHaveTextContent('13.7563,100.5018');
    });
  });

  describe('Separators', () => {
    it('includes separators between sections', () => {
      const { container } = render(<ListingDetailsCard listing={accommodationListing} />);

      // Radix UI Separator with decorative=true doesn't add role="separator"
      // Check for separator by class or data attribute
      const separators = container.querySelectorAll('[data-radix-collection-item], .bg-border, hr');
      expect(separators.length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility', () => {
    it('has proper aria controls for read more button', () => {
      const longDesc = 'A'.repeat(300);
      const listing = {
        ...accommodationListing,
        longDescription: longDesc,
      };

      render(<ListingDetailsCard listing={listing} />);

      const button = screen.getByTestId('read-more-button');
      const descElement = screen.getByTestId('long-description');

      const buttonControls = button.getAttribute('aria-controls');
      const descId = descElement.getAttribute('id');

      expect(buttonControls).toBe(descId);
    });

    it('sets aria-expanded correctly', async () => {
      const longDesc = 'A'.repeat(300);
      const listing = {
        ...accommodationListing,
        longDescription: longDesc,
      };

      render(<ListingDetailsCard listing={listing} />);

      const button = screen.getByTestId('read-more-button');

      expect(button).toHaveAttribute('aria-expanded', 'false');

      await userEvent.click(button);

      await waitFor(() => {
        expect(button).toHaveAttribute('aria-expanded', 'true');
      });
    });

    it('hides gradient from screen readers', () => {
      const longDesc = 'A'.repeat(300);
      const listing = {
        ...accommodationListing,
        longDescription: longDesc,
      };

      const { container } = render(<ListingDetailsCard listing={listing} />);

      const gradient = container.querySelector('.bg-gradient-to-t');
      expect(gradient).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Edge Cases', () => {
    it('handles listings without type-specific details', () => {
      const genericListing: ListingDetailDTO = {
        ...baseListing,
        type: 'accommodation',
        accommodationDetails: undefined,
      } as unknown as ListingDetailDTO;

      render(<ListingDetailsCard listing={genericListing} />);

      expect(screen.getByText('About This Place')).toBeInTheDocument();
    });

    it('handles empty arrays gracefully', () => {
      const emptyListing: ListingDetailDTO = {
        ...accommodationListing,
        amenities: [],
        ecoFocusTags: [],
        digitalNomadFeatures: [],
      };

      render(<ListingDetailsCard listing={emptyListing} />);

      expect(screen.queryByText('Amenities')).not.toBeInTheDocument();
      expect(screen.queryByText('Sustainability Features')).not.toBeInTheDocument();
      expect(screen.queryByText('Digital Nomad Features')).not.toBeInTheDocument();
    });

    it('preserves whitespace in description', () => {
      const descWithNewlines = 'Line 1\n\nLine 2\nLine 3';
      const listing = {
        ...accommodationListing,
        longDescription: descWithNewlines,
      };

      render(<ListingDetailsCard listing={listing} />);

      const descElement = screen.getByTestId('long-description');
      const paragraph = descElement.querySelector('p');
      expect(paragraph).toHaveClass('whitespace-pre-line');
    });
  });
});
