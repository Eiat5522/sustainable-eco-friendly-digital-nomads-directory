import { SearchFilters, SortOption } from '@/types/search';
import debounce from 'lodash/debounce';
import { useCallback, useEffect, useState } from 'react';

interface UseSearchResults {
  results: any[];
  isLoading: boolean;
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

export function useSearch({
  initialQuery = '',
  initialFilters = {
    query: '',
    ecoTags: [],
    hasDigitalNomadFeatures: false
  },
  initialSort,
  debounceMs = 300
}: UseSearchProps = {}) {
  const [query, setQuery] = useState(initialQuery);
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [sort, setSort] = useState<SortOption | undefined>(initialSort);
  const [page, setPage] = useState(1);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [results, setResults] = useState<UseSearchResults>({
    results: [],
    isLoading: false,
    error: null,
    pagination: {
      total: 0,
      page: 1,
      totalPages: 0,
      hasMore: false
    }
  });

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (searchQuery: string, searchFilters: SearchFilters, currentPage: number, sortOption?: SortOption) => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch('/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: searchQuery,
            filters: searchFilters,
            page: currentPage,
            sort: sortOption
          })
        });

        if (!response.ok) {
          throw new Error('Search request failed');
        }

        const data = await response.json();
        setResults(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error occurred'));
      } finally {
        setIsLoading(false);
      }
    }, debounceMs),
    []
  );

  // Debounced suggestions function
  const debouncedGetSuggestions = useCallback(
    debounce(async (searchQuery: string) => {
      if (!searchQuery || searchQuery.length < 2) {
        setSuggestions([]);
        return;
      }

      try {
        setIsLoadingSuggestions(true);
        const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(searchQuery)}`);
        if (!response.ok) throw new Error('Failed to fetch suggestions');
        const data = await response.json();
        setSuggestions(data);
      } catch (err) {
        console.error('Error fetching suggestions:', err);
        setSuggestions([]);
      } finally {
        setIsLoadingSuggestions(false);
      }
    }, 200),
    []
  );

  // Update search when inputs change
  useEffect(() => {
        const processedQuery = query; // Preserve whitespace for mock fetch compatibility
        console.log('Processed Query:', processedQuery);
        console.log('Filters updated:', filters);
        console.log('Page updated:', page);
        console.log('Sort updated:', sort);
        console.log('useSearch - Fetch called with:', { query: processedQuery, filters, page, sort });
        debouncedSearch(processedQuery, filters, page, sort);
    }, [query, filters, page, sort, debouncedSearch]);

  // Update suggestions when query changes
  useEffect(() => {
    debouncedGetSuggestions(query);
  }, [query, debouncedGetSuggestions]);

  // Add detailed logging to trace query processing and fetch behavior
  useEffect(() => {
    console.log('useSearch - Query:', query);
    console.log('useSearch - Filters:', filters);
    console.log('useSearch - Page:', page);
    console.log('useSearch - Sort:', sort);
    debouncedSearch(query, filters, page, sort);
}, [query, filters, page, sort, debouncedSearch]);

  // Handlers
  const handleQueryChange = useCallback((newQuery: string) => {
    setQuery(newQuery);
    setPage(1); // Reset to first page on new search
  }, []);

  const handleFiltersChange = useCallback((newFilters: Partial<SearchFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPage(1); // Reset to first page on filter change
  }, []);

  const handleSortChange = useCallback((newSort: SortOption) => {
    setSort(newSort);
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const clearFilters = useCallback(() => {
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
    error,
    suggestions,
    isLoadingSuggestions,
    handleQueryChange,
    handleFiltersChange,
    handleSortChange,
    handlePageChange,
    clearFilters
  };
}

// Add a custom type declaration for lodash debounce
// FORTEST: Temporary type declaration for lodash debounce
// TODO: Replace with official @types/lodash once resolved

declare module 'lodash/debounce' {
  export default function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number,
    options?: {
      leading?: boolean;
      trailing?: boolean;
    }
  ): T;
}
