import Link from 'next/link';

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

type ResultsPageProps = { searchParams: SearchParamRecord | Promise<SearchParamRecord> };

function PaginationButton({
  label,
  href,
  disabled,
}: {
  label: string;
  href?: string | null;
  disabled?: boolean;
}) {
  if (disabled || !href) {
    return (
      <NeoButton variant="outline" size="sm" disabled>
        {label}
      </NeoButton>
    );
  }
  return (
    <NeoButton asChild variant="outline" size="sm">
      <Link href={href}>{label}</Link>
    </NeoButton>
  );
}

export default async function ResultsPage({ searchParams }: ResultsPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const basePath = '/search/results';

  const retryRaw = resolvedSearchParams.retry;
  const retryValue = Array.isArray(retryRaw) ? retryRaw[retryRaw.length - 1] : retryRaw;
  const parsedRetry = Number.parseInt(String(retryValue ?? '0'), 10);
  const nextRetryCount = Number.isFinite(parsedRetry) ? parsedRetry + 1 : 1;
  const retryLink = buildSearchHref(basePath, resolvedSearchParams, {
    retry: String(nextRetryCount),
  });

  const result = await executeSearch(resolvedSearchParams);

  if (!result.ok) {
    const showDetails = process.env.NODE_ENV === 'development';
    const detailMessage =
      result.reason === 'response'
        ? `Error: ${result.status ?? 'unknown'} ${result.statusText ?? ''}`.trim()
        : 'Unexpected error occurred. Check server logs for details.';

    return (
      <PageLayoutServer>
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col gap-4" data-testid="search-error-state">
            <p className="text-red-500" data-testid="error-message">
              Failed to load search results. Please try again later.
            </p>
            <NeoButton asChild variant="outline" size="sm" data-testid="search-retry-button">
              <Link href={retryLink}>Retry search</Link>
            </NeoButton>
          </div>
          {showDetails && <p className="text-sm text-gray-500 mt-2">{detailMessage}</p>}
        </div>
      </PageLayoutServer>
    );
  }

  const { listings, pagination, pageSizeOptions, pages } = result;
  const { page, totalPages, limit } = pagination;

  const prevLink =
    page > 1 ? buildSearchHref(basePath, resolvedSearchParams, { page: String(page - 1) }) : null;
  const nextLink =
    page < totalPages
      ? buildSearchHref(basePath, resolvedSearchParams, { page: String(page + 1) })
      : null;

  return (
    <PageLayoutServer>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-10">
          <h1 className="heading-xl mb-8 text-center">Search for Sustainable Venues</h1>
          <SearchFiltersForm initialParams={resolvedSearchParams} />
        </div>
        <h2 className="heading-lg mb-4">Search Results</h2>
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="body-sm text-neo-text-secondary">
            Showing page {page} of {totalPages}
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
              defaultValue={String(limit)}
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
          <PaginationButton label="Prev" href={prevLink} />
          {pages.map((value, index) =>
            value === '…' ? (
              <span key={`ellipsis-${index}`} className="px-2">
                …
              </span>
            ) : (
              <NeoButton
                key={`page-${value}`}
                asChild
                variant={value === page ? 'primary' : 'outline'}
                size="sm"
              >
                <Link
                  href={buildSearchHref(basePath, resolvedSearchParams, { page: String(value) })}
                  aria-current={value === page ? 'page' : undefined}
                >
                  {value}
                </Link>
              </NeoButton>
            )
          )}
          <PaginationButton label="Next" href={nextLink} />
        </div>
      </div>
    </PageLayoutServer>
  );
}
