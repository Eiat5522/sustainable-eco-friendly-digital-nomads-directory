import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import * as ReviewsSectionModule from '../ReviewsSection';

jest.mock('../ReviewsSection', () => {
  const actual = jest.requireActual('../ReviewsSection');
  return {
    ...actual,
    submitReview: jest.fn(actual.submitReview),
  };
});
const { ReviewsSection, canSubmitReview, submitReview } = ReviewsSectionModule;

import { getCurrentHref } from '@/utils/navigation';

type FetchReturn = Awaited<ReturnType<typeof fetch>>;

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/utils/navigation', () => ({
  getCurrentHref: jest.fn(),
}));

jest.mock('@/components/ui/StarRating', () => ({
  StarRating: function MockStarRating({
    rating,
    interactive,
    onRatingChange,
  }: {
    rating: number;
    interactive?: boolean;
    onRatingChange?: (rating: number) => void;
  }) {
    if (interactive) {
      return (
        <div data-testid="star-rating-interactive" data-rating={rating}>
          {[1, 2, 3, 4, 5].map(star => (
            <button key={star} data-testid={`star-${star}`} onClick={() => onRatingChange?.(star)}>
              ★
            </button>
          ))}
        </div>
      );
    }

    return (
      <div data-testid="star-rating-display" data-rating={rating}>
        ★★★★★
      </div>
    );
  },
}));

jest.mock('@/components/ui/neo-card', () => ({
  NeoCard: function MockNeoCard({ children }: React.PropsWithChildren) {
    return <div data-testid="neo-card">{children}</div>;
  },
  NeoCardHeader: function MockNeoCardHeader({ children }: React.PropsWithChildren) {
    return <div data-testid="neo-card-header">{children}</div>;
  },
  NeoCardTitle: function MockNeoCardTitle({ children }: React.PropsWithChildren) {
    return <h2 data-testid="neo-card-title">{children}</h2>;
  },
  NeoCardContent: function MockNeoCardContent({ children }: React.PropsWithChildren) {
    return <div data-testid="neo-card-content">{children}</div>;
  },
}));

jest.mock('@/components/ui/neo-button', () => ({
  NeoButton: function MockNeoButton({
    children,
    onClick,
    disabled,
    variant,
    size,
  }: React.PropsWithChildren<{
    onClick?: () => void;
    disabled?: boolean;
    variant?: string;
    size?: string;
  }>) {
    return (
      <button
        data-testid="neo-button"
        data-variant={variant}
        data-size={size}
        onClick={onClick}
        disabled={disabled}
      >
        {children}
      </button>
    );
  },
}));

jest.mock('@/components/ui/separator', () => ({
  Separator: function MockSeparator() {
    return <hr data-testid="separator" />;
  },
}));

jest.mock('@/components/ui/textarea', () => ({
  Textarea: function MockTextarea({
    value,
    onChange,
    placeholder,
    disabled,
    rows,
    maxLength,
  }: {
    value?: string;
    onChange?: React.ChangeEventHandler<HTMLTextAreaElement>;
    placeholder?: string;
    disabled?: boolean;
    rows?: number;
    maxLength?: number;
  }) {
    return (
      <textarea
        data-testid="textarea"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        maxLength={maxLength}
      />
    );
  },
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: function MockImage({ src, alt, ...rest }: React.ComponentProps<'img'>) {
    return <span role="img" data-testid="next-image" data-src={src} aria-label={alt} {...rest} />;
  },
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: function MockLink({ href, children }: React.PropsWithChildren<{ href: string }>) {
    return (
      <a data-testid="next-link" href={href}>
        {children}
      </a>
    );
  },
}));

const originalFetch = global.fetch;
const mockFetch = jest.fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>();
const mockPush = jest.fn();
const mockRefresh = jest.fn();
const originalHref = window.location.href;

const mockResponse = (
  body: unknown,
  init: { status?: number; statusText?: string; ok?: boolean } = {}
) => {
  const status = init.status ?? 200;
  const ok = init.ok ?? (status >= 200 && status < 300);
  return {
    ok,
    status,
    statusText: init.statusText ?? 'OK',
    json: jest.fn().mockResolvedValue(body),
  };
};

const defaultReviews = [
  {
    id: 'review-1',
    rating: 5,
    comment: 'Excellent place! Great atmosphere and eco-friendly practices.',
    user: { name: 'John Doe', image: '/john.jpg' },
    createdAt: '2023-12-01T10:00:00Z',
    status: 'approved' as const,
  },
  {
    id: 'review-2',
    rating: 4,
    comment: 'Good location, friendly staff.',
    user: { name: 'Jane Smith' },
    createdAt: '2023-11-15T14:30:00Z',
    status: 'approved' as const,
  },
];

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockGetCurrentHref = getCurrentHref as jest.MockedFunction<typeof getCurrentHref>;

describe('submitReview', () => {
  it('returns invalid when rating or comment are insufficient', async () => {
    const fetcher = jest.fn();

    expect(
      await submitReview({
        review: { rating: 0, comment: 'Missing rating' },
        listingId: 'test-listing',
        fetcher,
      })
    ).toEqual({ type: 'error', message: 'Please provide a rating and comment.' });
    expect(
      await submitReview({
        review: { rating: 4, comment: '   ' },
        listingId: 'test-listing',
        fetcher,
      })
    ).toEqual({ type: 'error', message: 'Please provide a rating and comment.' });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('returns success when the API responds with ok', async () => {
    const fetcher = jest
      .fn()
      .mockResolvedValue(mockResponse({ id: 'review-id' }) as unknown as FetchReturn);

    const result = await submitReview({
      review: { rating: 5, comment: 'Excellent stay' },
      listingId: 'test-listing',
      fetcher,
    });

    expect(result).toEqual({ type: 'success', review: { id: 'review-id' } });
    expect(fetcher).toHaveBeenCalledWith(
      '/api/reviews',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ rating: 5, comment: 'Excellent stay', listingId: 'test-listing' }),
      })
    );
  });

  it('still succeeds when the success payload cannot be parsed', async () => {
    const fetcher = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: jest.fn().mockRejectedValue(new Error('Bad JSON payload')),
    } as unknown as FetchReturn);

    await expect(
      submitReview({
        review: { rating: 4, comment: 'Parsing issue' },
        listingId: 'test-listing',
        fetcher,
      })
    ).resolves.toEqual({ type: 'success', review: null });

    expect(fetcher).toHaveBeenCalled();
  });

  it('maps status codes to structured outcomes', async () => {
    const fetcher = jest
      .fn()
      .mockResolvedValueOnce(
        mockResponse(
          { error: 'Unauthorized' },
          { status: 401, ok: false }
        ) as unknown as FetchReturn
      )
      .mockResolvedValueOnce(
        mockResponse({ error: 'Forbidden' }, { status: 403, ok: false }) as unknown as FetchReturn
      )
      .mockResolvedValueOnce(
        mockResponse({ error: 'Conflict' }, { status: 409, ok: false }) as unknown as FetchReturn
      );

    expect(
      await submitReview({
        review: { rating: 4, comment: 'Test' },
        listingId: 'test-listing',
        fetcher,
      })
    ).toEqual({ type: 'unauthorized' });
    expect(
      await submitReview({
        review: { rating: 4, comment: 'Test' },
        listingId: 'test-listing',
        fetcher,
      })
    ).toEqual({ type: 'forbidden' });
    expect(
      await submitReview({
        review: { rating: 4, comment: 'Test' },
        listingId: 'test-listing',
        fetcher,
      })
    ).toEqual({ type: 'conflict' });
  });

  it('provides meaningful error messages from the API', async () => {
    const fetcher = jest
      .fn()
      .mockResolvedValue(
        mockResponse({ error: 'Server down' }, { status: 500, ok: false }) as unknown as FetchReturn
      );

    const result = await submitReview({
      review: { rating: 2, comment: 'Issue' },
      listingId: 'test-listing',
      fetcher,
    });

    expect(result).toEqual({ type: 'error', message: 'Server down' });
  });

  it('falls back to a generic message when parsing fails', async () => {
    const fetcher = jest.fn().mockResolvedValue({
      ok: false,
      status: 502,
      statusText: 'Bad Gateway',
      json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
    });

    const result = await submitReview({
      review: { rating: 3, comment: 'Broken' },
      listingId: 'test-listing',
      fetcher,
    });

    expect(result).toEqual({ type: 'error', message: 'Failed to submit review' });
  });
});

beforeEach(() => {
  jest.clearAllMocks();
  mockFetch.mockReset();
  global.fetch = mockFetch as unknown as typeof fetch;
  window.history.replaceState({}, '', 'http://localhost/listings/test-listing');
  mockGetCurrentHref.mockReturnValue('http://localhost/listings/test-listing');
  mockUseRouter.mockReturnValue({
    push: mockPush,
    refresh: mockRefresh,
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    prefetch: jest.fn(),
  });
});

afterAll(() => {
  global.fetch = originalFetch;
  window.history.replaceState({}, '', originalHref);
});

const fillReviewForm = (rating: number, comment: string) => {
  fireEvent.click(screen.getByTestId(`star-${rating}`));
  const textarea = screen.getByTestId('textarea') as HTMLTextAreaElement;
  fireEvent.change(textarea, { target: { value: '' } });
  fireEvent.change(textarea, { target: { value: comment } });
  return textarea;
};

describe('ReviewsSection', () => {
  it('validates review input using canSubmitReview helper', () => {
    expect(canSubmitReview(0, 'something')).toBe(false);
    expect(canSubmitReview(3, '   ')).toBe(false);
    expect(canSubmitReview(5, 'Great stay!')).toBe(true);
  });

  it('renders review metadata and calculates averages', () => {
    render(<ReviewsSection reviews={defaultReviews} listingId="test-listing" isSignedIn />);

    expect(screen.getByTestId('neo-card-title')).toHaveTextContent('Reviews (2)');
    expect(screen.getByText('4.5 average')).toBeInTheDocument();
    const [averageDisplay] = screen.getAllByTestId('star-rating-display');
    expect(averageDisplay).toHaveAttribute('data-rating', '4.5');
  });

  it('displays individual reviews with formatted dates and separators', () => {
    render(<ReviewsSection reviews={defaultReviews} listingId="test-listing" isSignedIn />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(
      screen.getByText('Excellent place! Great atmosphere and eco-friendly practices.')
    ).toBeInTheDocument();
    expect(screen.getByText('December 1, 2023')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Good location, friendly staff.')).toBeInTheDocument();
    expect(screen.getAllByTestId('separator')).toHaveLength(1);
  });

  it('surfaces pending reviews in a dedicated moderation section', () => {
    const pendingReview = {
      id: 'pending-1',
      rating: 4,
      comment: 'Awaiting moderation review.',
      user: { name: 'Pending Person' },
      createdAt: '2023-12-20T09:00:00Z',
      status: 'pending' as const,
    };

    render(
      <ReviewsSection
        reviews={[...defaultReviews, pendingReview]}
        listingId="test-listing"
        isSignedIn
      />
    );

    expect(screen.getByText('Your review is awaiting moderation')).toBeInTheDocument();
    expect(screen.getByText('Awaiting moderation review.')).toBeInTheDocument();
    expect(screen.getByText('Reviews (2)')).toBeInTheDocument();
    expect(screen.getByText('Pending Person')).toBeInTheDocument();
  });

  it('shows an empty state when there are no reviews', () => {
    render(<ReviewsSection reviews={[]} listingId="test-listing" isSignedIn />);

    expect(screen.getByText('No reviews yet')).toBeInTheDocument();
    expect(screen.getByText('Be the first to share your experience!')).toBeInTheDocument();
  });

  it('renders the sign-in prompt for non-authenticated users with callback', async () => {
    render(<ReviewsSection reviews={[]} listingId="test-listing" isSignedIn={false} />);

    await waitFor(() => {
      expect(screen.getByTestId('next-link')).toHaveAttribute(
        'href',
        `/auth/login?callbackUrl=http%3A%2F%2Flocalhost%2Flistings%2Ftest-listing`
      );
    });
    expect(screen.queryByText('Add Your Review')).not.toBeInTheDocument();
  });

  it('defaults to the signed-out experience when isSignedIn is omitted', async () => {
    render(<ReviewsSection reviews={[]} listingId="test-listing" />);

    await waitFor(() => {
      expect(screen.getByTestId('next-link')).toHaveAttribute(
        'href',
        `/auth/login?callbackUrl=http%3A%2F%2Flocalhost%2Flistings%2Ftest-listing`
      );
    });

    expect(screen.queryByText('Add Your Review')).not.toBeInTheDocument();
  });

  it('allows authenticated users to interact with the review form', async () => {
    render(<ReviewsSection reviews={[]} listingId="test-listing" isSignedIn />);

    expect(screen.getByTestId('neo-card-title')).toHaveTextContent('Reviews (0)');
    expect(screen.getByTestId('star-rating-interactive')).toBeInTheDocument();

    const submitButton = screen.getByRole('button', { name: /submit review/i });
    expect(submitButton).toBeDisabled();

    fillReviewForm(4, 'Great experience overall!');

    expect(submitButton).not.toBeDisabled();
  });

  it('submits a review successfully and refreshes the page', async () => {
    mockFetch.mockResolvedValue(mockResponse({ id: 'new-review' }) as unknown as FetchReturn);

    render(<ReviewsSection reviews={[]} listingId="test-listing" isSignedIn />);

    const textarea = fillReviewForm(5, 'Outstanding place!');
    const submitButton = screen.getByRole('button', { name: /submit review/i });

    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: 5,
          comment: 'Outstanding place!',
          listingId: 'test-listing',
        }),
      });
    });

    await waitFor(() => {
      expect(mockRefresh).toHaveBeenCalled();
    });

    const successMessage = await screen.findByTestId('review-success-message');
    expect(successMessage).toBeInTheDocument();
    expect(screen.getByTestId('submitted-review-status')).toHaveTextContent(/pending approval/i);
    expect(screen.getByTestId('submitted-review-comment')).toHaveTextContent('Outstanding place!');

    await waitFor(() => {
      expect(textarea).toHaveValue('');
    });
  });

  it('prevents submission without rating or a non-empty comment', async () => {
    render(<ReviewsSection reviews={[]} listingId="test-listing" isSignedIn />);

    const submitButton = screen.getByRole('button', { name: /submit review/i });
    fireEvent.click(submitButton);
    expect(submitButton).toBeDisabled();

    const textarea = fillReviewForm(5, '   ');
    expect(submitButton).toBeDisabled();

    fireEvent.change(textarea, { target: { value: '' } });
    fireEvent.change(textarea, { target: { value: 'Valid comment now' } });
    expect(submitButton).not.toBeDisabled();
  });

  it('redirects to login when the API returns 401 with captured callback URL', async () => {
    mockFetch.mockResolvedValue(
      mockResponse(
        { error: 'Unauthorized' },
        { status: 401, statusText: 'Unauthorized', ok: false }
      ) as unknown as FetchReturn
    );

    render(<ReviewsSection reviews={[]} listingId="test-listing" isSignedIn />);

    fillReviewForm(3, 'Needs login');
    fireEvent.click(screen.getByRole('button', { name: /submit review/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(
        '/auth/login?callbackUrl=http%3A%2F%2Flocalhost%2Flistings%2Ftest-listing'
      );
    });
  });

  it('falls back to root callback when location cannot be determined', async () => {
    window.history.replaceState({}, '', '/');
    mockGetCurrentHref.mockReturnValueOnce('');
    mockFetch.mockResolvedValue(
      mockResponse({ error: 'Unauthorized' }, { status: 401, ok: false }) as unknown as FetchReturn
    );

    render(<ReviewsSection reviews={[]} listingId="test-listing" isSignedIn />);

    fillReviewForm(4, 'Another login attempt');
    fireEvent.click(screen.getByRole('button', { name: /submit review/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/auth/login?callbackUrl=%2F');
    });
  });

  it('shows permission error when the API responds with 403', async () => {
    mockFetch.mockResolvedValue(
      mockResponse(
        { error: 'Forbidden' },
        { status: 403, statusText: 'Forbidden', ok: false }
      ) as unknown as FetchReturn
    );

    render(<ReviewsSection reviews={[]} listingId="test-listing" isSignedIn />);

    fillReviewForm(2, 'Permission test');
    fireEvent.click(screen.getByRole('button', { name: /submit review/i }));

    expect(
      await screen.findByText('You do not have permission to submit reviews.')
    ).toBeInTheDocument();
  });

  it('shows duplicate review error when the API responds with 409', async () => {
    mockFetch.mockResolvedValue(
      mockResponse(
        { error: 'Duplicate review' },
        { status: 409, ok: false }
      ) as unknown as FetchReturn
    );

    render(<ReviewsSection reviews={[]} listingId="test-listing" isSignedIn />);

    fillReviewForm(5, 'Already reviewed');
    fireEvent.click(screen.getByRole('button', { name: /submit review/i }));

    expect(await screen.findByText('You have already reviewed this listing.')).toBeInTheDocument();
  });

  it('surfaces API-provided error messages for other failures', async () => {
    mockFetch.mockResolvedValue(
      mockResponse(
        { error: 'Server error' },
        { status: 500, statusText: 'Internal Server Error', ok: false }
      ) as unknown as FetchReturn
    );

    render(<ReviewsSection reviews={[]} listingId="test-listing" isSignedIn />);

    fillReviewForm(1, 'Server failure');
    fireEvent.click(screen.getByRole('button', { name: /submit review/i }));

    expect(await screen.findByText('Server error')).toBeInTheDocument();
  });

  it('uses a default error message when the server omits details', async () => {
    mockFetch.mockResolvedValue(
      mockResponse(
        {},
        { status: 502, statusText: 'Bad Gateway', ok: false }
      ) as unknown as FetchReturn
    );

    render(<ReviewsSection reviews={[]} listingId="test-listing" isSignedIn />);

    fillReviewForm(4, 'Gateway issue');
    fireEvent.click(screen.getByRole('button', { name: /submit review/i }));

    expect(await screen.findByText('Failed to submit review')).toBeInTheDocument();
  });

  it('shows a fallback error when the request throws', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockFetch.mockRejectedValue(new Error('Network error'));

    render(<ReviewsSection reviews={[]} listingId="test-listing" isSignedIn />);

    fillReviewForm(3, 'Network issue');
    fireEvent.click(screen.getByRole('button', { name: /submit review/i }));

    expect(
      await screen.findByText('Failed to submit review. Please try again.')
    ).toBeInTheDocument();
    expect(consoleSpy).toHaveBeenCalledWith('Failed to submit review:', expect.any(Error));

    consoleSpy.mockRestore();
  });

  it('enforces the textarea length constraint', () => {
    render(<ReviewsSection reviews={[]} listingId="test-listing" isSignedIn />);

    expect(screen.getByTestId('textarea')).toHaveAttribute('maxLength', '2000');
  });

  it('accepts a wide range of characters in the comment field', () => {
    render(<ReviewsSection reviews={[]} listingId="test-listing" isSignedIn />);

    const textarea = screen.getByTestId('textarea');
    const value = 'Great place! Accents áéíóú 😊 — punctuation!?';
    fireEvent.change(textarea, { target: { value } });
    expect(textarea).toHaveValue(value);
  });
});
