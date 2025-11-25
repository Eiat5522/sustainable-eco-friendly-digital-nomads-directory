import Link from 'next/link';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { ListingGrid } from '@/components/listings/ListingGrid';
import { SearchFiltersForm } from '@/components/search/SearchFiltersForm';
import { NeoButton } from '@/components/ui/neo-button';
import type { SearchParamRecord } from '@/types/search';

import { fetchSearchResults } from './results/server';
import { buildSearchHref, MAX_PARAM_VALUE_LENGTH } from './results/shared';

type SearchPageProps = { searchParams?: Promise<SearchParamRecord> };

// MIGRATED: Removed export const dynamic = 'force-dynamic' (incompatible with Cache Components)

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const basePath = '/search';

  const retryRaw = resolvedSearchParams.retry;
  const retryValue = Array.isArray(retryRaw) ? retryRaw[retryRaw.length - 1] : retryRaw;
  const parsedRetry = Number.parseInt(String(retryValue ?? '0'), 10);
  const nextRetryCount = Number.isFinite(parsedRetry) ? parsedRetry + 1 : 1;
  const retryLink = buildSearchHref(basePath, resolvedSearchParams, {
    retry: String(nextRetryCount),
  });

  const result = await fetchSearchResults(resolvedSearchParams);

  let mainContent;
  if (result.ok) {
    const { pagination, pageSizeOptions, listings, pages } = result;
    const prevLink =
      pagination.page > 1
        ? buildSearchHref(basePath, resolvedSearchParams, { page: String(pagination.page - 1) })
        : null;
    const nextLink =
      pagination.page < pagination.totalPages
        ? buildSearchHref(basePath, resolvedSearchParams, { page: String(pagination.page + 1) })
        : null;

    mainContent = (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-10">
          <h1 className="heading-xl mb-8 text-center">Search for Sustainable Venues</h1>
          <SearchFiltersForm initialParams={resolvedSearchParams} resultsPath={basePath} />
        </div>
        <h2 className="heading-lg mb-4">Search Results</h2>
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="body-sm text-neo-text-secondary">
            Showing page {pagination.page} of {pagination.totalPages}
          </div>
          <form action={basePath} method="get" className="flex items-center gap-2">
            {Object.entries(resolvedSearchParams).map(([key, value]) => {
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
          <p className="text-neo-text-secondary">No results found.</p>
        ) : (
          <ListingGrid listings={listings} />
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
                  href={buildSearchHref(basePath, resolvedSearchParams, { page: String(value) })}
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
    mainContent = (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-4" data-testid="search-error-state">
          <p className="text-red-500">Failed to load search results. Please try again later.</p>
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>{mainContent}</main>
      <Footer />
    </div>
  );
}
