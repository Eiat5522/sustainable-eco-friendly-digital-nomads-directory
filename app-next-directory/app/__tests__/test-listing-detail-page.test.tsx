import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';


const mockListingDetailData = {
  name: 'Mock Listing',
};
const mockReviewsData = [{ id: 'review-1' }];
const mockRelatedListingsData = [{ id: 'related-1' }, { id: 'related-2' }];

const mockListingDetailView = jest.fn(
  ({ listing, reviews, relatedListings, isSignedIn, isFavorited }: any) => (
    <div data-testid="mock-listing-view">
      <span data-testid="listing-name">{listing?.name}</span>
      <span data-testid="reviews-count">{reviews?.length ?? 0}</span>
      <span data-testid="related-count">{relatedListings?.length ?? 0}</span>
      <span data-testid="signed-in-flag">{String(isSignedIn)}</span>
      <span data-testid="favorited-flag">{String(isFavorited)}</span>
    </div>
  )
);

jest.mock('@/components/listings/ListingDetailView', () => ({
  __esModule: true,
  ListingDetailView: (props: any) => mockListingDetailView(props),
}));

jest.mock('@/components/listings/listingDetailMockData', () => ({
  __esModule: true,
  mockListingDetail: mockListingDetailData,
  mockReviews: mockReviewsData,
  mockRelatedListings: mockRelatedListingsData,
}));

describe('ListingDetailTestPage', () => {
  const ORIGINAL_ENV = { ...process.env };

  beforeEach(() => {
    jest.resetModules();
    mockListingDetailView.mockClear();
    process.env = { ...ORIGINAL_ENV };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it('renders the ListingDetailView when the test page is enabled by default', async () => {
    const { default: ListingDetailTestPage } = await import('../test/listing-detail/page');

    render(<ListingDetailTestPage />);

    expect(screen.getByTestId('mock-listing-view')).toBeInTheDocument();
    expect(screen.getByTestId('listing-name')).toHaveTextContent('Mock Listing');

    const [callArgs] = mockListingDetailView.mock.calls as Array<[
      {
        listing: typeof mockListingDetailData;
        reviews: typeof mockReviewsData;
        relatedListings: typeof mockRelatedListingsData;
        isSignedIn: boolean;
        isFavorited: boolean;
      }
    ]>;

    expect(callArgs[0].listing).toBe(mockListingDetailData);
    expect(callArgs[0].reviews).toBe(mockReviewsData);
    expect(callArgs[0].relatedListings).toBe(mockRelatedListingsData);
    expect(callArgs[0].isSignedIn).toBe(false);
    expect(callArgs[0].isFavorited).toBe(false);
    expect(
      screen.queryByText('This test page is not available in production.')
    ).not.toBeInTheDocument();
  });

  it('hides the detail view when running in production without overrides', async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.ENABLE_TEST_PAGES;

    const { default: ListingDetailTestPage } = await import('../test/listing-detail/page');

    render(<ListingDetailTestPage />);

    expect(
      screen.getByText('This test page is not available in production.')
    ).toBeInTheDocument();
    expect(mockListingDetailView).not.toHaveBeenCalled();
  });

  it('allows enabling the page explicitly in production', async () => {
    process.env.NODE_ENV = 'production';
    process.env.ENABLE_TEST_PAGES = 'true';

    const { default: ListingDetailTestPage } = await import('../test/listing-detail/page');

    render(<ListingDetailTestPage />);

    expect(screen.getByTestId('mock-listing-view')).toBeInTheDocument();
    expect(mockListingDetailView).toHaveBeenCalledTimes(1);
  });
});
