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
  return ({ src, alt }) => {
    // biome-ignore lint/performance/noImgElement: test-only Next/Image mock
    return <img src={src} alt={alt} />;
  };
});

const mockVenue: FeaturedListingDTO = {
  id: '1',
  name: 'Test Venue',
  slug: 'test-venue',
  imageUrl: '/test-image.jpg',
  city: 'Test City',
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
    // After the error, the placeholder image should be visible
    const placeholderImage = container.querySelector('img[src="/placeholder_image.png"]');
    expect(placeholderImage).toBeInTheDocument();
  });
});
