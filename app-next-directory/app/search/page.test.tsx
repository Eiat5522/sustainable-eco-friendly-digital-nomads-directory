import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import type { SearchParamRecord } from '@/types/search';

const pageLayoutRenderMock = jest.fn(({ children }: { children: ReactNode }) => (
  <div data-testid="page-layout">{children}</div>
));
const searchFiltersFormMock = jest.fn(
  (props: { initialParams: SearchParamRecord; resultsPath?: string }) => (
    <div
      data-testid="search-filters-form"
      data-initial-params={JSON.stringify(props.initialParams)}
      data-results-path={props.resultsPath}
    />
  )
);
const listingGridRenderMock = jest.fn(({ listings }: { listings: unknown[] }) => (
  <div data-testid="listing-grid">{JSON.stringify(listings)}</div>
));

const executeSearchMock = jest.fn();

jest.mock('@/components/layout/PageLayoutServer', () => ({
  __esModule: true,
  PageLayoutServer: (props: { children: ReactNode }) => pageLayoutRenderMock(props),
}));

jest.mock('@/components/search/SearchFiltersForm', () => ({
  __esModule: true,
  SearchFiltersForm: (props: { initialParams: SearchParamRecord; resultsPath?: string }) =>
    searchFiltersFormMock(props),
}));

jest.mock('@/components/listings/ListingGrid', () => ({
  __esModule: true,
  ListingGrid: (props: { listings: unknown[] }) => listingGridRenderMock(props),
}));

jest.mock('@/components/ui/neo-button', () => ({
  NeoButton: ({ children, asChild = false, ...rest }: any) =>
    asChild ? children : <button {...rest}>{children}</button>,
}));

jest.mock('@/lib/data-access/search.dal', () => {
  const actual = jest.requireActual('@/lib/data-access/search.dal');
  return {
    ...actual,
    executeSearch: executeSearchMock,
  };
});

let SearchPage: typeof import('./page').default;
let dynamicExport: string | undefined;

beforeAll(async () => {
  const pageModule = await import('./page');
  SearchPage = pageModule.default;
  dynamicExport = (pageModule as { dynamic?: string }).dynamic;
});

describe('SearchPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('no longer exports a dynamic rendering hint with cache components', () => {
    expect(dynamicExport).toBeUndefined();
  });

  it('renders search results using backend data and forwards params to filters', async () => {
    executeSearchMock.mockResolvedValueOnce({
      ok: true,
      listings: [{ id: '1', name: 'Eco Hub' }],
      pagination: { page: 2, totalPages: 3, hasMore: true, limit: 24, total: 60 },
      pageSizeOptions: [12, 24, 48],
      pages: [1, 2, 3],
    });

    const searchParams = Promise.resolve({
      q: 'eco hubs',
      destination: ['bangkok'],
      limit: '24',
    } as SearchParamRecord);
    const page = await SearchPage({ searchParams });
    render(page);

    expect(executeSearchMock).toHaveBeenCalledWith({
      q: 'eco hubs',
      destination: ['bangkok'],
      limit: '24',
    });

    expect(screen.getByTestId('page-layout')).toBeInTheDocument();

    // Wait for Suspense to resolve
    await screen.findByTestId('search-filters-form');
    expect(searchFiltersFormMock).toHaveBeenCalledWith(
      expect.objectContaining({
        initialParams: { q: 'eco hubs', destination: ['bangkok'], limit: '24' },
        resultsPath: '/search',
      })
    );

    expect(listingGridRenderMock).toHaveBeenCalledWith(
      expect.objectContaining({ listings: [{ id: '1', name: 'Eco Hub' }] })
    );

    expect(screen.getByText('Showing page 2 of 3')).toBeInTheDocument();
    expect(screen.getByLabelText('Per page')).toHaveValue('24');
    expect(screen.getByRole('link', { name: 'Prev' })).toHaveAttribute(
      'href',
      expect.stringContaining('/search?')
    );
    expect(screen.getByRole('link', { name: 'Next' })).toHaveAttribute(
      'href',
      expect.stringContaining('page=3')
    );
  });

  it('defaults to empty params when searchParams is undefined', async () => {
    executeSearchMock.mockResolvedValueOnce({
      ok: true,
      listings: [],
      pagination: { page: 1, totalPages: 1, hasMore: false, limit: 12, total: 0 },
      pageSizeOptions: [12, 24, 48, 96],
      pages: [1],
    });

    const page = await SearchPage({});
    render(page);

    expect(executeSearchMock).toHaveBeenCalledWith({});
    // Wait for Suspense to resolve
    await screen.findByTestId('search-filters-form');
    expect(searchFiltersFormMock).toHaveBeenCalledWith(
      expect.objectContaining({ initialParams: {}, resultsPath: '/search' })
    );
  });

  it('handles backend errors by showing a retry state', async () => {
    executeSearchMock.mockResolvedValueOnce({
      ok: false,
      reason: 'response',
      status: 500,
      statusText: 'Server Error',
    });

    const page = await SearchPage({
      searchParams: Promise.resolve({ retry: '2' } as SearchParamRecord),
    });
    render(page);

    // Wait for Suspense to resolve
    await screen.findByTestId('search-error-state');
    const errorState = screen.getByTestId('search-error-state');
    expect(errorState).toBeInTheDocument();
    const retryLink = screen.getByRole('link', { name: 'Retry search' });
    expect(retryLink).toHaveAttribute('href', '/search?retry=3');
  });
});
