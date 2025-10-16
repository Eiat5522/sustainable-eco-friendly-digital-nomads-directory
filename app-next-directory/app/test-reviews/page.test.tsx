import { render, screen } from '@testing-library/react';
import React from 'react';

const reviewsSectionMock = jest.fn(
  ({ reviews, listingId, isSignedIn }: { reviews: unknown; listingId: string; isSignedIn: boolean }) => (
    <div data-testid="reviews-section-mock">
      <span data-testid="reviews-props">{JSON.stringify({ reviews, listingId, isSignedIn })}</span>
    </div>
  )
);

jest.mock('@/components/listings/ReviewsSection', () => ({
  ReviewsSection: (props: { reviews: unknown; listingId: string; isSignedIn: boolean }) =>
    reviewsSectionMock(props),
}));

describe('TestReviewsPage', () => {
  beforeEach(() => {
    reviewsSectionMock.mockClear();
  });

  it('renders with default empty reviews and signed out state when no params are provided', async () => {
    const { default: TestReviewsPage } = await import('./page');
    const ui = await TestReviewsPage({});
    render(ui);

    expect(screen.getByRole('heading', { name: 'Test Reviews Section' })).toBeInTheDocument();
    const parsed = JSON.parse(screen.getByTestId('reviews-props').textContent ?? '{}');

    expect(parsed).toEqual({
      reviews: [],
      listingId: 'test-listing-123',
      isSignedIn: false,
    });
  });

  it('treats truthy signedIn and preset values correctly even when passed as arrays', async () => {
    const { default: TestReviewsPage } = await import('./page');
    const ui = await TestReviewsPage({
      searchParams: Promise.resolve({
        signedIn: ['true', 'false'],
        preset: ['with-initial', 'other'],
      }),
    });
    render(ui);

    const parsed = JSON.parse(screen.getByTestId('reviews-props').textContent ?? '{}');
    expect(parsed.isSignedIn).toBe(true);
    expect(parsed.reviews).toEqual([
      {
        id: 'existing-review-1',
        rating: 4,
        comment:
          'Loved the solar-powered workspaces and community events focused on sustainability.',
        user: { name: 'Jordan Rivers' },
        createdAt: '2024-05-01T12:00:00Z',
        status: 'approved',
      },
    ]);
  });

  it('treats signedIn values other than true/1 as false and falls back to empty reviews when preset mismatches', async () => {
    const { default: TestReviewsPage } = await import('./page');
    const ui = await TestReviewsPage({ searchParams: { signedIn: '0', preset: 'other' } });
    render(ui);

    const parsed = JSON.parse(screen.getByTestId('reviews-props').textContent ?? '{}');
    expect(parsed.isSignedIn).toBe(false);
    expect(parsed.reviews).toEqual([]);
  });
});
