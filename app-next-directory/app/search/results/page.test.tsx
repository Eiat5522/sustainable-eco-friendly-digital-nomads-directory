/** @jest-environment jsdom */

import '@testing-library/jest-dom';
import { render, screen, within } from '@testing-library/react';
import { generateAsyncValue } from '@/test-helpers/async-mock-helpers';

import { extractTagNames, mapResultToDTO } from './helpers';

const listingGridRenderMock = jest.fn(({ listings }: any) => (
  <div data-testid="listing-grid">{JSON.stringify(listings)}</div>
));
const searchFiltersRenderMock = jest.fn(({ initialParams }: any) => (
  <div data-testid="search-filters-form">{JSON.stringify(initialParams)}</div>
));

const fetchSearchResultsMock = jest.fn();

jest.mock('@/components/ui/neo-button', () => ({
  NeoButton: ({ children, asChild = false, ...props }: any) =>
    asChild ? children : <button {...props}>{children}</button>,
}));

jest.mock('@/components/listings/ListingGrid', () => ({
  ListingGrid: (props: any) => listingGridRenderMock(props),
}));

jest.mock('@/components/search/SearchFiltersForm', () => ({
  SearchFiltersForm: (props: any) => searchFiltersRenderMock(props),
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, ...props }: any) => (
    <a href={typeof href === 'string' ? href : (href?.pathname ?? '')} {...props}>
      {children}
    </a>
  ),
}));

jest.mock('./server', () => ({
  fetchSearchResults: (...args: unknown[]) => fetchSearchResultsMock(...args),
}));

describe('Search results page module', () => {
  let ResultsPage: typeof import('./page')['default'];
  let dynamic: typeof import('./page')['dynamic'];

  beforeAll(async () => {
    const mod = await import('./page');
    ResultsPage = mod.default;
    dynamic = mod.dynamic;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('exposes the dynamic route setting', () => {
    expect(dynamic).toBe('force-dynamic');
  });

  it('renders listings when the backend returns results', async () => {
    fetchSearchResultsMock.mockResolvedValueOnce({
      ok: true,
      listings: [
        {
          id: 'listing-123',
          name: 'Eco Hub',
          slug: 'eco-hub',
          city: { name: 'Lisbon' },
          ecoFocusTags: ['Solar'],
        },
      ],
      pagination: { page: 2, totalPages: 3, hasMore: true, limit: 12, total: 24 },
      pageSizeOptions: [12, 24, 48],
      pages: [1, 2, 3],
    });

    const ui = await ResultsPage({ searchParams: generateAsyncValue({ city: 'lisbon' }) });
    render(ui);

    const listings = JSON.parse(screen.getByTestId('listing-grid').textContent || '[]');
    expect(listings).toHaveLength(1);
    expect(listings[0]).toMatchObject({ id: 'listing-123', name: 'Eco Hub', slug: 'eco-hub' });
    expect(searchFiltersRenderMock).toHaveBeenCalledWith(
      expect.objectContaining({ initialParams: { city: 'lisbon' } })
    );

    expect(screen.getByText('Showing page 2 of 3')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Prev' })).toHaveAttribute(
      'href',
      expect.stringContaining('page=1')
    );
    expect(screen.getByRole('link', { name: 'Next' })).toHaveAttribute(
      'href',
      expect.stringContaining('page=3')
    );
  });

  it('renders an error state when the backend returns an error response', async () => {
    fetchSearchResultsMock.mockResolvedValueOnce({
      ok: false,
      reason: 'response',
      status: 500,
      statusText: 'Server Error',
    });

    const previousEnv = process.env.NODE_ENV;

    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'development',
      writable: true,
      configurable: true,
    });

    const ui = await ResultsPage({ searchParams: generateAsyncValue({ retry: '2' }) });
    render(ui);

    const errorState = await screen.findByTestId('search-error-state');
    expect(within(errorState).getByText(/Failed to load search results/i)).toBeInTheDocument();
    const retryLink = within(errorState).getByRole('link', { name: /retry search/i });
    expect(retryLink).toHaveAttribute('href', '/search/results?retry=3');
    expect(screen.getByText(/Error: 500 Server Error/)).toBeInTheDocument();

    Object.defineProperty(process.env, 'NODE_ENV', {
      value: previousEnv,
      writable: true,
      configurable: true,
    });
  });

  it('handles thrown errors from the backend helper', async () => {
    fetchSearchResultsMock.mockResolvedValueOnce({
      ok: false,
      reason: 'exception',
    });

    const previousEnv = process.env.NODE_ENV;
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'development',
      writable: true,
      configurable: true,
    });

    const ui = await ResultsPage({ searchParams: generateAsyncValue({}) });
    render(ui);

    const errorState = await screen.findByTestId('search-error-state');
    expect(within(errorState).getByText(/Failed to load search results/i)).toBeInTheDocument();
    expect(screen.getByText(/Unexpected error occurred/i)).toBeInTheDocument();

    Object.defineProperty(process.env, 'NODE_ENV', {
      value: previousEnv,
      writable: true,
      configurable: true,
    });
  });

  it('builds pagination links and preserves existing search parameters', async () => {
    fetchSearchResultsMock.mockResolvedValueOnce({
      ok: true,
      listings: [
        {
          id: '1',
          name: 'Nomad Base',
          slug: 'nomad-base',
        },
      ],
      pagination: { page: 2, totalPages: 4, hasMore: true, limit: 24, total: 80 },
      pageSizeOptions: [12, 24, 48, 96],
      pages: [1, 2, 3, 4],
    });

    const searchParams = generateAsyncValue({
      city: 'lisbon',
      tags: ['wifi', 'vegan'],
      page: '2',
      limit: '24',
    } as Record<string, any>);

    const ui = await ResultsPage({ searchParams });
    render(ui);

    expect(screen.getByText('Showing page 2 of 4')).toBeInTheDocument();
    const prevLink = screen.getByRole('link', { name: /prev/i });
    expect(prevLink).toHaveAttribute('href', expect.stringContaining('page=1'));
    expect(prevLink).toHaveAttribute('href', expect.stringContaining('city=lisbon'));
    expect(prevLink).toHaveAttribute('href', expect.stringContaining('tags=wifi'));

    const nextLink = screen.getByRole('link', { name: /next/i });
    expect(nextLink).toHaveAttribute('href', expect.stringContaining('page=3'));

    const pageButtons = screen.getAllByRole('link', { name: /^[1-4]$/ });
    expect(pageButtons).toHaveLength(4);
    expect(pageButtons[1]).toHaveAttribute('aria-current', 'page');
  });

  describe('helpers', () => {
    describe('extractTagNames', () => {
      it('should return an empty array if the param is not an array', () => {
        expect(extractTagNames(null)).toEqual([]);
      });
    });

    describe('mapResultToDTO', () => {
      it('should throw an error if the item is not valid', () => {
        expect(() => mapResultToDTO({ _id: 'broken', slug: 42 })).toThrow(
          'Invalid search result data'
        );
      });

      it('should return a valid DTO', () => {
        const validItem = {
          _id: 'listing-123',
          name: 'Eco Hub',
          slug: { current: 'eco-hub' },
          category: 'cafe',
          city: { _id: 'city-1', name: 'Lisbon', slug: 'lisbon', country: 'Portugal' },
          primaryImage: { asset: { url: 'https://example.com/img.jpg' } },
          shortDescription: 'A green friendly space',
          amenityNames: ['wifi'],
          moderation: { featured: true },
          ecoFocusTags: ['Solar', { name: 'Organic ' }],
          digitalNomadFeatures: [{ name: 'Quiet zones' }],
        };

        expect(mapResultToDTO(validItem)).toEqual({
          id: 'listing-123',
          name: 'Eco Hub',
          slug: 'eco-hub',
          type: 'cafe',
          city: { id: 'city-1', name: 'Lisbon', slug: 'lisbon', country: 'Portugal' },
          imageUrl: 'https://example.com/img.jpg',
          shortDescription: 'A green friendly space',
          amenityNames: ['wifi'],
          featured: true,
          ecoFocusTags: ['Solar', 'Organic'],
          digitalNomadFeatures: ['Quiet zones'],
        });
      });
    });
  });

  it('handles single-page results gracefully', async () => {
    fetchSearchResultsMock.mockResolvedValueOnce({
      ok: true,
      listings: [{ id: '1', name: 'Single Listing', slug: 'single-listing', category: 'cafe' }],
      pagination: { page: 1, totalPages: 1, hasMore: false, limit: 12, total: 1 },
      pageSizeOptions: [12, 24, 48, 96],
      pages: [1],
    });

    const ui = await ResultsPage({ searchParams: generateAsyncValue({}) });
    render(ui);

    expect(screen.getByText('Showing page 1 of 1')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /prev/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /next/i })).toBeInTheDocument();
    const pageButtons = screen.getAllByRole('link', { name: /^[1]$/ });
    expect(pageButtons).toHaveLength(1);
  });

  it('sanitizes the retry search parameter', async () => {
    fetchSearchResultsMock.mockResolvedValueOnce({
      ok: false,
      reason: 'response',
      status: 500,
      statusText: 'Server Error',
    });
    const ui = await ResultsPage({ searchParams: generateAsyncValue({ retry: 'invalid' }) });
    render(ui);

    const retryLink = screen.getByRole('link', { name: /retry search/i });
    expect(retryLink).toHaveAttribute('href', '/search/results?retry=1');
  });

  it('displays a message when no results are found', async () => {
    fetchSearchResultsMock.mockResolvedValueOnce({
      ok: true,
      listings: [],
      pagination: { page: 1, totalPages: 1, hasMore: false, limit: 12, total: 0 },
      pageSizeOptions: [12, 24, 48, 96],
      pages: [1],
    });

    const ui = await ResultsPage({ searchParams: generateAsyncValue({}) });
    render(ui);

    expect(screen.getByText('No results found.')).toBeInTheDocument();
  });
});
