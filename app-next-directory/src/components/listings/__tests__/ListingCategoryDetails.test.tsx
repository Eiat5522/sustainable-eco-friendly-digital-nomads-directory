import { render, screen } from '@testing-library/react';
import type { ListingDetailDTO } from '@/types/dto';
import { ListingCategoryDetails } from '../ListingCategoryDetails';

const sharedListing = {
  id: 'listing-1',
  name: 'Test Listing',
  slug: 'test-listing',
  city: { id: 'city-1', name: 'Test City', slug: 'test-city', country: 'Testland' },
  galleryImages: [] as string[],
  amenities: [] as ListingDetailDTO['amenities'],
  ecoFocusTags: [] as string[],
  digitalNomadFeatures: [] as string[],
};

describe('ListingCategoryDetails', () => {
  it('renders accommodation details', () => {
    render(
      <ListingCategoryDetails
        listing={
          {
            ...sharedListing,
            type: 'accommodation',
            accommodationDetails: {
              accommodationType: 'Hotel',
              minimumStay: 2,
              roomTypes: ['Suite'],
            },
          } as ListingDetailDTO
        }
      />
    );

    expect(screen.getByText('Accommodation Details')).toBeInTheDocument();
    expect(screen.getByText('Type:')).toBeInTheDocument();
    expect(screen.getByText('Hotel')).toBeInTheDocument();
    expect(screen.getByText('2 nights')).toBeInTheDocument();
  });

  it('renders coworking details', () => {
    render(
      <ListingCategoryDetails
        listing={
          {
            ...sharedListing,
            type: 'coworking',
            coworkingDetails: {
              pricingPlans: [
                {
                  type: 'daily',
                  price: { amount: 250, currency: 'USD', unit: 'day' },
                  period: 'day',
                  features: ['Desk'],
                },
              ],
              internetSpeed: { download: 100, upload: 50 },
            },
          } as ListingDetailDTO
        }
      />
    );

    expect(screen.getByText('Coworking Details')).toBeInTheDocument();
    expect(screen.getByText('daily')).toBeInTheDocument();
    expect(screen.getByText(/100Mbps down/)).toBeInTheDocument();
  });

  it('renders cafe details', () => {
    render(
      <ListingCategoryDetails
        listing={
          {
            ...sharedListing,
            type: 'cafe',
            cafeDetails: {
              priceIndication: '$$',
              menuHighlights: ['Latte'],
              noiseLevel: 'quiet',
            },
          } as ListingDetailDTO
        }
      />
    );

    expect(screen.getByText('Cafe Details')).toBeInTheDocument();
    expect(screen.getByText('Price Range:')).toBeInTheDocument();
    expect(screen.getByText('$$')).toBeInTheDocument();
    expect(screen.getByText('Latte')).toBeInTheDocument();
  });

  it('renders restaurant details', () => {
    render(
      <ListingCategoryDetails
        listing={
          {
            ...sharedListing,
            type: 'restaurant',
            restaurantDetails: {
              cuisineType: ['Thai', 'Vegan'],
              dietaryOptions: ['Gluten-Free'],
              averageMealPrice: { amount: 250, currency: 'THB', unit: 'meal' },
            },
          } as ListingDetailDTO
        }
      />
    );

    expect(screen.getByText('Restaurant Details')).toBeInTheDocument();
    expect(screen.getByText('Cuisine Types:')).toBeInTheDocument();
    expect(screen.getByText('Thai')).toBeInTheDocument();
    expect(screen.getByText('Gluten-Free')).toBeInTheDocument();
    expect(screen.getByText(/250/)).toBeInTheDocument();
  });

  it('renders activity details', () => {
    render(
      <ListingCategoryDetails
        listing={
          {
            ...sharedListing,
            type: 'activities',
            activityDetails: {
              activityType: 'Hiking',
              duration: 'Half day',
              skillLevel: 'Intermediate',
              languages: ['English', 'Thai'],
            },
          } as ListingDetailDTO
        }
      />
    );

    expect(screen.getByText('Activity Details')).toBeInTheDocument();
    expect(screen.getByText('Activity Type:')).toBeInTheDocument();
    expect(screen.getByText('Hiking')).toBeInTheDocument();
    expect(screen.getByText('Half day')).toBeInTheDocument();
    expect(screen.getByText('English')).toBeInTheDocument();
  });

  it('returns null when no details exist for the listing', () => {
    const { container } = render(
      <ListingCategoryDetails
        listing={
          {
            ...sharedListing,
            type: 'cafe',
            cafeDetails: undefined,
          } as ListingDetailDTO
        }
      />
    );

    expect(container.firstChild).toBeNull();
  });
});
