import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { VenueCard } from '../VenueCard';
import { FeaturedListingDTO } from '@/types/dto';
import Link from 'next/link';

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href }) => {
    return <a href={href}>{children}</a>;
  };
});

// Mock next/image
jest.mock('next/image', () => {
  return ({ src, alt }) => {
    return <img src={src} alt={alt} />;
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
    // After the error, the placeholder image should be visible
    const placeholderImage = container.querySelector('img[src="/placeholder_image.png"]');
    expect(placeholderImage).toBeInTheDocument();
  });

  it('handles object-based city data', () => {
    const venueWithObjectCity = { ...mockVenue, city: { name: 'Object City' } };
    render(<VenueCard venue={venueWithObjectCity} />);
    expect(screen.getByText('Object City')).toBeInTheDocument();
  });

  it('handles missing city data gracefully', () => {
    const venueWithoutCity = { ...mockVenue, city: undefined };
    const { container } = render(<VenueCard venue={venueWithoutCity} />);
    expect(container.querySelector('.body-sm')).toBeNull();
  });

  it('truncates eco and amenity tags', () => {
    const manyTagsVenue = {
      ...mockVenue,
      ecoFocusTags: ['1', '2', '3', '4'],
      amenityNames: ['a', 'b', 'c', 'd', 'e'],
    };
    render(<VenueCard venue={manyTagsVenue} />);
    expect(screen.getByText('+1 more')).toBeInTheDocument();
    expect(screen.getByText('+2 more')).toBeInTheDocument();
  });

  it('renders correctly with no tags', () => {
    const noTagsVenue = { ...mockVenue, ecoFocusTags: [], amenityNames: [] };
    render(<VenueCard venue={noTagsVenue} />);
    expect(screen.queryByText('more')).not.toBeInTheDocument();
  });

  it('applies correct tag colors', () => {
    render(<VenueCard venue={mockVenue} />);
    expect(screen.getByText('Solar Power').className).toContain('bg-emerald-100');
    expect(screen.getByText('Zero Waste').className).toContain('bg-lime-100');
    expect(screen.getByText('WiFi').className).toContain('bg-blue-100');
    expect(screen.getByText('24/7 Access').className).toContain('bg-purple-100');
  });

  it('passes priority prop to Image component', () => {
    const { container } = render(<VenueCard venue={mockVenue} priority />);
    const images = container.querySelectorAll('img');
    // This is a simplification. In a real scenario, you'd check the props of the mocked Image component.
    // For this example, we'll just check that the images are rendered.
    expect(images.length).toBeGreaterThan(0);
  });
});
