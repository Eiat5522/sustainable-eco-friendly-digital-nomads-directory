import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

// Mock Header
jest.mock('@/components/layout/Header', () => ({
  Header: () => <div data-testid="header">Header</div>,
}));

// Mock Footer
jest.mock('@/components/layout/Footer', () => ({
  Footer: () => <div data-testid="footer">Footer</div>,
}));

// Mock ListingDetailView
jest.mock('@/components/listings/ListingDetailView', () => ({
  ListingDetailView: ({ listing, reviews, relatedListings, isSignedIn, isFavorited }: {
    listing?: { name?: string };
    reviews?: unknown[];
    relatedListings?: unknown[];
    isSignedIn?: boolean;
    isFavorited?: boolean;
  }) => (
    <div data-testid="listing-detail-view">
      <div data-testid="listing-name">{listing?.name}</div>
      <div data-testid="reviews-count">{reviews?.length}</div>
      <div data-testid="related-count">{relatedListings?.length}</div>
      <div data-testid="signed-in">{String(isSignedIn)}</div>
      <div data-testid="favorited">{String(isFavorited)}</div>
    </div>
  ),
}));

// Mock the listing mock data
jest.mock('@/components/listings/listingDetailMockData', () => ({
  mockListingDetail: {
    name: 'Test Listing',
    description: 'Test Description',
  },
  mockReviews: [{ id: 1 }, { id: 2 }],
  mockRelatedListings: [{ id: 1 }, { id: 2 }, { id: 3 }],
}));

// Import after mocks
import ListingDetailPreview from '../page.listingdetail';

describe('ListingDetailPreview', () => {
  it('renders the header', () => {
    render(<ListingDetailPreview />);
    expect(screen.getByTestId('header')).toBeInTheDocument();
  });

  it('renders the footer', () => {
    render(<ListingDetailPreview />);
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });

  it('renders the listing detail view', () => {
    render(<ListingDetailPreview />);
    expect(screen.getByTestId('listing-detail-view')).toBeInTheDocument();
  });

  it('passes mock listing data to ListingDetailView', () => {
    render(<ListingDetailPreview />);
    expect(screen.getByTestId('listing-name')).toHaveTextContent('Test Listing');
  });

  it('passes mock reviews to ListingDetailView', () => {
    render(<ListingDetailPreview />);
    expect(screen.getByTestId('reviews-count')).toHaveTextContent('2');
  });

  it('passes mock related listings to ListingDetailView', () => {
    render(<ListingDetailPreview />);
    expect(screen.getByTestId('related-count')).toHaveTextContent('3');
  });

  it('passes isSignedIn as true', () => {
    render(<ListingDetailPreview />);
    expect(screen.getByTestId('signed-in')).toHaveTextContent('true');
  });

  it('passes isFavorited as false', () => {
    render(<ListingDetailPreview />);
    expect(screen.getByTestId('favorited')).toHaveTextContent('false');
  });

  it('has correct layout structure', () => {
    const { container } = render(<ListingDetailPreview />);

    const rootDiv = container.querySelector('.min-h-screen.bg-background');
    expect(rootDiv).toBeInTheDocument();

    const main = container.querySelector('main');
    expect(main).toBeInTheDocument();
  });
});
