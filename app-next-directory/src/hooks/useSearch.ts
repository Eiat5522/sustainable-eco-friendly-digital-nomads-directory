import { useState, useEffect, useCallback } from 'react';
import { SearchFilters, SortOption } from '@/types/search';

interface UseSearchResults {
  results: any[];
  error: Error | null;
  pagination: {
    total: number;
    page: number;
    totalPages: number;
    hasMore: boolean;
  };
}

interface UseSearchProps {
  initialQuery?: string;
  initialFilters?: SearchFilters;
  initialSort?: SortOption;
  debounceMs?: number;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const h = setTimeout(() => {
      // eslint-disable-next-line no-console
      console.log('useDebounce setDebounced', value);
      setDebounced(value);
    }, delay);
    return () => clearTimeout(h);
  }, [value, delay]);
  return debounced;
}

export function useSearch({
  initialQuery = '',
  initialFilters = { query: '', ecoTags: [], hasDigitalNomadFeatures: false },
  initialSort,
  debounceMs = 300,
}: UseSearchProps = {}) {
  // state
  const [query, setQuery] = useState(initialQuery);
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [sort, setSort] = useState<SortOption | undefined>(initialSort);
  const [page, setPage] = useState(1);
  
  const [results, setResults] = useState<UseSearchResults>({
    results: [], error: null,
    pagination: { total: 0, page: 1, totalPages: 0, hasMore: false }
  });
  const [isLoading, setIsLoading] = useState(false);

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  // debounced inputs
  const debouncedQuery = useDebounce(query, debounceMs);
  const debouncedSuggest = useDebounce(query, 200);

  // fetch search results
  useEffect(() => {
    // only fire if query/filter/sort/page change after debounce
    async function doSearch() {
      try {
        setIsLoading(true);
        // DEBUG: Log the debouncedQuery and body
        // eslint-disable-next-line no-console
        console.log('SEARCH HOOK FETCH', debouncedQuery, {
          query: debouncedQuery,
          filters,
          page,
          sort
        });
        const res = await fetch('/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: debouncedQuery,
            filters,
            page,
            sort
          })
        });
        if (!res.ok) throw new Error('Search request failed');
        const data = await res.json();
        setResults(data);
      } catch (err) {
        setResults(r => ({ ...r, error: err instanceof Error ? err : new Error('Unknown') }));
      } finally {
        setIsLoading(false);
      }
    }

    doSearch();
  }, [debouncedQuery, filters, page, sort]);

  // fetch suggestions
  useEffect(() => {
    if (debouncedSuggest.length < 2) {
      setSuggestions([]);
      return;
    }
    let canceled = false;
    async function getSuggestions() {
      setIsLoadingSuggestions(true);
      try {
        const res = await fetch(`/api/search/suggestions?q=${encodeURIComponent(debouncedSuggest)}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (!canceled) setSuggestions(data);
      } catch {
        if (!canceled) setSuggestions([]);
      } finally {
        if (!canceled) setIsLoadingSuggestions(false);
      }
    }
    getSuggestions();
    return () => { canceled = true; };
  }, [debouncedSuggest]);

  // handlers
  const handleQueryChange = useCallback((q: string) => {
    setQuery(q);
    setPage(1);
  }, []);

  const handleFiltersChange = useCallback((f: Partial<SearchFilters>) => {
    setFilters(prev => ({ ...prev, ...f }));
    setPage(1);
  }, []);

  const handleSortChange = useCallback((s: SortOption) => setSort(s), []);
  const handlePageChange = useCallback((p: number) => setPage(p), []);
  const clearFilters   = useCallback(() => {
    setFilters(initialFilters);
    setSort(undefined);
  }, [initialFilters]);

  return {
    query,
    filters,
    sort,
    page,
    results: results.results,
    pagination: results.pagination,
    isLoading,
    error: results.error,
    suggestions,
    isLoadingSuggestions,
    handleQueryChange,
    handleFiltersChange,
    handleSortChange,
    handlePageChange,
    clearFilters
  };
}
