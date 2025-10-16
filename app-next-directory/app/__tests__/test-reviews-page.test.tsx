import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';

const mockReviewsSection = jest.fn(
  ({ reviews, isSignedIn, listingId }: { reviews: unknown[]; isSignedIn: boolean; listingId: string }) => (
    <div data-testid="mock-reviews" data-count={reviews.length} data-signed-in={isSignedIn} data-listing-id={listingId}>
      Reviews Mock
    </div>
  )
);

jest.mock('@/components/listings/ReviewsSection', () => ({
  __esModule: true,
  ReviewsSection: (props: { reviews: unknown[]; isSignedIn: boolean; listingId: string }) =>
    mockReviewsSection(props),
}));

describe('TestReviewsPage', () => {
  beforeEach(() => {
    mockReviewsSection.mockClear();
  });

  it('renders the reviews test shell with defaults when no search params are provided', async () => {
    const { default: TestReviewsPage } = await import('../test-reviews/page');

    const view = await TestReviewsPage({});
    render(view);

    expect(screen.getByRole('heading', { name: 'Test Reviews Section' })).toBeInTheDocument();
    expect(mockReviewsSection).toHaveBeenCalledTimes(1);

    const [callArgs] = mockReviewsSection.mock.calls as Array<[
      { reviews: unknown[]; isSignedIn: boolean; listingId: string }
    ]>;

    expect(callArgs[0].reviews).toEqual([]);
    expect(callArgs[0].isSignedIn).toBe(false);
    expect(callArgs[0].listingId).toBe('test-listing-123');
    expect(screen.getByTestId('mock-reviews')).toHaveAttribute('data-count', '0');
    expect(screen.getByTestId('mock-reviews')).toHaveAttribute('data-signed-in', 'false');
  });

  it('preloads initial reviews and treats numeric flags as signed-in', async () => {
    const { default: TestReviewsPage } = await import('../test-reviews/page');

    const view = await TestReviewsPage({
      searchParams: {
        signedIn: '1',
        preset: 'with-initial',
      },
    });

    render(view);

    const [callArgs] = mockReviewsSection.mock.calls as Array<[
      { reviews: Array<{ id: string }>; isSignedIn: boolean; listingId: string }
    ]>;

    expect(callArgs[0].reviews).toEqual([
      {
        id: 'existing-review-1',
        rating: 4,
        comment: 'Loved the solar-powered workspaces and community events focused on sustainability.',
        user: { name: 'Jordan Rivers' },
        createdAt: '2024-05-01T12:00:00Z',
        status: 'approved',
      },
    ]);
    expect(callArgs[0].isSignedIn).toBe(true);
    expect(screen.getByTestId('mock-reviews')).toHaveAttribute('data-count', '1');
    expect(screen.getByTestId('mock-reviews')).toHaveAttribute('data-signed-in', 'true');
  });

  it('supports Promise-based search params and boolean flag strings', async () => {
    const { default: TestReviewsPage } = await import('../test-reviews/page');

    const view = await TestReviewsPage({
      searchParams: Promise.resolve({
        signedIn: ['true'],
        preset: ['with-initial'],
      }),
    });

    render(view);

    const [callArgs] = mockReviewsSection.mock.calls as Array<[
      { reviews: unknown[]; isSignedIn: boolean; listingId: string }
    ]>;

    expect(callArgs[0].isSignedIn).toBe(true);
    expect(callArgs[0].reviews).toHaveLength(1);
  });
});
