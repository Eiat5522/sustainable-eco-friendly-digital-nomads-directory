import Link from 'next/link';
import { Suspense } from 'react';
import { PageLayoutServer } from '@/components/layout/PageLayoutServer';
import { ListingGrid } from '@/components/listings/ListingGrid';
import { SearchFiltersForm } from '@/components/search/SearchFiltersForm';
import { NeoButton } from '@/components/ui/neo-button';
import {
  buildSearchHref,
  executeSearch,
  MAX_PARAM_VALUE_LENGTH,
} from '@/lib/data-access/search.dal';
import type { SearchParamRecord } from '@/types/search';

type SearchPageProps = { searchParams?: Promise<SearchParamRecord> };

/**
 * Search results component with data fetching
 * Wrapped in Suspense for granular loading control
 */
async function SearchResults({ searchParams }: { searchParams: SearchParamRecord }) {
  const basePath = '/search';

  const retryRaw = searchParams.retry;
  const retryValue = Array.isArray(retryRaw) ? retryRaw[retryRaw.length - 1] : retryRaw;
  const parsedRetry = Number.parseInt(String(retryValue ?? '0'), 10);
  const nextRetryCount = Number.isFinite(parsedRetry) ? parsedRetry + 1 : 1;
  const retryLink = buildSearchHref(basePath, searchParams, {
    retry: String(nextRetryCount),
  });

  const result = await executeSearch(searchParams);

  if (result.ok) {
    const { pagination, pageSizeOptions, listings, pages } = result;
    const prevLink =
      pagination.page > 1
        ? buildSearchHref(basePath, searchParams, { page: String(pagination.page - 1) })
        : null;
    const nextLink =
      pagination.page < pagination.totalPages
        ? buildSearchHref(basePath, searchParams, { page: String(pagination.page + 1) })
        : null;

    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-10">
          <h1 className="heading-xl mb-8 text-center">Search for Sustainable Venues</h1>
          <SearchFiltersForm initialParams={searchParams} resultsPath={basePath} />
        </div>
        <h2 className="heading-lg mb-4">Search Results</h2>
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="body-sm text-neo-text-secondary">
            Showing page {pagination.page} of {pagination.totalPages}
          </div>
          <form action={basePath} method="get" className="flex items-center gap-2">
            {Object.entries(searchParams).map(([key, value]) => {
              if (!/^[a-zA-Z0-9_-]+$/.test(key)) return null;
              return Array.isArray(value)
                ? value.map((entry, index) => (
                    <input
                      key={`${key}-${index}`}
                      type="hidden"
                      name={key}
                      value={String(entry).slice(0, MAX_PARAM_VALUE_LENGTH)}
                    />
                  ))
                : value !== undefined && (
                    <input
                      key={key}
                      type="hidden"
                      name={key}
                      value={String(value).slice(0, MAX_PARAM_VALUE_LENGTH)}
                    />
                  );
            })}
            <label htmlFor="page-size" className="body-sm">
              Per page
            </label>
            <select
              id="page-size"
              name="limit"
              defaultValue={String(pagination.limit)}
              className="neo-input border-2 border-neo-border rounded px-2 py-1"
            >
              {pageSizeOptions.map(size => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <input type="hidden" name="page" value="1" />
            <NeoButton type="submit" variant="outline" size="sm">
              Apply
            </NeoButton>
          </form>
        </div>

        {listings.length === 0 ? (
          <p className="text-neo-text-secondary" data-testid="no-results">
            No results found.
          </p>
        ) : (
          <div data-testid="search-results">
            <ListingGrid listings={listings} />
          </div>
        )}

        <div className="flex items-center justify-center gap-2 mt-8">
          <NeoButton asChild variant="outline" size="sm" disabled={!prevLink}>
            <Link href={prevLink || '#'} aria-disabled={!prevLink}>
              Prev
            </Link>
          </NeoButton>
          {pages.map((value, index) =>
            value === '…' ? (
              <span key={`ellipsis-${index}`} className="px-2">
                …
              </span>
            ) : (
              <NeoButton
                key={`page-${value}`}
                asChild
                variant={value === pagination.page ? 'primary' : 'outline'}
                size="sm"
              >
                <Link
                  href={buildSearchHref(basePath, searchParams, { page: String(value) })}
                  aria-current={value === pagination.page ? 'page' : undefined}
                >
                  {value}
                </Link>
              </NeoButton>
            )
          )}
          <NeoButton asChild variant="outline" size="sm" disabled={!nextLink}>
            <Link href={nextLink || '#'} aria-disabled={!nextLink}>
              Next
            </Link>
          </NeoButton>
        </div>
      </div>
    );
  } else {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-4" data-testid="search-error-state">
          <p className="text-red-500" data-testid="error-message">
            Failed to load search results. Please try again later.
          </p>
          <NeoButton asChild variant="outline" size="sm" data-testid="search-retry-button">
            <Link href={retryLink}>Retry search</Link>
          </NeoButton>
        </div>
        {process.env.NODE_ENV === 'development' && (
          <p className="text-sm text-gray-500 mt-2">
            {result.reason === 'response'
              ? `Error: ${result.status ?? 'unknown'} ${result.statusText ?? ''}`.trim()
              : 'Unexpected error occurred. Check server logs for details.'}
          </p>
        )}
      </div>
    );
  }
}

/**
 * Loading fallback for search results
 */
function SearchLoadingFallback() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-10">
        <div className="h-12 bg-gray-200 rounded animate-pulse mb-8" />
        <div className="h-32 bg-gray-100 rounded animate-pulse" />
      </div>
      <div className="space-y-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-32 bg-gray-100 rounded animate-pulse" />
        ))}
      </div>
    </div>
  );
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};

  return (
    <PageLayoutServer>
      <Suspense fallback={<SearchLoadingFallback />}>
        <SearchResults searchParams={resolvedSearchParams} />
      </Suspense>
    </PageLayoutServer>
  );
}
