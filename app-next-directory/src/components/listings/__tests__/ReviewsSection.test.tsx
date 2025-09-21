import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { ReviewsSection } from '../ReviewsSection';

// Mock useRouter
const mockPush = jest.fn();
const mockRefresh = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock StarRating component
const createMockStarRating = {
  StarRating: function MockStarRating({ rating, interactive, onRatingChange }: any) {
    if (interactive && onRatingChange) {
      return (
        <div data-testid="star-rating-interactive" data-rating={rating}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              data-testid={`star-${star}`}
              onClick={() => onRatingChange(star)}
            >★</button>
          ))}
        </div>
      );
    }
    return <div data-testid="star-rating-display" data-rating={rating}>★★★★★</div>;
  }
};

jest.mock('@/components/ui/StarRating', createMockStarRating);

// Mock UI components
jest.mock('@/components/ui/neo-card', () => ({
  NeoCard: function MockNeoCard({ children, className }: any) {
    return <div className={className} data-testid="neo-card">{children}</div>;
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
        onClick={onClick} 
        disabled={disabled}
        data-testid="neo-button"
        data-variant={variant}
        data-size={size}
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
  Textarea: function MockTextarea({ value, onChange, placeholder, disabled, rows, maxLength }: any) {
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

// Mock Next.js components
jest.mock('next/image', () => {
  return function MockImage({ src, alt, width, height }: any) {
    return <img src={src} alt={alt} width={width} height={height} data-testid="next-image" />;
  };
});

jest.mock('next/link', () => {
  return function MockLink({ href, children }: any) {
    return <a href={href} data-testid="next-link">{children}</a>;
  };
});

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000/listings/test-listing',
  },
  writable: true,
});

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;

describe('ReviewsSection', () => {
  const mockReviews = [
    {
      id: 'review-1',
      rating: 5,
      comment: 'Excellent place! Great atmosphere and eco-friendly practices.',
      user: { name: 'John Doe', image: '/john.jpg' },
      createdAt: '2023-12-01T10:00:00Z',
    },
    {
      id: 'review-2',
      rating: 4,
      comment: 'Good location, friendly staff.',
      user: { name: 'Jane Smith' },
      createdAt: '2023-11-15T14:30:00Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
    mockUseRouter.mockReturnValue({
      push: mockPush,
      refresh: mockRefresh,
      back: jest.fn(),
      forward: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    });
  });

  it('renders reviews section with correct title and count', () => {
    render(
      <ReviewsSection 
        reviews={mockReviews}
        listingId="listing-1"
        isSignedIn={true}
      />
    );

    expect(screen.getByTestId('neo-card-title')).toHaveTextContent('Reviews (2)');
  });

  it('calculates and displays average rating correctly', () => {
    render(
      <ReviewsSection 
        reviews={mockReviews}
        listingId="listing-1"
        isSignedIn={true}
      />
    );

    const averageRating = screen.getByText('4.5 average');
    expect(averageRating).toBeInTheDocument();
  });

  it('displays individual reviews with correct information', () => {
    render(
      <ReviewsSection 
        reviews={mockReviews}
        listingId="listing-1"
        isSignedIn={true}
      />
    );

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Excellent place! Great atmosphere and eco-friendly practices.')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Good location, friendly staff.')).toBeInTheDocument();
  });

  it('formats dates correctly', () => {
    render(
      <ReviewsSection 
        reviews={mockReviews}
        listingId="listing-1"
        isSignedIn={true}
      />
    );

    expect(screen.getByText('December 1, 2023')).toBeInTheDocument();
    expect(screen.getByText('November 15, 2023')).toBeInTheDocument();
  });

  it('displays user images when available', () => {
    render(
      <ReviewsSection 
        reviews={mockReviews}
        listingId="listing-1"
        isSignedIn={true}
      />
    );

    const images = screen.getAllByTestId('next-image');
    expect(images[0]).toHaveAttribute('src', '/john.jpg');
    expect(images[0]).toHaveAttribute('alt', 'John Doe');
  });

  it('displays user initials when image is not available', () => {
    render(
      <ReviewsSection 
        reviews={mockReviews}
        listingId="listing-1"
        isSignedIn={true}
      />
    );

    expect(screen.getByText('J')).toBeInTheDocument(); // Jane Smith's initial
  });

  it('shows empty state when no reviews are available', () => {
    render(
      <ReviewsSection 
        reviews={[]}
        listingId="listing-1"
        isSignedIn={true}
      />
    );

    expect(screen.getByText('No reviews yet')).toBeInTheDocument();
    expect(screen.getByText('Be the first to share your experience!')).toBeInTheDocument();
  });

  describe('Review Form - Signed In User', () => {
    it('renders review form for signed-in users', () => {
      render(
        <ReviewsSection 
          reviews={[]}
          listingId="listing-1"
          isSignedIn={true}
        />
      );

      expect(screen.getByText('Add Your Review')).toBeInTheDocument();
      expect(screen.getByText('Rating')).toBeInTheDocument();
      expect(screen.getByText('Comment')).toBeInTheDocument();
      expect(screen.getByTestId('star-rating-interactive')).toBeInTheDocument();
      expect(screen.getByTestId('textarea')).toBeInTheDocument();
    });

    it('allows user to select star rating', async () => {
      render(
        <ReviewsSection 
          reviews={[]}
          listingId="listing-1"
          isSignedIn={true}
        />
      );

      const star4 = screen.getByTestId('star-4');
      await userEvent.click(star4);

      expect(screen.getByTestId('star-rating-interactive')).toHaveAttribute('data-rating', '4');
    });

    it('allows user to enter comment text', async () => {
      render(
        <ReviewsSection 
          reviews={[]}
          listingId="listing-1"
          isSignedIn={true}
        />
      );

      const textarea = screen.getByTestId('textarea');
      await userEvent.type(textarea, 'This is a great place!');

      expect(textarea).toHaveValue('This is a great place!');
    });

    it('disables submit button when rating or comment is missing', () => {
      render(
        <ReviewsSection 
          reviews={[]}
          listingId="listing-1"
          isSignedIn={true}
        />
      );

      const submitButton = screen.getByRole('button', { name: /submit review/i });
      expect(submitButton).toBeDisabled();
    });

    it('enables submit button when both rating and comment are provided', async () => {
      render(
        <ReviewsSection 
          reviews={[]}
          listingId="listing-1"
          isSignedIn={true}
        />
      );

      const star5 = screen.getByTestId('star-5');
      await userEvent.click(star5);

      const textarea = screen.getByTestId('textarea');
      await userEvent.type(textarea, 'Excellent service!');

      const submitButton = screen.getByRole('button', { name: /submit review/i });
      expect(submitButton).not.toBeDisabled();
    });

    it('submits review successfully', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: 'new-review-id' }),
      });

      render(
        <ReviewsSection 
          reviews={[]}
          listingId="listing-1"
          isSignedIn={true}
        />
      );

      const star4 = screen.getByTestId('star-4');
      await userEvent.click(star4);

      const textarea = screen.getByTestId('textarea');
      await userEvent.type(textarea, 'Great experience overall!');

      const submitButton = screen.getByRole('button', { name: /submit review/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/reviews', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rating: 4,
            comment: 'Great experience overall!',
            listingId: 'listing-1',
          }),
        });
      });

      await waitFor(() => {
        expect(mockRefresh).toHaveBeenCalled();
      });

      expect(screen.getByText(/thank you.*submitted.*pending approval/i)).toBeInTheDocument();
    });

    it('validates comment length limit', async () => {
      render(
        <ReviewsSection 
          reviews={[]}
          listingId="listing-1"
          isSignedIn={true}
        />
      );

      const textarea = screen.getByTestId('textarea');
      expect(textarea).toHaveAttribute('maxLength', '2000');
    });

    it('shows loading state during submission', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockFetch.mockReturnValue(promise);

      render(
        <ReviewsSection 
          reviews={[]}
          listingId="listing-1"
          isSignedIn={true}
        />
      );

      const star5 = screen.getByTestId('star-5');
      await userEvent.click(star5);

      const textarea = screen.getByTestId('textarea');
      await userEvent.type(textarea, 'Loading test');

      const submitButton = screen.getByRole('button', { name: /submit review/i });
      await userEvent.click(submitButton);

      expect(screen.getByText('Submitting...')).toBeInTheDocument();
      expect(textarea).toBeDisabled();

      resolvePromise!({
        ok: true,
        json: () => Promise.resolve({ id: 'new-review-id' }),
      });
    });

    it('redirects to login when API returns 401', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'Unauthorized' }),
      });

      render(
        <ReviewsSection 
          reviews={[]}
          listingId="listing-1"
          isSignedIn={true}
        />
      );

      const star3 = screen.getByTestId('star-3');
      await userEvent.click(star3);

      const textarea = screen.getByTestId('textarea');
      await userEvent.type(textarea, 'Test comment');

      const submitButton = screen.getByRole('button', { name: /submit review/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/auth/login?callbackUrl=http%3A//localhost%3A3000/listings/test-listing');
      });
    });

    it('shows permission error for 403 response', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 403,
        json: () => Promise.resolve({ error: 'Forbidden' }),
      });

      render(
        <ReviewsSection 
          reviews={[]}
          listingId="listing-1"
          isSignedIn={true}
        />
      );

      const star2 = screen.getByTestId('star-2');
      await userEvent.click(star2);

      const textarea = screen.getByTestId('textarea');
      await userEvent.type(textarea, 'Permission test');

      const submitButton = screen.getByRole('button', { name: /submit review/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('You do not have permission to submit reviews.')).toBeInTheDocument();
      });
    });

    it('shows duplicate review error for 409 response', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 409,
        json: () => Promise.resolve({ error: 'Duplicate review' }),
      });

      render(
        <ReviewsSection 
          reviews={[]}
          listingId="listing-1"
          isSignedIn={true}
        />
      );

      const star5 = screen.getByTestId('star-5');
      await userEvent.click(star5);

      const textarea = screen.getByTestId('textarea');
      await userEvent.type(textarea, 'Duplicate test');

      const submitButton = screen.getByRole('button', { name: /submit review/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('You have already reviewed this listing.')).toBeInTheDocument();
      });
    });

    it('handles API errors gracefully', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Server error' }),
      });

      render(
        <ReviewsSection 
          reviews={[]}
          listingId="listing-1"
          isSignedIn={true}
        />
      );

      const star1 = screen.getByTestId('star-1');
      await userEvent.click(star1);

      const textarea = screen.getByTestId('textarea');
      await userEvent.type(textarea, 'Error test');

      const submitButton = screen.getByRole('button', { name: /submit review/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Server error')).toBeInTheDocument();
      });
    });

    it('handles network errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      mockFetch.mockRejectedValue(new Error('Network error'));

      render(
        <ReviewsSection 
          reviews={[]}
          listingId="listing-1"
          isSignedIn={true}
        />
      );

      const star3 = screen.getByTestId('star-3');
      await userEvent.click(star3);

      const textarea = screen.getByTestId('textarea');
      await userEvent.type(textarea, 'Network test');

      const submitButton = screen.getByRole('button', { name: /submit review/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to submit review. Please try again.')).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Sign-in prompt for non-authenticated users', () => {
    it('shows sign-in prompt for non-authenticated users', async () => {
      render(
        <ReviewsSection 
          reviews={[]}
          listingId="listing-1"
          isSignedIn={false}
        />
      );

      expect(screen.getByText('Sign in to leave a review')).toBeInTheDocument();
      
      // Wait for the useEffect to set the callback URL
      await waitFor(() => {
        const link = screen.getByTestId('next-link');
        expect(link).toHaveAttribute('href', expect.stringContaining('/auth/login?callbackUrl='));
      });
    });

    it('does not show review form for non-authenticated users', () => {
      render(
        <ReviewsSection 
          reviews={[]}
          listingId="listing-1"
          isSignedIn={false}
        />
      );

      expect(screen.queryByText('Add Your Review')).not.toBeInTheDocument();
      expect(screen.queryByTestId('star-rating-interactive')).not.toBeInTheDocument();
      expect(screen.queryByTestId('textarea')).not.toBeInTheDocument();
    });
  });

  describe('Star Rating Validation', () => {
    it('accepts valid star ratings from 1 to 5', async () => {
      render(
        <ReviewsSection 
          reviews={[]}
          listingId="listing-1"
          isSignedIn={true}
        />
      );

      for (let rating = 1; rating <= 5; rating++) {
        const star = screen.getByTestId(`star-${rating}`);
        await userEvent.click(star);
        
        expect(screen.getByTestId('star-rating-interactive')).toHaveAttribute('data-rating', rating.toString());
      }
    });

    it('requires rating selection before enabling submit', () => {
      render(
        <ReviewsSection 
          reviews={[]}
          listingId="listing-1"
          isSignedIn={true}
        />
      );

      const submitButton = screen.getByRole('button', { name: /submit review/i });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Review Field String Validation', () => {
    it('requires non-empty comment for submission', async () => {
      render(
        <ReviewsSection 
          reviews={[]}
          listingId="listing-1"
          isSignedIn={true}
        />
      );
      const star5 = screen.getByTestId('star-5');
      await userEvent.click(star5);

      const submitButton = screen.getByRole('button', { name: /submit review/i });
      expect(submitButton).toBeDisabled();

      const textarea = screen.getByTestId('textarea');
      await userEvent.type(textarea, '   '); // Only whitespace

      expect(submitButton).toBeDisabled();

      await userEvent.clear(textarea);
      await userEvent.type(textarea, 'Valid comment');

      expect(submitButton).not.toBeDisabled();
    });

    it('enforces maximum character limit', () => {
      render(
        <ReviewsSection 
          reviews={[]}
          listingId="listing-1"
          isSignedIn={true}
        />
      );

      const textarea = screen.getByTestId('textarea');
      expect(textarea).toHaveAttribute('maxLength', '2000');
    });

    it('accepts valid string characters and formats', async () => {
      render(
        <ReviewsSection 
          reviews={[]}
          listingId="listing-1"
          isSignedIn={true}
        />
      );

      const textarea = screen.getByTestId('textarea');
      const validComment = 'Great place! 5/5 stars. Special chars: áéíóú, emojis: 😊, numbers: 123, punctuation: !@#$%';
      
      await userEvent.type(textarea, validComment);
      expect(textarea).toHaveValue(validComment);
    });
  });
});