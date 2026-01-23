import { render, screen } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import { FavoriteButtonOverlay } from '../FavoriteButtonOverlay';

// Mock next-auth
jest.mock('next-auth/react');
const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;

// Mock FavoriteButton component
jest.mock('@/components/favorites/FavoriteButton', () => ({
  FavoriteButton: ({
    listingId,
    listingTitle,
    size,
    className,
    initialIsFavorited,
    ...rest
  }: any) => (
    <button
      data-testid="favorite-button"
      data-listing-id={listingId}
      data-listing-title={listingTitle}
      data-size={size}
      className={className}
      data-initial-favorited={initialIsFavorited}
      {...rest}
    >
      Favorite
    </button>
  ),
}));

describe('FavoriteButtonOverlay', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: jest.fn(),
    });
  });

  describe('Basic Rendering', () => {
    it('renders the FavoriteButton component', () => {
      render(
        <FavoriteButtonOverlay
          listingSlug="test-listing"
          listingTitle="Test Listing"
        />
      );

      const button = screen.getByTestId('favorite-button');
      expect(button).toBeInTheDocument();
    });

    it('passes listingSlug to FavoriteButton as listingId', () => {
      render(
        <FavoriteButtonOverlay
          listingSlug="eco-hotel-bangkok"
          listingTitle="Eco Hotel Bangkok"
        />
      );

      const button = screen.getByTestId('favorite-button');
      expect(button).toHaveAttribute('data-listing-id', 'eco-hotel-bangkok');
    });

    it('passes listingTitle to FavoriteButton', () => {
      render(
        <FavoriteButtonOverlay
          listingSlug="test-slug"
          listingTitle="Amazing Eco Hotel"
        />
      );

      const button = screen.getByTestId('favorite-button');
      expect(button).toHaveAttribute('data-listing-title', 'Amazing Eco Hotel');
    });

    it('sets size prop to "sm" by default', () => {
      render(
        <FavoriteButtonOverlay
          listingSlug="test-listing"
          listingTitle="Test Listing"
        />
      );

      const button = screen.getByTestId('favorite-button');
      expect(button).toHaveAttribute('data-size', 'sm');
    });
  });

  describe('Props Passing', () => {
    it('passes initialIsFavorited prop when provided', () => {
      render(
        <FavoriteButtonOverlay
          listingSlug="test-listing"
          listingTitle="Test Listing"
          initialIsFavorited={true}
        />
      );

      const button = screen.getByTestId('favorite-button');
      expect(button).toHaveAttribute('data-initial-favorited', 'true');
    });

    it('passes initialIsFavorited as false when provided', () => {
      render(
        <FavoriteButtonOverlay
          listingSlug="test-listing"
          listingTitle="Test Listing"
          initialIsFavorited={false}
        />
      );

      const button = screen.getByTestId('favorite-button');
      expect(button).toHaveAttribute('data-initial-favorited', 'false');
    });

    it('does not pass initialIsFavorited when not provided', () => {
      render(
        <FavoriteButtonOverlay
          listingSlug="test-listing"
          listingTitle="Test Listing"
        />
      );

      const button = screen.getByTestId('favorite-button');
      expect(button).not.toHaveAttribute('data-initial-favorited');
    });

    it('applies custom className when provided', () => {
      render(
        <FavoriteButtonOverlay
          listingSlug="test-listing"
          listingTitle="Test Listing"
          className="custom-class"
        />
      );

      const button = screen.getByTestId('favorite-button');
      expect(button).toHaveClass('custom-class');
    });

    it('applies default className when not provided', () => {
      render(
        <FavoriteButtonOverlay
          listingSlug="test-listing"
          listingTitle="Test Listing"
        />
      );

      const button = screen.getByTestId('favorite-button');
      expect(button).toHaveClass('bg-white/90');
      expect(button).toHaveClass('hover:bg-white');
    });

    it('overrides default className when custom className is provided', () => {
      render(
        <FavoriteButtonOverlay
          listingSlug="test-listing"
          listingTitle="Test Listing"
          className="bg-red-500"
        />
      );

      const button = screen.getByTestId('favorite-button');
      expect(button).toHaveClass('bg-red-500');
      expect(button).not.toHaveClass('bg-white/90');
    });
  });

  describe('Data Attributes', () => {
    it('sets data-testid attribute', () => {
      render(
        <FavoriteButtonOverlay
          listingSlug="test-listing"
          listingTitle="Test Listing"
        />
      );

      const button = screen.getByTestId('favorite-button');
      expect(button).toHaveAttribute('data-testid', 'favorite-button');
    });

    it('sets data-listing-id attribute', () => {
      render(
        <FavoriteButtonOverlay
          listingSlug="my-listing-slug"
          listingTitle="Test Listing"
        />
      );

      const button = screen.getByTestId('favorite-button');
      expect(button).toHaveAttribute('data-listing-id', 'my-listing-slug');
    });

    it('sets data-listing-title attribute', () => {
      render(
        <FavoriteButtonOverlay
          listingSlug="test-slug"
          listingTitle="My Custom Title"
        />
      );

      const button = screen.getByTestId('favorite-button');
      expect(button).toHaveAttribute('data-listing-title', 'My Custom Title');
    });
  });

  describe('Edge Cases', () => {
    it('handles empty listingSlug gracefully', () => {
      render(
        <FavoriteButtonOverlay
          listingSlug=""
          listingTitle="Test Listing"
        />
      );

      const button = screen.getByTestId('favorite-button');
      expect(button).toHaveAttribute('data-listing-id', '');
    });

    it('handles empty listingTitle gracefully', () => {
      render(
        <FavoriteButtonOverlay
          listingSlug="test-slug"
          listingTitle=""
        />
      );

      const button = screen.getByTestId('favorite-button');
      expect(button).toHaveAttribute('data-listing-title', '');
    });

    it('handles special characters in listingTitle', () => {
      render(
        <FavoriteButtonOverlay
          listingSlug="test-slug"
          listingTitle='Café & Restaurant "The Green"'
        />
      );

      const button = screen.getByTestId('favorite-button');
      expect(button).toHaveAttribute('data-listing-title', 'Café & Restaurant "The Green"');
    });

    it('handles long listingTitle', () => {
      const longTitle = 'A'.repeat(200);
      render(
        <FavoriteButtonOverlay
          listingSlug="test-slug"
          listingTitle={longTitle}
        />
      );

      const button = screen.getByTestId('favorite-button');
      expect(button).toHaveAttribute('data-listing-title', longTitle);
    });

    it('handles slug with special characters', () => {
      render(
        <FavoriteButtonOverlay
          listingSlug="café-eco-friendly-&-sustainable"
          listingTitle="Test Listing"
        />
      );

      const button = screen.getByTestId('favorite-button');
      expect(button).toHaveAttribute('data-listing-id', 'café-eco-friendly-&-sustainable');
    });
  });

  describe('Component Structure', () => {
    it('renders as a client component', () => {
      // FavoriteButtonOverlay is marked with 'use client'
      // This is a smoke test to ensure it renders without errors
      const { container } = render(
        <FavoriteButtonOverlay
          listingSlug="test-slug"
          listingTitle="Test Listing"
        />
      );

      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders only the FavoriteButton without wrapper elements', () => {
      const { container } = render(
        <FavoriteButtonOverlay
          listingSlug="test-slug"
          listingTitle="Test Listing"
        />
      );

      // The component should render only the button, no extra wrappers
      expect(container.firstChild).toBe(screen.getByTestId('favorite-button'));
    });
  });
});
