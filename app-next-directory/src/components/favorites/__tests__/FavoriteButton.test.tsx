import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FavoriteButton } from '../FavoriteButton';
import { useSession } from 'next-auth/react';

// Mock next-auth
jest.mock('next-auth/react');
const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;

// Mock fetch using jest.spyOn
const mockFetch = jest.fn();
let fetchSpy: jest.SpyInstance;

// Mock alert
global.alert = jest.fn();

describe('FavoriteButton', () => {
  beforeAll(() => {
    // Set up fetch spy once before all tests
    fetchSpy = jest.spyOn(global, 'fetch').mockImplementation(mockFetch as any);
  });

  afterAll(() => {
    // Restore original fetch after all tests
    fetchSpy.mockRestore();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();
    (global.alert as jest.Mock).mockClear();
    // Reset the useSession mock to unauthenticated state
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: jest.fn(),
    });
  });

  describe('Basic Rendering', () => {
    it('renders the button', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn(),
      });

      render(<FavoriteButton slug="test-listing" />);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('throws error when neither slug nor listingId is provided', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn(),
      });

      // Suppress console.error for this test
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        render(<FavoriteButton />);
      }).toThrow('FavoriteButton requires either slug or listingId prop');

      consoleError.mockRestore();
    });

    it('accepts listingId prop for backward compatibility', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn(),
      });

      render(<FavoriteButton listingId="legacy-id" />);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('prefers slug over listingId when both are provided', async () => {
      mockUseSession.mockReturnValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        status: 'authenticated',
        update: jest.fn(),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ favorited: false }),
      } as Response);

      render(<FavoriteButton slug="preferred-slug" listingId="legacy-id" />);
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/user/favorites/preferred-slug');
      });
    });

    it('displays heart icon', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn(),
      });

      const { container } = render(<FavoriteButton slug="test-listing" />);
      const heartIcon = container.querySelector('svg');
      expect(heartIcon).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('shows loading state while checking favorite status', () => {
      mockUseSession.mockReturnValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        status: 'authenticated',
        update: jest.fn(),
      });

      mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<FavoriteButton slug="test-listing" />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Checking favorite status');
      expect(button).toBeDisabled();
      expect(button).toHaveClass('animate-pulse');
    });

    it('skips loading state when initialIsFavorited is provided', () => {
      mockUseSession.mockReturnValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        status: 'authenticated',
        update: jest.fn(),
      });

      render(<FavoriteButton slug="test-listing" initialIsFavorited={true} />);
      
      const button = screen.getByRole('button');
      expect(button).not.toHaveAttribute('aria-label', 'Checking favorite status');
      expect(button).not.toBeDisabled();
    });
  });

  describe('Authentication Handling', () => {
    it('allows interaction when not authenticated', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn(),
      });

      render(<FavoriteButton slug="test-listing" />);
      const button = screen.getByRole('button');
      expect(button).not.toBeDisabled();
    });

    it('shows alert when unauthenticated user clicks button', async () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn(),
      });

      render(<FavoriteButton slug="test-listing" />);
      const button = screen.getByRole('button');
      
      await userEvent.click(button);
      
      expect(global.alert).toHaveBeenCalledWith('Please sign in to save favorites');
    });

    it('checks favorite status when authenticated', async () => {
      mockUseSession.mockReturnValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        status: 'authenticated',
        update: jest.fn(),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ favorited: true }),
      } as Response);

      render(<FavoriteButton slug="test-listing" />);
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/user/favorites/test-listing');
      });
    });
  });

  describe('Favorite Status Display', () => {
    it('displays unfavorited state correctly', async () => {
      mockUseSession.mockReturnValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        status: 'authenticated',
        update: jest.fn(),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ favorited: false }),
      } as Response);

      render(<FavoriteButton slug="test-listing" listingTitle="Eco Hotel" />);
      
      await waitFor(() => {
        const button = screen.getByRole('button');
        expect(button).toHaveAttribute('aria-label', 'Add to favorites');
        expect(button).toHaveAttribute('title', 'Add "Eco Hotel" to favorites');
      });
    });

    it('displays favorited state correctly', async () => {
      mockUseSession.mockReturnValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        status: 'authenticated',
        update: jest.fn(),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ favorited: true }),
      } as Response);

      render(<FavoriteButton slug="test-listing" listingTitle="Eco Hotel" />);
      
      await waitFor(() => {
        const button = screen.getByRole('button');
        expect(button).toHaveAttribute('aria-label', 'Remove from favorites');
        expect(button).toHaveAttribute('title', 'Remove "Eco Hotel" from favorites');
      });
    });

    it('applies favorited class when item is favorited', async () => {
      mockUseSession.mockReturnValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        status: 'authenticated',
        update: jest.fn(),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ favorited: true }),
      } as Response);

      render(<FavoriteButton slug="test-listing" />);
      
      await waitFor(() => {
        const button = screen.getByRole('button');
        expect(button).toHaveClass('favorited');
      });
    });

    it('shows filled heart icon when favorited', async () => {
      mockUseSession.mockReturnValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        status: 'authenticated',
        update: jest.fn(),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ favorited: true }),
      } as Response);

      const { container } = render(<FavoriteButton slug="test-listing" />);
      
      await waitFor(() => {
        const heartIcon = container.querySelector('svg');
        expect(heartIcon).toHaveClass('fill-red-500');
        expect(heartIcon).toHaveClass('text-red-500');
      });
    });
  });

  describe('Toggle Favorite Functionality', () => {
    it('adds listing to favorites when clicking unfavorited button', async () => {
      mockUseSession.mockReturnValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        status: 'authenticated',
        update: jest.fn(),
      });

      // Initial status check
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ favorited: false }),
      } as Response);

      // Add to favorites request
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      render(<FavoriteButton slug="test-listing" />);
      
      await waitFor(() => {
        expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Add to favorites');
      });

      const button = screen.getByRole('button');
      await userEvent.click(button);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/user/favorites',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ slug: 'test-listing' }),
          })
        );
      });
    });

    it('removes listing from favorites when clicking favorited button', async () => {
      mockUseSession.mockReturnValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        status: 'authenticated',
        update: jest.fn(),
      });

      // Initial status check
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ favorited: true }),
      } as Response);

      // Remove from favorites request
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      render(<FavoriteButton slug="test-listing" />);
      
      await waitFor(() => {
        expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Remove from favorites');
      });

      const button = screen.getByRole('button');
      await userEvent.click(button);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/user/favorites',
          expect.objectContaining({
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ slug: 'test-listing' }),
          })
        );
      });
    });

    it('prevents click propagation', async () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn(),
      });

      const handleParentClick = jest.fn();
      render(
        <div onClick={handleParentClick}>
          <FavoriteButton slug="test-listing" />
        </div>
      );

      const button = screen.getByRole('button');
      await userEvent.click(button);

      expect(handleParentClick).not.toHaveBeenCalled();
    });
  });

  describe('Optimistic Updates', () => {
    it('immediately updates UI when optimistic is true', async () => {
      mockUseSession.mockReturnValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        status: 'authenticated',
        update: jest.fn(),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ favorited: false }),
      } as Response);

      mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<FavoriteButton slug="test-listing" optimistic={true} />);
      
      await waitFor(() => {
        expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Add to favorites');
      });

      const button = screen.getByRole('button');
      await userEvent.click(button);

      // Should immediately show favorited state
      await waitFor(() => {
        expect(button).toHaveAttribute('aria-label', 'Remove from favorites');
      });
    });

    it('reverts optimistic update on error', async () => {
      mockUseSession.mockReturnValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        status: 'authenticated',
        update: jest.fn(),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ favorited: false }),
      } as Response);

      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      render(<FavoriteButton slug="test-listing" optimistic={true} />);
      
      await waitFor(() => {
        expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Add to favorites');
      });

      const button = screen.getByRole('button');
      await userEvent.click(button);

      // Should revert to unfavorited state
      await waitFor(() => {
        expect(button).toHaveAttribute('aria-label', 'Add to favorites');
        expect(global.alert).toHaveBeenCalledWith('An error occurred. Please try again.');
      });
    });

    it('does not update immediately when optimistic is false', async () => {
      mockUseSession.mockReturnValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        status: 'authenticated',
        update: jest.fn(),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ favorited: false }),
      } as Response);

      let resolveAddFavorite: any;
      mockFetch.mockImplementation(() => new Promise((resolve) => {
        resolveAddFavorite = () => resolve({
          ok: true,
          json: async () => ({ success: true }),
        });
      }));

      render(<FavoriteButton slug="test-listing" optimistic={false} />);
      
      await waitFor(() => {
        expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Add to favorites');
      });

      const button = screen.getByRole('button');
      await userEvent.click(button);

      // Should still show unfavorited state while loading
      expect(button).toHaveAttribute('aria-label', 'Add to favorites');
      
      resolveAddFavorite();
      
      await waitFor(() => {
        expect(button).toHaveAttribute('aria-label', 'Remove from favorites');
      });
    });
  });

  describe('External Toggle Handler', () => {
    it('calls external onToggle handler when provided', async () => {
      mockUseSession.mockReturnValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        status: 'authenticated',
        update: jest.fn(),
      });

      const handleToggle = jest.fn().mockResolvedValue(undefined);

      render(<FavoriteButton slug="test-listing" initialIsFavorited={false} onToggle={handleToggle} />);
      
      const button = screen.getByRole('button');
      await userEvent.click(button);

      await waitFor(() => {
        expect(handleToggle).toHaveBeenCalledTimes(1);
      });
    });

    it('does not make API calls when onToggle is provided', async () => {
      mockUseSession.mockReturnValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        status: 'authenticated',
        update: jest.fn(),
      });

      const handleToggle = jest.fn().mockResolvedValue(undefined);

      render(<FavoriteButton slug="test-listing" initialIsFavorited={false} onToggle={handleToggle} />);
      
      const button = screen.getByRole('button');
      await userEvent.click(button);

      await waitFor(() => {
        expect(handleToggle).toHaveBeenCalled();
      });

      // Should not call fetch for POST/DELETE
      expect(mockFetch).not.toHaveBeenCalledWith(
        '/api/user/favorites',
        expect.anything()
      );
    });
  });

  describe('Size Variations', () => {
    it('renders small size', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn(),
      });

      const { container } = render(<FavoriteButton slug="test-listing" size="sm" />);
      const heartIcon = container.querySelector('svg');
      expect(heartIcon).toHaveClass('h-4');
      expect(heartIcon).toHaveClass('w-4');
    });

    it('renders medium size by default', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn(),
      });

      const { container } = render(<FavoriteButton slug="test-listing" />);
      const heartIcon = container.querySelector('svg');
      expect(heartIcon).toHaveClass('h-5');
      expect(heartIcon).toHaveClass('w-5');
    });

    it('renders large size', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn(),
      });

      const { container } = render(<FavoriteButton slug="test-listing" size="lg" />);
      const heartIcon = container.querySelector('svg');
      expect(heartIcon).toHaveClass('h-5');
      expect(heartIcon).toHaveClass('w-5');
    });
  });

  describe('Text Display', () => {
    it('shows text when showText is true', async () => {
      mockUseSession.mockReturnValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        status: 'authenticated',
        update: jest.fn(),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ favorited: false }),
      } as Response);

      render(<FavoriteButton slug="test-listing" showText={true} />);
      
      await waitFor(() => {
        expect(screen.getByText('Save')).toBeInTheDocument();
      });
    });

    it('shows "Saved" text when favorited', async () => {
      mockUseSession.mockReturnValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        status: 'authenticated',
        update: jest.fn(),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ favorited: true }),
      } as Response);

      render(<FavoriteButton slug="test-listing" showText={true} />);
      
      await waitFor(() => {
        expect(screen.getByText('Saved')).toBeInTheDocument();
      });
    });

    it('hides text when showText is false', async () => {
      mockUseSession.mockReturnValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        status: 'authenticated',
        update: jest.fn(),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ favorited: false }),
      } as Response);

      render(<FavoriteButton slug="test-listing" showText={false} />);
      
      await waitFor(() => {
        expect(screen.queryByText('Save')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('shows alert on network error', async () => {
      mockUseSession.mockReturnValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        status: 'authenticated',
        update: jest.fn(),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ favorited: false }),
      } as Response);

      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      render(<FavoriteButton slug="test-listing" />);
      
      await waitFor(() => {
        expect(screen.getByRole('button')).not.toBeDisabled();
      });

      const button = screen.getByRole('button');
      await userEvent.click(button);

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('An error occurred. Please try again.');
      });
    });

    it('handles API error response gracefully', async () => {
      mockUseSession.mockReturnValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        status: 'authenticated',
        update: jest.fn(),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ favorited: false }),
      } as Response);

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Server error' }),
      } as Response);

      render(<FavoriteButton slug="test-listing" />);
      
      await waitFor(() => {
        expect(screen.getByRole('button')).not.toBeDisabled();
      });

      const button = screen.getByRole('button');
      await userEvent.click(button);

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalled();
      });
    });

    it('logs error to console on favorite check failure', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      mockUseSession.mockReturnValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        status: 'authenticated',
        update: jest.fn(),
      });

      mockFetch.mockRejectedValueOnce(new Error('Check failed'));

      render(<FavoriteButton slug="test-listing" />);
      
      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith('Error checking favorite status:', expect.any(Error));
      });

      consoleError.mockRestore();
    });
  });

  describe('Controlled State', () => {
    it('uses controlled isFavorited prop when provided', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn(),
      });

      render(<FavoriteButton slug="test-listing" isFavorited={true} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Remove from favorites');
    });

    it('updates UI when controlled isFavorited prop changes', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn(),
      });

      const { rerender } = render(<FavoriteButton slug="test-listing" isFavorited={false} />);
      
      let button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Add to favorites');

      rerender(<FavoriteButton slug="test-listing" isFavorited={true} />);
      
      button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Remove from favorites');
    });
  });

  describe('Accessibility', () => {
    it('has proper aria-label for unfavorited state', async () => {
      mockUseSession.mockReturnValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        status: 'authenticated',
        update: jest.fn(),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ favorited: false }),
      } as Response);

      render(<FavoriteButton slug="test-listing" />);
      
      await waitFor(() => {
        const button = screen.getByRole('button');
        expect(button).toHaveAttribute('aria-label', 'Add to favorites');
      });
    });

    it('has proper aria-label for favorited state', async () => {
      mockUseSession.mockReturnValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        status: 'authenticated',
        update: jest.fn(),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ favorited: true }),
      } as Response);

      render(<FavoriteButton slug="test-listing" />);
      
      await waitFor(() => {
        const button = screen.getByRole('button');
        expect(button).toHaveAttribute('aria-label', 'Remove from favorites');
      });
    });

    it('provides descriptive title attribute', async () => {
      mockUseSession.mockReturnValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        status: 'authenticated',
        update: jest.fn(),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ favorited: false }),
      } as Response);

      render(<FavoriteButton slug="test-listing" listingTitle="Eco Cafe" />);
      
      await waitFor(() => {
        const button = screen.getByRole('button');
        expect(button).toHaveAttribute('title', 'Add "Eco Cafe" to favorites');
      });
    });
  });

  describe('Custom className', () => {
    it('applies custom className', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn(),
      });

      render(<FavoriteButton slug="test-listing" className="custom-class" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });

    it('preserves built-in classes when custom className is added', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn(),
      });

      render(<FavoriteButton slug="test-listing" className="custom-class" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('transition-all');
      expect(button).toHaveClass('duration-200');
      expect(button).toHaveClass('hover:scale-105');
      expect(button).toHaveClass('custom-class');
    });
  });
});
