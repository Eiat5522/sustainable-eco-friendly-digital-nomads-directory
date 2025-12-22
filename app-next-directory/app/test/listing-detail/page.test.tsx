import { render, screen } from '@testing-library/react';

jest.mock('@/components/listings/ListingDetailView', () => ({
  ListingDetailView: jest.fn(({ listing, reviews, relatedListings, isSignedIn, isFavorited }) => (
    <div data-testid="listing-detail-view">
      <span data-testid="listing-detail-listing">{JSON.stringify(listing)}</span>
      <span data-testid="listing-detail-reviews">{JSON.stringify(reviews)}</span>
      <span data-testid="listing-detail-related">{JSON.stringify(relatedListings)}</span>
      <span data-testid="listing-detail-signed-in">{String(isSignedIn)}</span>
      <span data-testid="listing-detail-favorited">{String(isFavorited)}</span>
    </div>
  )),
}));

jest.mock('@/components/listings/listingDetailMockData', () => ({
  mockListingDetail: { id: 'listing-123' },
  mockReviews: [{ id: 'review-1' }],
  mockRelatedListings: [{ id: 'related-1' }],
}));

describe('ListingDetailTestPage', () => {
  const originalEnv = process.env;
  const expectedGalleryImages = [
    '/test-images/gallery-1.svg',
    '/test-images/gallery-2.svg',
    '/test-images/gallery-3.svg',
  ];

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('renders the disabled message in production when test pages are not enabled', async () => {
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'production',
      writable: true,
      configurable: true,
    });
    delete process.env.ENABLE_TEST_PAGES;
    delete process.env.NEXT_PUBLIC_E2E;
    delete process.env.E2E;

    const { default: ListingDetailTestPage } = await import('./page');
    render(<ListingDetailTestPage />);

    expect(screen.getByText('This test page is not available in production.')).toBeInTheDocument();
    expect(screen.queryByTestId('listing-detail-view')).not.toBeInTheDocument();
  });

  it('renders the listing detail view when not in production', async () => {
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'development',
      writable: true,
      configurable: true,
    });
    process.env.ENABLE_TEST_PAGES = 'false';
    delete process.env.NEXT_PUBLIC_E2E;
    delete process.env.E2E;

    const { default: ListingDetailTestPage } = await import('./page');
    render(<ListingDetailTestPage />);

    expect(screen.getByTestId('listing-detail-view')).toBeInTheDocument();
    expect(screen.getByTestId('listing-detail-listing').textContent).toBe(
      JSON.stringify({ id: 'listing-123', galleryImages: expectedGalleryImages })
    );
    expect(screen.getByTestId('listing-detail-reviews').textContent).toBe(
      JSON.stringify([{ id: 'review-1' }])
    );
    expect(screen.getByTestId('listing-detail-related').textContent).toBe(
      JSON.stringify([{ id: 'related-1' }])
    );
    expect(screen.getByTestId('listing-detail-signed-in').textContent).toBe('false');
    expect(screen.getByTestId('listing-detail-favorited').textContent).toBe('false');
  });

  it('allows enabling the page in production via the ENABLE_TEST_PAGES flag', async () => {
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'production',
      writable: true,
      configurable: true,
    });
    process.env.ENABLE_TEST_PAGES = 'true';
    delete process.env.NEXT_PUBLIC_E2E;
    delete process.env.E2E;

    const { default: ListingDetailTestPage } = await import('./page');
    render(<ListingDetailTestPage />);

    expect(screen.getByTestId('listing-detail-view')).toBeInTheDocument();
  });
});
