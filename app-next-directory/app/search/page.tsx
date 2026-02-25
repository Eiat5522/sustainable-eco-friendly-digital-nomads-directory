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
export async function SearchResults({ searchParams }: { searchParams: SearchParamRecord }) {
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
      <div className="relative overflow-hidden bg-neo-secondary px-4 py-12 sm:py-14">
        <div
          className="pointer-events-none absolute inset-0 z-0 opacity-25"
          style={{
            backgroundImage:
              'radial-gradient(circle at 2px 2px, var(--neo-border) 2px, transparent 0)',
            backgroundSize: '28px 28px',
          }}
        />
        <div className="pointer-events-none absolute -left-3 top-8 h-20 w-20 rotate-12 border-4 border-neo-border bg-neo-primary shadow-[6px_6px_0_0] shadow-neo-shadow" />
        <div className="pointer-events-none absolute right-4 top-12 h-16 w-16 rounded-full border-4 border-neo-border bg-neo-accent shadow-[5px_5px_0_0] shadow-neo-shadow" />
        <div className="pointer-events-none absolute bottom-8 right-8 h-24 w-24 rounded-full border-4 border-neo-secondary bg-neo-border opacity-35" />

        <div className="container relative z-10 mx-auto max-w-6xl">
          <div
            className="overflow-hidden border-4 border-neo-border bg-neo-surface"
            style={{ boxShadow: '12px 12px 0px 0px var(--neo-shadow)' }}
          >
            <div className="border-b-4 border-neo-border bg-neo-success p-6 md:p-8">
              <div className="mb-4 inline-block border-2 border-neo-border bg-neo-surface px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] shadow-[3px_3px_0_0] shadow-neo-shadow">
                Eco Discovery
              </div>
              <h1 className="heading-xl text-neo-border">Search for Sustainable Venues</h1>
              <p className="mt-2 max-w-2xl text-sm font-semibold text-neo-border/80">
                Filter by city, workspace type, and amenities to find your next eco-forward base.
              </p>
            </div>
            <div className="p-6 md:p-8">
              <SearchFiltersForm initialParams={searchParams} resultsPath={basePath} />
            </div>
          </div>
        </div>
        <div className="container relative z-10 mx-auto mt-8 max-w-6xl">
          <section
            className="border-4 border-neo-border bg-neo-surface p-6 md:p-8"
            style={{ boxShadow: '12px 12px 0px 0px var(--neo-shadow)' }}
          >
            <h2 className="heading-lg mb-4">Search Results</h2>
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="body-sm text-neo-text-secondary">
                Showing page {pagination.page} of {pagination.totalPages}
              </div>
              <form action={basePath} method="get" className="flex flex-wrap items-center gap-2">
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
                <label htmlFor="page-size" className="body-sm font-semibold">
                  Per page
                </label>
                <select
                  id="page-size"
                  name="limit"
                  defaultValue={String(pagination.limit)}
                  className="neo-input rounded border-2 border-neo-border px-2 py-1"
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

            <div className="mt-8 flex items-center justify-center gap-2">
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
          </section>
        </div>
      </div>
    );
  } else {
    return (
      <div className="relative overflow-hidden bg-neo-secondary px-4 py-12">
        <div
          className="pointer-events-none absolute inset-0 z-0 opacity-25"
          style={{
            backgroundImage:
              'radial-gradient(circle at 2px 2px, var(--neo-border) 2px, transparent 0)',
            backgroundSize: '28px 28px',
          }}
        />
        <div className="container relative z-10 mx-auto max-w-3xl">
          <div
            className="border-4 border-neo-border bg-neo-surface p-6 md:p-8"
            style={{ boxShadow: '12px 12px 0px 0px var(--neo-shadow)' }}
          >
            <div className="flex flex-col gap-4" data-testid="search-error-state">
              <p className="text-red-500" data-testid="error-message">
                Failed to load search results. Please try again later.
              </p>
              <NeoButton asChild variant="outline" size="sm" data-testid="search-retry-button">
                <Link href={retryLink}>Retry search</Link>
              </NeoButton>
            </div>
            {process.env.NODE_ENV === 'development' && (
              <p className="mt-2 text-sm text-gray-500">
                {result.reason === 'response'
                  ? `Error: ${result.status ?? 'unknown'} ${result.statusText ?? ''}`.trim()
                  : 'Unexpected error occurred. Check server logs for details.'}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }
}

/**
 * Loading fallback for search results
 */
function SearchLoadingFallback() {
  return (
    <div className="relative overflow-hidden bg-neo-secondary px-4 py-12">
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-25"
        style={{
          backgroundImage:
            'radial-gradient(circle at 2px 2px, var(--neo-border) 2px, transparent 0)',
          backgroundSize: '28px 28px',
        }}
      />
      <div className="container relative z-10 mx-auto max-w-6xl space-y-8">
        <div className="border-4 border-neo-border bg-neo-surface p-6 md:p-8">
          <div className="mb-4 h-8 w-48 animate-pulse bg-gray-200" />
          <div className="h-24 animate-pulse bg-gray-100" />
        </div>
        <div className="border-4 border-neo-border bg-neo-surface p-6 md:p-8">
          <div className="mb-4 h-7 w-40 animate-pulse bg-gray-200" />
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 animate-pulse bg-gray-100" />
            ))}
          </div>
        </div>
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
