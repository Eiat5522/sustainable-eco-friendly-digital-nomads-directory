import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { FeaturedListingDTO } from '@/types/dto';
import { VenueCard } from '../VenueCard';

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href }) => {
    return <a href={href}>{children}</a>;
  };
});

// Mock next/image
jest.mock('next/image', () => {
  return ({ src, alt, ...props }) => {
    return <img src={src} alt={alt} {...props} />;
  };
});

const mockVenue: FeaturedListingDTO = {
  _id: '1',
  name: 'Test Venue',
  slug: 'test-venue',
  imageUrl: '/test-image.jpg',
  city: 'Test City',
  featured: true,
  ecoFocusTags: ['Solar Power', 'Zero Waste'],
  amenityNames: ['WiFi', '24/7 Access'],
};

describe('VenueCard', () => {
  it('renders the venue name and city', () => {
    render(<VenueCard venue={mockVenue} />);
    expect(screen.getByText('Test Venue')).toBeInTheDocument();
    expect(screen.getByText('Test City')).toBeInTheDocument();
  });

  it('renders a link to the venue page', () => {
    render(<VenueCard venue={mockVenue} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/listings/test-venue');
  });

  it('renders the featured badge if the venue is featured', () => {
    render(<VenueCard venue={mockVenue} />);
    expect(screen.getByText('Featured')).toBeInTheDocument();
  });

  it('does not render the featured badge if the venue is not featured', () => {
    const nonFeaturedVenue = { ...mockVenue, featured: false };
    render(<VenueCard venue={nonFeaturedVenue} />);
    expect(screen.queryByText('Featured')).not.toBeInTheDocument();
  });

  it('renders the eco and amenity tags', () => {
    render(<VenueCard venue={mockVenue} />);
    expect(screen.getByText('Solar Power')).toBeInTheDocument();
    expect(screen.getByText('Zero Waste')).toBeInTheDocument();
    expect(screen.getByText('WiFi')).toBeInTheDocument();
    expect(screen.getByText('24/7 Access')).toBeInTheDocument();
  });

  it('truncates long venue names', () => {
    const longNameVenue = { ...mockVenue, name: 'a'.repeat(100) };
    render(<VenueCard venue={longNameVenue} />);
    expect(screen.getByText('a'.repeat(60) + '...')).toBeInTheDocument();
  });

  it('shows a placeholder image on image error', () => {
    const { container } = render(<VenueCard venue={mockVenue} />);
    const image = container.querySelector(`img[src="${mockVenue.imageUrl}"]`);
    if (image) {
      fireEvent.error(image);
    }
    // After the error, the placeholder image should be visible. Match by src suffix
    const placeholderImage = Array.from(container.querySelectorAll('img')).find(img =>
      (img.getAttribute('src') || '').endsWith('/placeholder_image.png')
    );
    expect(placeholderImage).toBeInTheDocument();
  });
});
