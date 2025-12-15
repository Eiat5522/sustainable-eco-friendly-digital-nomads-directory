/**
 * ReviewsSection Navigation Tests
 *
 * This file contains Jest/RTL tests for deterministic navigation flows in ReviewsSection.
 * These tests verify redirect/callbackUrl behavior that was previously tested via Playwright E2E.
 *
 * Covered E2E scenarios:
 * - #153: should show sign-in prompt with correct callbackUrl
 * - #154: should navigate to login with callbackUrl when Sign In clicked
 * - #158: should redirect to login on 401 response with callbackUrl
 * - #159: should show success message on 200 response
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { getCurrentHref } from '@/utils/navigation';
import { ReviewsSection } from '../ReviewsSection';

type FetchReturn = Awaited<ReturnType<typeof fetch>>;

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/utils/navigation', () => ({
  getCurrentHref: jest.fn(),
}));

jest.mock('@/components/ui/StarRating', () => ({
  StarRating: function MockStarRating({ rating, interactive, onRatingChange }: any) {
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
  NeoCard: function MockNeoCard({ children }: any) {
    return <div data-testid="neo-card">{children}</div>;
  },
  NeoCardHeader: function MockNeoCardHeader({ children }: any) {
    return <div data-testid="neo-card-header">{children}</div>;
  },
  NeoCardTitle: function MockNeoCardTitle({ children }: any) {
    return <h2 data-testid="neo-card-title">{children}</h2>;
  },
  NeoCardContent: function MockNeoCardContent({ children }: any) {
    return <div data-testid="neo-card-content">{children}</div>;
  },
}));

jest.mock('@/components/ui/neo-button', () => ({
  NeoButton: function MockNeoButton({ children, onClick, disabled, variant, size }: any) {
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
  }: any) {
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
  default: function MockImage({ src, alt, ...rest }: any) {
    return <span role="img" data-testid="next-image" data-src={src} aria-label={alt} {...rest} />;
  },
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: function MockLink({ href, children }: any) {
    return (
      <a data-testid="next-link" href={href}>
        {children}
      </a>
    );
  },
}));

const mockFetch = jest.fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>();
const mockPush = jest.fn();
const mockRefresh = jest.fn();

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

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockGetCurrentHref = getCurrentHref as jest.MockedFunction<typeof getCurrentHref>;

const fillReviewForm = (rating: number, comment: string) => {
  fireEvent.click(screen.getByTestId(`star-${rating}`));
  const textarea = screen.getByTestId('textarea') as HTMLTextAreaElement;
  fireEvent.change(textarea, { target: { value: comment } });
  return textarea;
};

describe('ReviewsSection - Deterministic Navigation Flows', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();
    global.fetch = mockFetch as unknown as typeof fetch;
    mockGetCurrentHref.mockReturnValue('http://localhost/listings/eco-cafe');
    mockUseRouter.mockReturnValue({
      push: mockPush,
      refresh: mockRefresh,
      replace: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      prefetch: jest.fn(),
    });
  });

  describe('Unauthenticated User Sign-in Prompts', () => {
    // E2E Test #153: should show sign-in prompt with correct callbackUrl
    it('renders sign-in prompt with properly encoded callbackUrl in link href', async () => {
      render(<ReviewsSection reviews={[]} listingId="eco-cafe" isSignedIn={false} />);

      await waitFor(() => {
        const signInLink = screen.getByTestId('next-link');
        expect(signInLink).toHaveAttribute(
          'href',
          '/auth/login?callbackUrl=http%3A%2F%2Flocalhost%2Flistings%2Feco-cafe'
        );
      });

      expect(screen.getByText('Sign in to leave a review')).toBeInTheDocument();
      expect(screen.getByText('Sign In')).toBeInTheDocument();
    });

    // E2E Test #154: should navigate to login with callbackUrl when Sign In clicked
    // Note: In Jest/RTL, we verify the link's href attribute is correct.
    // Actual navigation behavior is browser-native and doesn't need testing in unit tests.
    it('has correct href on sign-in link that would navigate to login with callbackUrl', async () => {
      mockGetCurrentHref.mockReturnValue('http://localhost:3000/listings/sustainable-hotel');

      render(<ReviewsSection reviews={[]} listingId="sustainable-hotel" isSignedIn={false} />);

      await waitFor(() => {
        const signInLink = screen.getByTestId('next-link');
        const href = signInLink.getAttribute('href');

        expect(href).toBe(
          '/auth/login?callbackUrl=http%3A%2F%2Flocalhost%3A3000%2Flistings%2Fsustainable-hotel'
        );

        // Verify the callbackUrl can be decoded correctly
        const url = new URL(href!, 'http://localhost');
        const callbackUrl = url.searchParams.get('callbackUrl');
        expect(callbackUrl).toBe('http://localhost:3000/listings/sustainable-hotel');
      });
    });

    it('uses root path as fallback callbackUrl when current location is unavailable', async () => {
      mockGetCurrentHref.mockReturnValue('');

      render(<ReviewsSection reviews={[]} listingId="test-listing" isSignedIn={false} />);

      await waitFor(() => {
        const signInLink = screen.getByTestId('next-link');
        // When callbackUrl is empty string, the component should show just /auth/login
        expect(signInLink).toHaveAttribute('href', '/auth/login');
      });
    });
  });

  describe('Authenticated User Review Submission', () => {
    // E2E Test #158: should redirect to login on 401 response with callbackUrl
    it('redirects to /auth/login with encoded callbackUrl on 401 API response', async () => {
      mockFetch.mockResolvedValue(
        mockResponse(
          { error: 'Unauthorized' },
          { status: 401, statusText: 'Unauthorized', ok: false }
        ) as unknown as FetchReturn
      );

      render(<ReviewsSection reviews={[]} listingId="eco-cafe" isSignedIn />);

      fillReviewForm(4, 'Great sustainable practices!');
      const submitButton = screen.getByRole('button', { name: /submit review/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          '/auth/login?callbackUrl=http%3A%2F%2Flocalhost%2Flistings%2Feco-cafe'
        );
      });

      // Verify the fetch was attempted with correct payload
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/reviews',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rating: 4,
            comment: 'Great sustainable practices!',
            listingId: 'eco-cafe',
          }),
        })
      );
    });

    it('uses fallback callbackUrl on 401 when current location is unavailable', async () => {
      mockGetCurrentHref.mockReturnValue('');
      mockFetch.mockResolvedValue(
        mockResponse(
          { error: 'Unauthorized' },
          { status: 401, ok: false }
        ) as unknown as FetchReturn
      );

      render(<ReviewsSection reviews={[]} listingId="test-listing" isSignedIn />);

      fillReviewForm(3, 'Test review');
      fireEvent.click(screen.getByRole('button', { name: /submit review/i }));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/auth/login?callbackUrl=%2F');
      });
    });

    // E2E Test #159: should show success message on 200 response
    it('displays success message and resets form on 200 API response', async () => {
      mockFetch.mockResolvedValue(
        mockResponse({
          id: 'review-123',
          rating: 5,
          comment: 'Excellent eco-friendly venue!',
          approved: false,
        }) as unknown as FetchReturn
      );

      render(<ReviewsSection reviews={[]} listingId="eco-cafe" isSignedIn />);

      const textarea = fillReviewForm(5, 'Excellent eco-friendly venue!');
      const submitButton = screen.getByRole('button', { name: /submit review/i });

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });

      fireEvent.click(submitButton);

      // Verify success message appears
      const successMessage = await screen.findByTestId('review-success-message');
      expect(successMessage).toBeInTheDocument();
      expect(successMessage).toHaveTextContent(
        /Thank you! Your review has been submitted and is pending approval/i
      );

      // Verify form is reset
      await waitFor(() => {
        expect(textarea).toHaveValue('');
      });

      // Verify page refresh was triggered
      expect(mockRefresh).toHaveBeenCalled();

      // Verify the correct API call was made
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/reviews',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rating: 5,
            comment: 'Excellent eco-friendly venue!',
            listingId: 'eco-cafe',
          }),
        })
      );
    });

    it('shows success message even when API response lacks detailed payload', async () => {
      mockFetch.mockResolvedValue(
        mockResponse({}, { status: 200, ok: true }) as unknown as FetchReturn
      );

      render(<ReviewsSection reviews={[]} listingId="eco-cafe" isSignedIn />);

      fillReviewForm(4, 'Good place');
      fireEvent.click(screen.getByRole('button', { name: /submit review/i }));

      const successMessage = await screen.findByTestId('review-success-message');
      expect(successMessage).toBeInTheDocument();
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  describe('CallbackUrl Encoding Edge Cases', () => {
    it('properly encodes callbackUrl with special characters', async () => {
      mockGetCurrentHref.mockReturnValue(
        'http://localhost/listings/café-écologique?tab=reviews&filter=new'
      );

      render(<ReviewsSection reviews={[]} listingId="test" isSignedIn={false} />);

      await waitFor(() => {
        const signInLink = screen.getByTestId('next-link');
        const href = signInLink.getAttribute('href');

        // Verify URL is properly encoded
        expect(href).toContain('callbackUrl=');
        const url = new URL(href!, 'http://localhost');
        const callbackUrl = url.searchParams.get('callbackUrl');
        expect(callbackUrl).toBe(
          'http://localhost/listings/café-écologique?tab=reviews&filter=new'
        );
      });
    });

    it('handles callbackUrl redirect for 401 with complex URL parameters', async () => {
      mockGetCurrentHref.mockReturnValue(
        'http://localhost/listings/test?sort=rating&min=4#reviews'
      );
      mockFetch.mockResolvedValue(
        mockResponse(
          { error: 'Unauthorized' },
          { status: 401, ok: false }
        ) as unknown as FetchReturn
      );

      render(<ReviewsSection reviews={[]} listingId="test" isSignedIn />);

      fillReviewForm(5, 'Test');
      fireEvent.click(screen.getByRole('button', { name: /submit review/i }));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('/auth/login?callbackUrl='));
        const callArg = mockPush.mock.calls[0][0];
        const url = new URL(callArg, 'http://localhost');
        const callbackUrl = url.searchParams.get('callbackUrl');
        expect(callbackUrl).toBe('http://localhost/listings/test?sort=rating&min=4#reviews');
      });
    });
  });
});
