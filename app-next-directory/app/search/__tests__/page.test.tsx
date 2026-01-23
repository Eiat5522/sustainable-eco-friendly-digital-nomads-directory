/**
 * Unit tests for app/search/page.tsx
 * Tests the search page server component with Next.js 16 Cache Components optimizations
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

// Mock SearchFiltersForm
jest.mock('@/components/search/SearchFiltersForm', () => ({
  SearchFiltersForm: ({
    initialParams,
    resultsPath,
  }: {
    initialParams: any;
    resultsPath?: string;
  }) => (
    <div data-testid="search-filters-form" data-results-path={resultsPath}>
      {JSON.stringify(initialParams)}
    </div>
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

describe('app/search/page.tsx', () => {
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

      const SearchPage = (await import('../page')).default;
      render(await SearchPage({ searchParams: Promise.resolve({}) }));

      // Wait for Suspense to resolve
      await screen.findByTestId('page-layout-server');
      expect(screen.getByTestId('page-layout-server')).toBeInTheDocument();
    });
  });

  describe('successful search results', () => {
    const mockListings = [
      {
        id: 'listing-1',
        name: 'Test Cafe',
        slug: 'test-cafe',
        type: 'cafe' as const,
        city: {
          id: 'city-1',
          name: 'Bangkok',
          slug: 'bangkok',
          country: 'Thailand',
        },
        imageUrl: 'https://example.com/image.jpg',
        featured: false,
      },
      {
        id: 'listing-2',
        name: 'Coworking Space',
        slug: 'coworking-space',
        type: 'coworking' as const,
        city: null,
        imageUrl: 'https://example.com/image2.jpg',
        featured: true,
      },
    ];

    beforeEach(() => {
      const successResult: SearchFetchSuccess = {
        ok: true,
        listings: mockListings,
        pagination: {
          page: 2,
          totalPages: 5,
          hasMore: true,
          limit: 12,
          total: 50,
        },
        pageSizeOptions: [12, 24, 48, 96],
        pages: [1, 2, 3, '…', 5],
      };
      mockExecuteSearch.mockResolvedValue(successResult);
    });

    it('should call executeSearch from DAL', async () => {
      const searchParams = { q: 'coffee', category: 'cafe' };
      const SearchPage = (await import('../page')).default;
      render(await SearchPage({ searchParams: Promise.resolve(searchParams) }));

      // Wait for Suspense to resolve
      await screen.findByTestId('search-results');
      expect(mockExecuteSearch).toHaveBeenCalledWith(searchParams);
    });

    it('should render search results grid', async () => {
      const SearchPage = (await import('../page')).default;
      render(await SearchPage({ searchParams: Promise.resolve({ q: 'coffee' }) }));

      // Wait for Suspense to resolve
      const resultsContainer = await screen.findByTestId('search-results');
      expect(resultsContainer).toBeInTheDocument();

      const listingGrid = screen.getByTestId('listing-grid');
      expect(listingGrid).toBeInTheDocument();

      expect(screen.getByTestId('listing-listing-1')).toHaveTextContent('Test Cafe');
      expect(screen.getByTestId('listing-listing-2')).toHaveTextContent('Coworking Space');
    });

    it('should show pagination info', async () => {
      const SearchPage = (await import('../page')).default;
      render(await SearchPage({ searchParams: Promise.resolve({}) }));

      // Wait for Suspense to resolve
      await screen.findByText(/showing page 2 of 5/i);
      expect(screen.getByText(/showing page 2 of 5/i)).toBeInTheDocument();
    });

    it('should render pagination links with page numbers', async () => {
      const SearchPage = (await import('../page')).default;
      render(await SearchPage({ searchParams: Promise.resolve({}) }));

      // Wait for Suspense to resolve
      await screen.findByText('Prev');
      // Check for navigation buttons
      expect(screen.getByText('Prev')).toBeInTheDocument();
      expect(screen.getByText('Next')).toBeInTheDocument();

      // Check for page numbers and ellipsis
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();

      // Check for ellipsis
      const ellipsisElements = screen.getAllByText('…');
      expect(ellipsisElements.length).toBeGreaterThan(0);
    });

    it('should generate correct prev link when not on first page', async () => {
      const SearchPage = (await import('../page')).default;
      render(await SearchPage({ searchParams: Promise.resolve({ page: 2, q: 'test' }) }));

      // Wait for Suspense to resolve
      await screen.findByText('Prev');
      expect(mockBuildSearchHref).toHaveBeenCalledWith(
        '/search',
        { page: 2, q: 'test' },
        { page: '1' }
      );

      const prevLink = screen.getByText('Prev').closest('a');
      expect(prevLink).toHaveAttribute('href');
      expect(prevLink).not.toHaveAttribute('aria-disabled', 'true');
    });

    it('should generate correct next link when hasMore is true', async () => {
      const SearchPage = (await import('../page')).default;
      render(await SearchPage({ searchParams: Promise.resolve({ page: 2 }) }));

      // Wait for Suspense to resolve
      await screen.findByText('Next');
      expect(mockBuildSearchHref).toHaveBeenCalledWith('/search', { page: 2 }, { page: '3' });

      const nextLink = screen.getByText('Next').closest('a');
      expect(nextLink).toHaveAttribute('href');
      expect(nextLink).not.toHaveAttribute('aria-disabled', 'true');
    });

    it('should disable prev link on first page', async () => {
      mockExecuteSearch.mockResolvedValue({
        ok: true,
        listings: mockListings,
        pagination: { page: 1, totalPages: 5, hasMore: true, limit: 12, total: 50 },
        pageSizeOptions: [12, 24, 48, 96],
        pages: [1, 2, 3, '…', 5],
      });

      const SearchPage = (await import('../page')).default;
      render(await SearchPage({ searchParams: Promise.resolve({ page: 1 }) }));

      // Wait for Suspense to resolve
      await screen.findByText('Prev');
      const prevLink = screen.getByText('Prev').closest('a');
      expect(prevLink).toHaveAttribute('aria-disabled', 'true');
    });

    it('should disable next link on last page', async () => {
      mockExecuteSearch.mockResolvedValue({
        ok: true,
        listings: mockListings,
        pagination: { page: 5, totalPages: 5, hasMore: false, limit: 12, total: 50 },
        pageSizeOptions: [12, 24, 48, 96],
        pages: [1, '…', 4, 5],
      });

      const SearchPage = (await import('../page')).default;
      render(await SearchPage({ searchParams: Promise.resolve({ page: 5 }) }));

      // Wait for Suspense to resolve
      await screen.findByText('Next');
      const nextLink = screen.getByText('Next').closest('a');
      expect(nextLink).toHaveAttribute('aria-disabled', 'true');
    });

    it('should highlight current page in pagination', async () => {
      const SearchPage = (await import('../page')).default;
      render(await SearchPage({ searchParams: Promise.resolve({ page: 2 }) }));

      // Wait for Suspense to resolve
      await screen.findByText('2');
      const pageLinks = screen.getAllByRole('link');
      const currentPageLink = pageLinks.find(
        link => link.textContent === '2' && link.getAttribute('aria-current') === 'page'
      );
      expect(currentPageLink).toBeDefined();
    });

    it('should render SearchFiltersForm with initialParams', async () => {
      const searchParams = { q: 'coffee', category: 'cafe' };
      const SearchPage = (await import('../page')).default;
      render(await SearchPage({ searchParams: Promise.resolve(searchParams) }));

      // Wait for Suspense to resolve
      const filtersForm = await screen.findByTestId('search-filters-form');
      expect(filtersForm).toBeInTheDocument();
      expect(filtersForm).toHaveTextContent('"q":"coffee"');
      expect(filtersForm).toHaveTextContent('"category":"cafe"');
      expect(filtersForm).toHaveAttribute('data-results-path', '/search');
    });

    it('should render page size selector with options', async () => {
      const SearchPage = (await import('../page')).default;
      render(await SearchPage({ searchParams: Promise.resolve({}) }));

      // Wait for Suspense to resolve
      await screen.findByText(/per page/i);
      const pageSizeLabel = screen.getByText(/per page/i);
      expect(pageSizeLabel).toBeInTheDocument();

      const pageSizeSelect = screen.getByRole('combobox', { name: /per page/i });
      expect(pageSizeSelect).toBeInTheDocument();

      const options = within(pageSizeSelect as HTMLElement).getAllByRole('option');
      expect(options).toHaveLength(4);
      expect(options.map(o => o.textContent)).toEqual(['12', '24', '48', '96']);
    });

    it('should display no results message when listings array is empty', async () => {
      mockExecuteSearch.mockResolvedValue({
        ok: true,
        listings: [],
        pagination: { page: 1, totalPages: 1, hasMore: false, limit: 12, total: 0 },
        pageSizeOptions: [12, 24, 48, 96],
        pages: [1],
      });

      const SearchPage = (await import('../page')).default;
      render(await SearchPage({ searchParams: Promise.resolve({ q: 'nonexistent' }) }));

      // Wait for Suspense to resolve
      await screen.findByTestId('no-results');
      expect(screen.queryByTestId('search-results')).not.toBeInTheDocument();
      expect(screen.getByTestId('no-results')).toBeInTheDocument();
      expect(screen.getByText('No results found.')).toBeInTheDocument();
    });
  });

  describe('error states', () => {
    it('should render error state when search fails', async () => {
      const errorResult: SearchFetchError = {
        ok: false,
        reason: 'response',
        status: 500,
        statusText: 'Internal Server Error',
      };
      mockExecuteSearch.mockResolvedValue(errorResult);

      const SearchPage = (await import('../page')).default;
      render(await SearchPage({ searchParams: Promise.resolve({}) }));

      // Wait for Suspense to resolve
      const errorState = await screen.findByTestId('search-error-state');
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

      const SearchPage = (await import('../page')).default;
      render(await SearchPage({ searchParams: Promise.resolve({}) }));

      // Wait for Suspense to resolve
      const retryButton = await screen.findByTestId('search-retry-button');
      expect(retryButton).toBeInTheDocument();
      expect(within(retryButton).getByText('Retry search')).toBeInTheDocument();
    });

    it('should increment retry count in retry link', async () => {
      const errorResult: SearchFetchError = {
        ok: false,
        reason: 'response',
        status: 503,
      };
      mockExecuteSearch.mockResolvedValue(errorResult);

      const SearchPage = (await import('../page')).default;
      render(await SearchPage({ searchParams: Promise.resolve({ retry: '2' }) }));

      // Wait for Suspense to resolve
      await screen.findByTestId('search-error-state');
      expect(mockBuildSearchHref).toHaveBeenCalledWith('/search', { retry: '2' }, { retry: '3' });
    });

    it('should start retry count at 1 when not present', async () => {
      const errorResult: SearchFetchError = {
        ok: false,
        reason: 'exception',
      };
      mockExecuteSearch.mockResolvedValue(errorResult);

      const SearchPage = (await import('../page')).default;
      render(await SearchPage({ searchParams: Promise.resolve({}) }));

      // Wait for Suspense to resolve
      await screen.findByTestId('search-error-state');
      expect(mockBuildSearchHref).toHaveBeenCalledWith('/search', {}, { retry: '1' });
    });

    it('should show error details in development mode', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const errorResult: SearchFetchError = {
        ok: false,
        reason: 'response',
        status: 404,
        statusText: 'Not Found',
      };
      mockExecuteSearch.mockResolvedValue(errorResult);

      const SearchPage = (await import('../page')).default;
      render(await SearchPage({ searchParams: Promise.resolve({}) }));

      // Wait for Suspense to resolve
      await screen.findByText(/Error: 404 Not Found/i);
      expect(screen.getByText(/Error: 404 Not Found/i)).toBeInTheDocument();

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

      const SearchPage = (await import('../page')).default;
      render(await SearchPage({ searchParams: Promise.resolve({}) }));

      // Wait for Suspense to resolve
      await screen.findByText(/Unexpected error occurred/i);
      expect(screen.getByText(/Unexpected error occurred/i)).toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
    });
  });
});
