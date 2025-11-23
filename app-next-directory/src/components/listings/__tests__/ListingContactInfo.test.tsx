import { render, screen } from '@testing-library/react';
import type { ListingDetailDTO } from '@/types/dto';
import { ListingContactInfo } from '../ListingContactInfo';

const sharedListing = {
  id: 'listing-1',
  name: 'Contact Listing',
  slug: 'contact-listing',
  type: 'accommodation' as const,
  city: { id: 'city-1', name: 'Test City', slug: 'test-city', country: 'Testland' },
  galleryImages: [] as string[],
  amenities: [] as ListingDetailDTO['amenities'],
  ecoFocusTags: [] as string[],
  digitalNomadFeatures: [] as string[],
  accommodationDetails: {},
};

describe('ListingContactInfo', () => {
  it('renders all contact fields when provided', () => {
    render(
      <ListingContactInfo
        listing={{
          ...sharedListing,
          address: '123 Green Street',
          contactPhone: '+123456789',
          contactEmail: 'hello@example.com',
          website: 'https://example.com',
        }}
      />
    );

    expect(screen.getByText('Address')).toBeInTheDocument();
    expect(screen.getByText('Phone')).toBeInTheDocument();
    expect(screen.getByText('Email', { selector: 'span' })).toBeInTheDocument();
    expect(screen.getByText('Website')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /call/i })).toHaveAttribute('href', 'tel:+123456789');
    expect(screen.getByRole('link', { name: /email/i })).toHaveAttribute(
      'href',
      'mailto:hello@example.com'
    );
    expect(screen.getByRole('link', { name: /visit/i })).toHaveAttribute(
      'href',
      'https://example.com'
    );
  });

  it('omits sections without data', () => {
    render(<ListingContactInfo listing={{ ...sharedListing }} />);

    expect(screen.queryByText('Address')).not.toBeInTheDocument();
    expect(screen.queryByText('Phone')).not.toBeInTheDocument();
    expect(screen.queryByText('Email')).not.toBeInTheDocument();
    expect(screen.queryByText('Website')).not.toBeInTheDocument();
  });
});
