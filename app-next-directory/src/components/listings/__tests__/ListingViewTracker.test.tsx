import { render, waitFor } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import { ListingViewTracker } from '../ListingViewTracker';

// Mock next/navigation
jest.mock('next/navigation');
const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;

// Mock fetch
const mockFetch = jest.fn();
let fetchSpy: jest.SpyInstance;

describe('ListingViewTracker', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalJestWorker = process.env.JEST_WORKER_ID;

  beforeAll(() => {
    fetchSpy = jest.spyOn(global, 'fetch').mockImplementation(mockFetch as any);
  });

  afterAll(() => {
    fetchSpy.mockRestore();
    // Restore original environment
    process.env.NODE_ENV = originalNodeEnv;
    if (originalJestWorker !== undefined) {
      process.env.JEST_WORKER_ID = originalJestWorker;
    } else {
      delete process.env.JEST_WORKER_ID;
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();
    mockUsePathname.mockReturnValue('/listings/test-listing');
    // Mock environment to allow fetch calls during tests
    process.env.NODE_ENV = 'production';
    delete process.env.JEST_WORKER_ID;
  });

  describe('Basic Rendering', () => {
    it('renders without visible output', () => {
      const { container } = render(<ListingViewTracker slug="test-listing" />);
      expect(container).toBeEmptyDOMElement();
    });

    it('returns null as specified in the component type', () => {
      const result = render(<ListingViewTracker slug="test-listing" />);
      expect(result.container.firstChild).toBeNull();
    });
  });

  describe('View Recording', () => {
    it('records a view when on a listing page', async () => {
      mockUsePathname.mockReturnValue('/listings/eco-hotel-bangkok');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      render(<ListingViewTracker slug="eco-hotel-bangkok" />);

      await waitFor(
        () => {
          expect(mockFetch).toHaveBeenCalledWith('/api/listings/eco-hotel-bangkok/views', {
            method: 'POST',
            signal: expect.any(AbortSignal),
          });
        },
        { timeout: 1000 }
      );
    });

    it('includes AbortSignal in the fetch call', async () => {
      mockUsePathname.mockReturnValue('/listings/test-slug');
      mockFetch.mockResolvedValueOnce({
        ok: true,
      } as Response);

      render(<ListingViewTracker slug="test-slug" />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            signal: expect.any(AbortSignal),
          })
        );
      });
    });

    it('does not record view when pathname does not start with /listings/', async () => {
      mockUsePathname.mockReturnValue('/about');

      render(<ListingViewTracker slug="test-listing" />);

      await waitFor(() => {
        expect(mockFetch).not.toHaveBeenCalled();
      });
    });

    it('does not record view when pathname is null', async () => {
      mockUsePathname.mockReturnValue(null);

      render(<ListingViewTracker slug="test-listing" />);

      await waitFor(() => {
        expect(mockFetch).not.toHaveBeenCalled();
      });
    });

    it('does not record view when slug is empty', async () => {
      mockUsePathname.mockReturnValue('/listings/test-listing');

      render(<ListingViewTracker slug="" />);

      await waitFor(() => {
        expect(mockFetch).not.toHaveBeenCalled();
      });
    });
  });

  describe('Deduplication', () => {
    it('does not record view for the same slug twice in the same session', async () => {
      mockUsePathname.mockReturnValue('/listings/test-listing');
      mockFetch.mockResolvedValue({
        ok: true,
      } as Response);

      // First render
      const { unmount } = render(<ListingViewTracker slug="test-listing" />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      unmount();

      // Second render with same slug
      render(<ListingViewTracker slug="test-listing" />);

      // Wait a bit to ensure no second call is made
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should still be called only once
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Handling', () => {
    it('does not throw errors on fetch failure', async () => {
      mockUsePathname.mockReturnValue('/listings/test-listing');
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      // Should not throw
      expect(() => {
        render(<ListingViewTracker slug="test-listing" />);
      }).not.toThrow();

      await new Promise(resolve => setTimeout(resolve, 100));
    });
  });

  describe('Test Environment Detection', () => {
    it('skips recording in test environment', async () => {
      // Set test environment
      process.env.NODE_ENV = 'test';
      process.env.JEST_WORKER_ID = '1';

      mockUsePathname.mockReturnValue('/listings/test-listing');

      render(<ListingViewTracker slug="test-listing" />);

      await new Promise(resolve => setTimeout(resolve, 100));

      // Should not call fetch in test environment
      // Note: This test itself is running in test env, so the behavior is expected
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('Cleanup', () => {
    it('component unmounts without errors', () => {
      mockUsePathname.mockReturnValue('/listings/test-listing');

      const { unmount } = render(<ListingViewTracker slug="test-listing" />);

      expect(() => {
        unmount();
      }).not.toThrow();
    });
  });

  describe('Pathname Changes', () => {
    it('handles pathname changes', () => {
      mockFetch.mockResolvedValue({
        ok: true,
      } as Response);

      mockUsePathname.mockReturnValue('/listings/test-listing');
      const { rerender } = render(<ListingViewTracker slug="test-listing" />);

      // Change pathname
      mockUsePathname.mockReturnValue('/about');

      expect(() => {
        rerender(<ListingViewTracker slug="test-listing" />);
      }).not.toThrow();
    });
  });

  describe('Timeout Behavior', () => {
    it('component handles timeout mechanism', async () => {
      mockUsePathname.mockReturnValue('/listings/test-listing');

      expect(() => {
        render(<ListingViewTracker slug="test-listing" />);
      }).not.toThrow();
    });
  });
});
