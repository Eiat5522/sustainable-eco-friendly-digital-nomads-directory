/**
 * Unit tests for app/search/results/page.tsx
 * Tests the search results page server component with Next.js 16 Cache Components optimizations
 */

/** @jest-environment jsdom */

import '@testing-library/jest-dom';
import { jest } from '@jest/globals';
import { render, screen, within } from '@testing-library/react';
import type { SearchFetchError, SearchFetchSuccess } from '@/lib/data-access/search.dal';

// Mock the DAL functions
const mockExecuteSearch = jest.fn();
const mockBuildSearchHref = jest.fn();

jest.mock('@/lib/data-access/search.dal', () => ({
  executeSearch: (...args: any[]) => mockExecuteSearch(...args),
  buildSearchHref: (...args: any[]) => mockBuildSearchHref(...args),
  MAX_PARAM_VALUE_LENGTH: 1000,
}));

// Mock PageLayoutServer
jest.mock('@/components/layout/PageLayoutServer', () => ({
  PageLayoutServer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="page-layout-server">{children}</div>
  ),
}));

// Mock ListingGrid
jest.mock('@/components/listings/ListingGrid', () => ({
  ListingGrid: ({ listings }: { listings: any[] }) => (
    <div data-testid="listing-grid">
      {listings.map(listing => (
        <div key={listing.id} data-testid={`listing-${listing.id}`}>
          {listing.name}
        </div>
      ))}
    </div>
  ),
}));

// Mock SearchFiltersForm (note: no resultsPath prop in results page)
jest.mock('@/components/search/SearchFiltersForm', () => ({
  SearchFiltersForm: ({ initialParams }: { initialParams: any }) => (
    <div data-testid="search-filters-form">{JSON.stringify(initialParams)}</div>
  ),
}));

// Mock NeoButton
jest.mock('@/components/ui/neo-button', () => ({
  NeoButton: ({ children, asChild, disabled, variant, size, type, ...props }: any) => {
    if (asChild) {
      return (
        <span data-variant={variant} data-size={size} {...props}>
          {children}
        </span>
      );
    }
    return (
      <button type={type} disabled={disabled} data-variant={variant} data-size={size} {...props}>
        {children}
      </button>
    );
  },
}));

// Mock Link
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe('app/search/results/page.tsx', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();

    // Default mock implementation for buildSearchHref
    mockBuildSearchHref.mockImplementation((basePath: string, params: any, overrides: any = {}) => {
      const merged = { ...params, ...overrides };
      const query = new URLSearchParams();
      Object.entries(merged).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query.set(key, String(value));
        }
      });
      return query.toString() ? `${basePath}?${query.toString()}` : basePath;
    });
  });

  describe('PageLayoutServer wrapper', () => {
    it('should render page with PageLayoutServer wrapper', async () => {
      const successResult: SearchFetchSuccess = {
        ok: true,
        listings: [],
        pagination: { page: 1, totalPages: 1, hasMore: false, limit: 12, total: 0 },
        pageSizeOptions: [12, 24, 48, 96],
        pages: [1],
      };
      mockExecuteSearch.mockResolvedValue(successResult);

      const ResultsPage = (await import('../page')).default;
      render(await ResultsPage({ searchParams: {} }));

      expect(screen.getByTestId('page-layout-server')).toBeInTheDocument();
    });
  });

  describe('successful search results', () => {
    const mockListings = [
      {
        id: 'listing-1',
        name: 'Eco Cafe',
        slug: 'eco-cafe',
        type: 'cafe' as const,
        city: {
          id: 'city-1',
          name: 'Chiang Mai',
          slug: 'chiang-mai',
          country: 'Thailand',
        },
        imageUrl: 'https://example.com/eco-cafe.jpg',
        featured: true,
      },
      {
        id: 'listing-2',
        name: 'Green Coworking',
        slug: 'green-coworking',
        type: 'coworking' as const,
        city: {
          id: 'city-2',
          name: 'Porto',
          slug: 'porto',
          country: 'Portugal',
        },
        imageUrl: 'https://example.com/green-coworking.jpg',
        featured: false,
      },
      {
        id: 'listing-3',
        name: 'Sustainable Stay',
        slug: 'sustainable-stay',
        type: 'accommodation' as const,
        city: null,
        imageUrl: null,
        featured: false,
      },
    ];

    beforeEach(() => {
      const successResult: SearchFetchSuccess = {
        ok: true,
        listings: mockListings,
        pagination: {
          page: 3,
          totalPages: 10,
          hasMore: true,
          limit: 24,
          total: 240,
        },
        pageSizeOptions: [12, 24, 48, 96],
        pages: [1, 2, 3, 4, '…', 10],
      };
      mockExecuteSearch.mockResolvedValue(successResult);
    });

    it('should call executeSearch from DAL', async () => {
      const searchParams = { q: 'eco', category: ['cafe', 'coworking'] };
      const ResultsPage = (await import('../page')).default;
      render(await ResultsPage({ searchParams }));

      expect(mockExecuteSearch).toHaveBeenCalledWith(searchParams);
    });

    it('should render search results grid', async () => {
      const ResultsPage = (await import('../page')).default;
      render(await ResultsPage({ searchParams: { q: 'eco' } }));

      const resultsContainer = screen.getByTestId('search-results');
      expect(resultsContainer).toBeInTheDocument();

      const listingGrid = screen.getByTestId('listing-grid');
      expect(listingGrid).toBeInTheDocument();

      expect(screen.getByTestId('listing-listing-1')).toHaveTextContent('Eco Cafe');
      expect(screen.getByTestId('listing-listing-2')).toHaveTextContent('Green Coworking');
      expect(screen.getByTestId('listing-listing-3')).toHaveTextContent('Sustainable Stay');
    });

    it('should show pagination info', async () => {
      const ResultsPage = (await import('../page')).default;
      render(await ResultsPage({ searchParams: {} }));

      expect(screen.getByText(/showing page 3 of 10/i)).toBeInTheDocument();
    });

    it('should render pagination links with page numbers', async () => {
      const ResultsPage = (await import('../page')).default;
      render(await ResultsPage({ searchParams: {} }));

      // Check for navigation buttons
      expect(screen.getByText('Prev')).toBeInTheDocument();
      expect(screen.getByText('Next')).toBeInTheDocument();

      // Check for page numbers
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('4')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();

      // Check for ellipsis
      const ellipsisElements = screen.getAllByText('…');
      expect(ellipsisElements.length).toBeGreaterThan(0);
    });

    it('should generate correct prev link when not on first page', async () => {
      const ResultsPage = (await import('../page')).default;
      render(await ResultsPage({ searchParams: { page: 3, q: 'eco' } }));

      expect(mockBuildSearchHref).toHaveBeenCalledWith(
        '/search/results',
        { page: 3, q: 'eco' },
        { page: '2' }
      );

      const prevLink = screen.getByText('Prev').closest('a');
      expect(prevLink).toHaveAttribute('href');
      expect(prevLink).not.toHaveAttribute('aria-disabled', 'true');
    });

    it('should generate correct next link when hasMore is true', async () => {
      const ResultsPage = (await import('../page')).default;
      render(await ResultsPage({ searchParams: { page: 3 } }));

      expect(mockBuildSearchHref).toHaveBeenCalledWith(
        '/search/results',
        { page: 3 },
        { page: '4' }
      );

      const nextLink = screen.getByText('Next').closest('a');
      expect(nextLink).toHaveAttribute('href');
      expect(nextLink).not.toHaveAttribute('aria-disabled', 'true');
    });

    it('should disable prev link on first page', async () => {
      mockExecuteSearch.mockResolvedValue({
        ok: true,
        listings: mockListings,
        pagination: { page: 1, totalPages: 10, hasMore: true, limit: 24, total: 240 },
        pageSizeOptions: [12, 24, 48, 96],
        pages: [1, 2, 3, '…', 10],
      });

      const ResultsPage = (await import('../page')).default;
      render(await ResultsPage({ searchParams: { page: 1 } }));

      const prevButton = screen.getByRole('button', { name: /prev/i });
      expect(prevButton).toBeDisabled();
    });

    it('should disable next link on last page', async () => {
      mockExecuteSearch.mockResolvedValue({
        ok: true,
        listings: mockListings,
        pagination: { page: 10, totalPages: 10, hasMore: false, limit: 24, total: 240 },
        pageSizeOptions: [12, 24, 48, 96],
        pages: [1, '…', 8, 9, 10],
      });

      const ResultsPage = (await import('../page')).default;
      render(await ResultsPage({ searchParams: { page: 10 } }));

      const nextButton = screen.getByRole('button', { name: /next/i });
      expect(nextButton).toBeDisabled();
    });

    it('should highlight current page in pagination', async () => {
      const ResultsPage = (await import('../page')).default;
      render(await ResultsPage({ searchParams: { page: 3 } }));

      const pageLinks = screen.getAllByRole('link');
      const currentPageLink = pageLinks.find(
        link => link.textContent === '3' && link.getAttribute('aria-current') === 'page'
      );
      expect(currentPageLink).toBeDefined();
    });

    it('should integrate SearchFiltersForm with initialParams', async () => {
      const searchParams = {
        q: 'sustainable',
        category: 'cafe',
        destination: 'Bangkok',
        amenities: ['wifi', 'coffee'],
      };
      const ResultsPage = (await import('../page')).default;
      render(await ResultsPage({ searchParams }));

      const filtersForm = screen.getByTestId('search-filters-form');
      expect(filtersForm).toBeInTheDocument();
      expect(filtersForm).toHaveTextContent('"q":"sustainable"');
      expect(filtersForm).toHaveTextContent('"category":"cafe"');
      expect(filtersForm).toHaveTextContent('"destination":"Bangkok"');
    });

    it('should render page size selector with options', async () => {
      const ResultsPage = (await import('../page')).default;
      render(await ResultsPage({ searchParams: {} }));

      const pageSizeLabel = screen.getByText(/per page/i);
      expect(pageSizeLabel).toBeInTheDocument();

      const pageSizeSelect = screen.getByRole('combobox', { name: /per page/i });
      expect(pageSizeSelect).toBeInTheDocument();

      const options = within(pageSizeSelect as HTMLElement).getAllByRole('option');
      expect(options).toHaveLength(4);
      expect(options.map(o => o.textContent)).toEqual(['12', '24', '48', '96']);
    });

    it('should show selected page size in selector', async () => {
      const ResultsPage = (await import('../page')).default;
      render(await ResultsPage({ searchParams: { limit: 24 } }));

      const pageSizeSelect = screen.getByRole('combobox', {
        name: /per page/i,
      }) as HTMLSelectElement;
      expect(pageSizeSelect.value).toBe('24');
    });

    it('should display no results message when listings array is empty', async () => {
      mockExecuteSearch.mockResolvedValue({
        ok: true,
        listings: [],
        pagination: { page: 1, totalPages: 1, hasMore: false, limit: 12, total: 0 },
        pageSizeOptions: [12, 24, 48, 96],
        pages: [1],
      });

      const ResultsPage = (await import('../page')).default;
      render(await ResultsPage({ searchParams: { q: 'nonexistent-keyword' } }));

      expect(screen.queryByTestId('search-results')).not.toBeInTheDocument();
      expect(screen.getByTestId('no-results')).toBeInTheDocument();
      expect(screen.getByText('No results found.')).toBeInTheDocument();
    });

    it('should handle array parameters correctly', async () => {
      const searchParams = {
        category: ['cafe', 'coworking', 'restaurant'],
        amenities: ['wifi', 'outdoor-seating'],
      };
      const ResultsPage = (await import('../page')).default;
      render(await ResultsPage({ searchParams }));

      expect(mockExecuteSearch).toHaveBeenCalledWith(searchParams);

      const filtersForm = screen.getByTestId('search-filters-form');
      expect(filtersForm).toHaveTextContent('"category":["cafe","coworking","restaurant"]');
    });
  });

  describe('error states', () => {
    it('should render error state when search fails', async () => {
      const errorResult: SearchFetchError = {
        ok: false,
        reason: 'response',
        status: 503,
        statusText: 'Service Unavailable',
      };
      mockExecuteSearch.mockResolvedValue(errorResult);

      const ResultsPage = (await import('../page')).default;
      render(await ResultsPage({ searchParams: {} }));

      const errorState = screen.getByTestId('search-error-state');
      expect(errorState).toBeInTheDocument();

      const errorMessage = screen.getByTestId('error-message');
      expect(errorMessage).toHaveTextContent('Failed to load search results');
    });

    it('should render retry link with functionality', async () => {
      const errorResult: SearchFetchError = {
        ok: false,
        reason: 'exception',
      };
      mockExecuteSearch.mockResolvedValue(errorResult);

      const ResultsPage = (await import('../page')).default;
      render(await ResultsPage({ searchParams: {} }));

      const retryButton = screen.getByTestId('search-retry-button');
      expect(retryButton).toBeInTheDocument();
      expect(within(retryButton).getByText('Retry search')).toBeInTheDocument();
    });

    it('should increment retry count in retry link', async () => {
      const errorResult: SearchFetchError = {
        ok: false,
        reason: 'response',
        status: 500,
      };
      mockExecuteSearch.mockResolvedValue(errorResult);

      const ResultsPage = (await import('../page')).default;
      render(await ResultsPage({ searchParams: { retry: '3' } }));

      expect(mockBuildSearchHref).toHaveBeenCalledWith(
        '/search/results',
        { retry: '3' },
        { retry: '4' }
      );
    });

    it('should handle retry count as array and use last value', async () => {
      const errorResult: SearchFetchError = {
        ok: false,
        reason: 'exception',
      };
      mockExecuteSearch.mockResolvedValue(errorResult);

      const ResultsPage = (await import('../page')).default;
      render(await ResultsPage({ searchParams: { retry: ['1', '2', '5'] } }));

      expect(mockBuildSearchHref).toHaveBeenCalledWith(
        '/search/results',
        { retry: ['1', '2', '5'] },
        { retry: '6' }
      );
    });

    it('should show error details in development mode', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const errorResult: SearchFetchError = {
        ok: false,
        reason: 'response',
        status: 502,
        statusText: 'Bad Gateway',
      };
      mockExecuteSearch.mockResolvedValue(errorResult);

      const ResultsPage = (await import('../page')).default;
      render(await ResultsPage({ searchParams: {} }));

      expect(screen.getByText(/Error: 502 Bad Gateway/i)).toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
    });

    it('should show generic message for exception errors in development', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const errorResult: SearchFetchError = {
        ok: false,
        reason: 'exception',
      };
      mockExecuteSearch.mockResolvedValue(errorResult);

      const ResultsPage = (await import('../page')).default;
      render(await ResultsPage({ searchParams: {} }));

      expect(screen.getByText(/Unexpected error occurred/i)).toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
    });

    it('should not show error details in production mode', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const errorResult: SearchFetchError = {
        ok: false,
        reason: 'response',
        status: 500,
        statusText: 'Internal Server Error',
      };
      mockExecuteSearch.mockResolvedValue(errorResult);

      const ResultsPage = (await import('../page')).default;
      render(await ResultsPage({ searchParams: {} }));

      expect(screen.queryByText(/Error: 500/i)).not.toBeInTheDocument();
      expect(screen.getByTestId('error-message')).toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
    });
  });
});
