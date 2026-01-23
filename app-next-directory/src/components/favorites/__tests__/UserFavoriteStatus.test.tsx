import { render, screen } from '@testing-library/react';
import UserFavoriteStatus from '../UserFavoriteStatus';

// Mock auth
jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));

// Mock favorites DAL
jest.mock('@/lib/data-access/favorites.dal', () => ({
  checkIsFavorited: jest.fn(),
}));

// Mock FavoriteButton
jest.mock('../FavoriteButton', () => ({
  FavoriteButton: ({
    listingId,
    slug,
    listingTitle,
    initialIsFavorited,
    className,
    showText,
    size,
  }: any) => (
    <button
      data-testid="favorite-button"
      data-listing-id={listingId}
      data-slug={slug}
      data-listing-title={listingTitle}
      data-initial-favorited={initialIsFavorited}
      className={className}
      data-show-text={showText}
      data-size={size}
    >
      Favorite Button
    </button>
  ),
}));

// Import mocked functions
import { auth } from '@/lib/auth';
import { checkIsFavorited } from '@/lib/data-access/favorites.dal';

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockCheckIsFavorited = checkIsFavorited as jest.MockedFunction<typeof checkIsFavorited>;

describe('UserFavoriteStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders skeleton while loading', () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
      } as any);
      mockCheckIsFavorited.mockResolvedValue(false);

      render(
        <UserFavoriteStatus
          listingId="listing-123"
          slug="test-listing"
          listingTitle="Test Listing"
        />
      );

      // Should show loading skeleton initially (before Suspense resolves)
      const skeleton = screen.getByLabelText('Loading favorite status');
      expect(skeleton).toBeInTheDocument();
    });
  });

  describe('Skeleton Button', () => {
    it('renders skeleton with correct size', () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
      } as any);
      mockCheckIsFavorited.mockResolvedValue(false);

      render(
        <UserFavoriteStatus
          listingId="listing-123"
          slug="test-listing"
          size="lg"
        />
      );

      const skeleton = screen.getByLabelText('Loading favorite status');
      const svg = skeleton.querySelector('svg');
      expect(svg).toHaveClass('size-8'); // lg size
    });

    it('renders skeleton with small size', () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
      } as any);
      mockCheckIsFavorited.mockResolvedValue(false);

      render(
        <UserFavoriteStatus
          listingId="listing-123"
          slug="test-listing"
          size="sm"
        />
      );

      const skeleton = screen.getByLabelText('Loading favorite status');
      const svg = skeleton.querySelector('svg');
      expect(svg).toHaveClass('size-4'); // sm size
    });

    it('renders skeleton with medium size by default', () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
      } as any);
      mockCheckIsFavorited.mockResolvedValue(false);

      render(
        <UserFavoriteStatus
          listingId="listing-123"
          slug="test-listing"
        />
      );

      const skeleton = screen.getByLabelText('Loading favorite status');
      const svg = skeleton.querySelector('svg');
      expect(svg).toHaveClass('size-6'); // md size (default)
    });

    it('skeleton button is disabled', () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
      } as any);
      mockCheckIsFavorited.mockResolvedValue(false);

      render(
        <UserFavoriteStatus
          listingId="listing-123"
          slug="test-listing"
        />
      );

      const skeleton = screen.getByLabelText('Loading favorite status');
      expect(skeleton).toBeDisabled();
    });

    it('skeleton has animate-pulse class', () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
      } as any);
      mockCheckIsFavorited.mockResolvedValue(false);

      render(
        <UserFavoriteStatus
          listingId="listing-123"
          slug="test-listing"
        />
      );

      const skeleton = screen.getByLabelText('Loading favorite status');
      const svg = skeleton.querySelector('svg');
      expect(svg).toHaveClass('animate-pulse');
    });

    it('applies custom className to skeleton', () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
      } as any);
      mockCheckIsFavorited.mockResolvedValue(false);

      render(
        <UserFavoriteStatus
          listingId="listing-123"
          slug="test-listing"
          className="custom-class"
        />
      );

      const skeleton = screen.getByLabelText('Loading favorite status');
      expect(skeleton).toHaveClass('custom-class');
    });
  });

  describe('Component Structure', () => {
    it('renders without errors', () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
      } as any);
      mockCheckIsFavorited.mockResolvedValue(false);

      expect(() => {
        render(
          <UserFavoriteStatus
            listingId="listing-123"
            slug="test-listing"
          />
        );
      }).not.toThrow();
    });

    it('renders with various prop combinations', () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
      } as any);
      mockCheckIsFavorited.mockResolvedValue(false);

      expect(() => {
        render(
          <UserFavoriteStatus
            listingId="listing-456"
            slug="eco-hotel"
            listingTitle="Eco Hotel"
            className="custom-class"
            showText={true}
            size="lg"
          />
        );
      }).not.toThrow();
    });
  });
});
