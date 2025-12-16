'use client';

import { useRouter } from 'next/navigation';
import { type FormEvent, type KeyboardEvent, useMemo, useRef, useState } from 'react';
import {
  type SearchListing,
  type SearchRequest,
  useSearchListings,
} from '@/hooks/useSearchListings';

interface SearchCategoryOption {
  label: string;
  value: string;
  ariaLabel?: string;
}

const CATEGORY_OPTIONS: SearchCategoryOption[] = [
  { label: 'All categories', value: '', ariaLabel: 'All venue categories' },
  { label: 'Coworking', value: 'coworking' },
  { label: 'Coliving', value: 'coliving' },
  { label: 'Café', value: 'cafe' },
  { label: 'Community Space', value: 'community' },
];

const FILTER_PRESETS = [
  { key: 'solarPowered', label: 'Solar powered' },
  { key: 'veganFriendly', label: 'Vegan friendly' },
  { key: 'wifiIncluded', label: 'Reliable Wi-Fi' },
];

interface SearchResultsProps {
  listings: SearchListing[];
  totalCount: number;
  hasMore: boolean;
  onClearFilters: () => void;
}

function SearchResults({ listings, totalCount, hasMore, onClearFilters }: SearchResultsProps) {
  if (listings.length === 0) {
    return (
      <section
        aria-label="Search results"
        aria-live="polite"
        className="mt-6"
        data-testid="empty-results"
      >
        <p className="text-sm text-muted-foreground">No results found</p>
        <button type="button" className="mt-2 underline" onClick={onClearFilters}>
          Clear filters
        </button>
      </section>
    );
  }

  return (
    <section aria-label="Search results" aria-live="polite" className="mt-6 space-y-4">
      <output className="font-medium" aria-live="polite" aria-label={`${totalCount} results found`}>
        {totalCount} results found
      </output>
      <ul className="space-y-3">
        {listings.map(listing => (
          <li key={listing.id} className="rounded border border-border p-3">
            <h3 className="font-semibold">{listing.title}</h3>
            {listing.city ? <p className="text-sm text-muted-foreground">{listing.city}</p> : null}
            {listing.category ? (
              <p className="text-xs uppercase text-muted-foreground">{listing.category}</p>
            ) : null}
          </li>
        ))}
      </ul>
      {hasMore ? (
        <p className="text-xs text-muted-foreground">
          More results available, refine your filters to narrow down.
        </p>
      ) : null}
    </section>
  );
}

export function SearchForm(): React.JSX.Element {
  const router = useRouter();
  const { listings, loading, error, searchListings, totalCount, hasMore } = useSearchListings();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [filters, setFilters] = useState<Record<string, boolean>>({});
  const [showFilters, setShowFilters] = useState(false);
  const [lastParams, setLastParams] = useState<SearchRequest | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const categorySelectRef = useRef<HTMLSelectElement | null>(null);
  const filterButtonRef = useRef<HTMLButtonElement | null>(null);

  const activeFilters = useMemo(() => {
    return Object.fromEntries(Object.entries(filters).filter(([, isEnabled]) => isEnabled));
  }, [filters]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const params: SearchRequest = {
      query,
      category: category || undefined,
      filters: { ...activeFilters },
    };
    setLastParams(params);
    void searchListings(params);

    const segments: string[] = [];
    if (params.query) segments.push(`search=${encodeURIComponent(params.query)}`);
    if (params.category) segments.push(`category=${encodeURIComponent(params.category)}`);
    if (Object.keys(activeFilters).length) {
      segments.push(`filters=${encodeURIComponent(JSON.stringify(activeFilters))}`);
    }

    const next = segments.join('&');
    router.push(next ? `/search?${next}` : '/search');
  };

  const handleRetry = () => {
    const params = lastParams ?? {
      query,
      category: category || undefined,
      filters: { ...activeFilters },
    };
    setLastParams(params);
    void searchListings(params);
  };

  const handleClearFilters = () => {
    setCategory('');
    setFilters({});
    setLastParams({ query: '', filters: {} });
    setQuery('');
    void searchListings({ query: '', filters: {} });
    router.push('/search');
  };

  const toggleFilter = (key: string) => {
    setFilters(previous => ({
      ...previous,
      [key]: !previous[key],
    }));
  };

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Tab') return;
    if (event.shiftKey) return;
    event.preventDefault();
    categorySelectRef.current?.focus();
  };

  const handleCategoryKeyDown = (event: KeyboardEvent<HTMLSelectElement>) => {
    if (event.key !== 'Tab') return;
    event.preventDefault();
    if (event.shiftKey) {
      searchInputRef.current?.focus();
      return;
    }
    filterButtonRef.current?.focus();
  };

  const handleFilterKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== 'Tab') return;
    if (!event.shiftKey) return;
    event.preventDefault();
    categorySelectRef.current?.focus();
  };

  return (
    <div className="w-full max-w-3xl">
      <form
        onSubmit={handleSubmit}
        aria-label="Search listings"
        className="rounded-md border border-border bg-card p-4 shadow-sm"
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="search-input" className="text-sm font-medium">
              Search for eco-friendly venues
            </label>
            <input
              id="search-input"
              name="search"
              type="search"
              value={query}
              onChange={event => setQuery(event.target.value)}
              onKeyDown={handleSearchKeyDown}
              ref={searchInputRef}
              placeholder="Find sustainable coworking, cafés, retreats..."
              aria-describedby="search-help"
              className="rounded border border-border px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neo-primary"
            />
            <p id="search-help" className="sr-only">
              Search by venue name, location, or type of space
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="category" className="text-sm font-medium">
              Filter by venue category
            </label>
            <select
              id="category"
              name="category"
              value={category}
              onChange={event => setCategory(event.target.value)}
              onKeyDown={handleCategoryKeyDown}
              ref={categorySelectRef}
              aria-describedby="category-help"
              className="rounded border border-border px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neo-primary"
            >
              {CATEGORY_OPTIONS.map(option => (
                <option
                  key={option.value}
                  value={option.value}
                  {...(option.ariaLabel ? { 'aria-label': option.ariaLabel } : {})}
                >
                  {option.label}
                </option>
              ))}
            </select>
            <p id="category-help" className="sr-only">
              Choose a specific venue type to narrow your search results
            </p>
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowFilters(value => !value)}
              aria-expanded={showFilters}
              aria-controls="filter-panel"
              className="text-sm font-medium underline hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neo-primary rounded-sm px-1 py-1"
              onKeyDown={handleFilterKeyDown}
              ref={filterButtonRef}
            >
              {showFilters ? 'Hide filters' : 'Show filters'}
            </button>
            <button
              type="submit"
              className="rounded bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-colors"
            >
              Search
            </button>
          </div>
        </div>
      </form>

      <div
        id="filter-panel"
        data-testid="filter-panel"
        aria-hidden={!showFilters}
        style={{ display: showFilters ? 'block' : 'none' }}
        className="mt-4 rounded-md border border-dashed border-border p-4"
      >
        <p className="mb-2 text-sm font-semibold">Refine results</p>
        <div className="flex flex-col gap-2">
          {FILTER_PRESETS.map(filter => (
            <label key={filter.key} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={Boolean(filters[filter.key])}
                onChange={() => toggleFilter(filter.key)}
              />
              {filter.label}
            </label>
          ))}
        </div>
      </div>

      {loading ? (
        <div
          className="mt-6 flex items-center gap-2 text-sm text-muted-foreground"
          data-testid="search-loading"
        >
          <span className="animate-pulse">Searching...</span>
        </div>
      ) : null}

      {error ? (
        <div
          className="mt-6 rounded border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
          role="alert"
        >
          <p>{error}</p>
          <button type="button" className="mt-2 underline" onClick={handleRetry}>
            Try again
          </button>
        </div>
      ) : null}

      <SearchResults
        listings={listings}
        totalCount={totalCount}
        hasMore={hasMore}
        onClearFilters={handleClearFilters}
      />
    </div>
  );
}

export default SearchForm;
