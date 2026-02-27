import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import type { FeaturedListingDTO } from '@/types/dto';
import { FeaturedListings } from '../FeaturedListingsServer';

const mockListings: FeaturedListingDTO[] = [
  {
    id: '1',
    name: 'Eco Haven Co-working',
    slug: 'eco-haven-co-working',
    imageUrl: 'https://images.unsplash.com/photo-1449844908441-8829872d2607?w=800',
    city: 'Bali',
  },
  {
    id: '2',
    name: 'Green Office Barcelona',
    slug: 'green-office-barcelona',
    imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800',
    city: 'Barcelona',
  },
  {
    id: '3',
    name: 'Sustainable Hub Chiang Mai',
    slug: 'sustainable-hub-chiang-mai',
    imageUrl: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800',
    city: 'Chiang Mai',
  },
];

// Mock the carousel client component
jest.mock('../FeaturedListingsCarousel', () => ({
  FeaturedListingsCarousel: ({ listings }: { listings: FeaturedListingDTO[] }) => (
    <div data-testid="featured-listings-carousel">
      {listings.map(listing => (
        <div key={listing.id} data-testid={`listing-${listing.id}`}>
          {listing.name}
        </div>
      ))}
    </div>
  ),
}));

describe('FeaturedListings (Server Component)', () => {
  it('renders section with header', () => {
    render(<FeaturedListings listings={mockListings} />);

    expect(
      screen.getByRole('heading', { name: /Featured Sustainable Venues/i, level: 2 })
    ).toBeInTheDocument();
  });

  it('renders section description', () => {
    render(<FeaturedListings listings={mockListings} />);

    expect(
      screen.getByText(/Handpicked eco-friendly spaces that prioritize sustainability/i)
    ).toBeInTheDocument();
  });

  it('renders carousel when listings are provided', () => {
    render(<FeaturedListings listings={mockListings} />);

    expect(screen.getByTestId('featured-listings-carousel')).toBeInTheDocument();
  });

  it('renders all listings in carousel', () => {
    render(<FeaturedListings listings={mockListings} />);

    for (const listing of mockListings) {
      expect(screen.getByText(listing.name)).toBeInTheDocument();
    }
  });

  it('renders empty state when no listings provided', () => {
    render(<FeaturedListings listings={[]} />);

    expect(screen.getByText(/No featured listings available at the moment/i)).toBeInTheDocument();
  });

  it('does not render carousel when listings array is empty', () => {
    render(<FeaturedListings listings={[]} />);

    expect(screen.queryByTestId('featured-listings-carousel')).not.toBeInTheDocument();
  });

  it('has correct section structure', () => {
    const { container } = render(<FeaturedListings listings={mockListings} />);

    const section = container.querySelector('section');
    expect(section).toBeInTheDocument();
    expect(section).toHaveClass('relative', 'overflow-hidden', 'bg-neo-secondary', 'px-4', 'py-12');
  });

  it('wraps content in container with padding', () => {
    const { container } = render(<FeaturedListings listings={mockListings} />);

    const containerDiv = container.querySelector('.container');
    expect(containerDiv).toBeInTheDocument();
    expect(containerDiv).toHaveClass('container', 'relative', 'z-10', 'mx-auto', 'max-w-6xl');
  });
});
