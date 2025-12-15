/** @jest-environment jsdom */
import { render, screen } from '@testing-library/react';

import { ListingDetailsCard } from '@/components/listings/ListingDetailsCard';
import { mockListingDetail } from '@/components/listings/listingDetailMockData';
import type { ListingDetailDTO } from '@/types/dto';

jest.mock('next/dynamic', () => () => {
  const MockInteractiveMap = ({ name }: { name: string }) => (
    <div data-testid="interactive-map">
      <span>{name}</span>
    </div>
  );
  return MockInteractiveMap;
});

describe('ListingDetailsCard integration', () => {
  it('renders composed listing information with contact and map details', () => {
    render(<ListingDetailsCard listing={mockListingDetail} />);

    expect(screen.getByText('About This Place')).toBeInTheDocument();
    expect(screen.getByText('Amenities')).toBeInTheDocument();
    expect(screen.getByText('Sustainability Features')).toBeInTheDocument();
    expect(screen.getByText('Digital Nomad Features')).toBeInTheDocument();
    expect(screen.getByText('Accommodation Details')).toBeInTheDocument();
    expect(screen.getByText('Contact Information')).toBeInTheDocument();
    expect(screen.getByTestId('interactive-map')).toBeInTheDocument();
  });

  it('omits category details when data is unavailable', () => {
    const listing = {
      ...mockListingDetail,
      type: 'cafe' as const,
      cafeDetails: undefined,
      accommodationDetails: undefined,
    };

    render(<ListingDetailsCard listing={listing as unknown as ListingDetailDTO} />);

    expect(screen.queryByText('Accommodation Details')).not.toBeInTheDocument();
    expect(screen.queryByText('Cafe Details')).not.toBeInTheDocument();
  });
});
