'use client';

import { ListingGrid } from '@/components/listings/ListingGrid';
import DigitalNomadSearchFilter from '@/components/ui/DigitalNomadSearchFilter';
import { Alert } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { WorldMapDemo } from '@/components/ui/world-map-demo';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import React, { useCallback, useState } from 'react';

// Type definitions
interface SearchResult {
  id: string;
  title: string;
  // Add other result properties as needed
}

interface MultiSelectFilters {
  destination: string[];
  category: string[];
  features_amenities: string[];
}

interface SearchPagination {
  page: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

type FetchResultsFn = (searchQuery: string, page?: number, filters?: Record<string, string | string[]>) => Promise<void>;
type QueryChangeFn = (query: string) => void;
type FiltersChangeFn = (filters: MultiSelectFilters) => void;
type PageChangeFn = (page: number) => void;

function SearchResultsComponent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams?.get('q') || '';

  // State with proper typing
  const [query, setQuery] = useState<string>(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pagination, setPagination] = useState<SearchPagination>({
    page: 1,
    total: 0,
    totalPages: 0,
    hasMore: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchResults = useCallback(
    async (searchQuery: string, page: number = 1, filters: Record<string, string | string[]> = {}) => {
      if (!searchQuery.trim() && Object.values(filters).every(v => (Array.isArray(v) ? v.length === 0 : !v))) {
        setResults([]);
        setPagination({ page: 1, total: 0, totalPages: 0, hasMore: false });
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const queryParams = new URLSearchParams();
        queryParams.set('q', searchQuery);
        queryParams.set('page', page.toString());
        queryParams.set('limit', '12');
        Object.entries(filters).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            (value as string[]).forEach((v) => v && queryParams.append(key, v));
          } else if (value) {
            queryParams.set(key, value as string);
          }
        });

        const response = await fetch(`/api/search?${queryParams.toString()}`);
        
        if (!response.ok) {
          throw new Error('Search request failed');
        }

        const data = await response.json();
        
        if (data.success) {
          setResults(data.data.results || []);
          setPagination(data.data.pagination || { page: 1, total: 0, totalPages: 0, hasMore: false });
        } else {
          throw new Error(data.error || 'Search failed');
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error occurred'));
        setResults([]);
        setPagination({ page: 1, total: 0, totalPages: 0, hasMore: false });
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const handleQueryChange = useCallback((newQuery: string) => {
    setQuery(newQuery);
    const queryParams = new URLSearchParams(searchParams?.toString());
    queryParams.set('q', newQuery);
    router.push(`/search?${queryParams.toString()}`);
  }, [router, searchParams]);

  const handleFiltersChange = useCallback((filters: MultiSelectFilters) => {
    const queryParams = new URLSearchParams(searchParams?.toString());
    queryParams.delete('destination');
    queryParams.delete('category');
    queryParams.delete('features_amenities');
    Object.entries(filters).forEach(([key, values]) => {
      if (Array.isArray(values) && values.length > 0) {
        (values as string[]).forEach((value) => {
          queryParams.append(key, value);
        });
      }
    });
    queryParams.set('page', '1');
    router.push(`/search?${queryParams.toString()}`);
  }, [router, searchParams]);

  const handlePageChange = useCallback((newPage: number) => {
    setCurrentPage(newPage);
    const currentFilters: Record<string, string | string[]> = {};
    searchParams?.forEach((value, key) => {
      const existing = currentFilters[key];
      if (existing) {
        if (Array.isArray(existing)) {
          (existing as string[]).push(value);
        } else {
          currentFilters[key] = [existing as string, value];
        }
      } else {
        currentFilters[key] = value;
      }
    });
    fetchResults(query, newPage, currentFilters);
  }, [query, fetchResults, searchParams]);

  React.useEffect(() => {
    const currentFilters: Record<string, string | string[]> = {};
    searchParams?.forEach((value, key) => {
      const existing = currentFilters[key];
      if (existing) {
        if (Array.isArray(existing)) {
          existing.push(value);
        } else {
          currentFilters[key] = [existing, value];
        }
      } else {
        currentFilters[key] = value;
      }
    });

    const q = (currentFilters.q as string) || '';
    const page = parseInt((currentFilters.page as string) || '1', 10) || 1;
    setQuery(q);
    setCurrentPage(page);
    fetchResults(q, page, currentFilters);
  }, [searchParams, fetchResults]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-12">
        <WorldMapDemo />
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Search Results</h1>
        <DigitalNomadSearchFilter
          onSearch={handleQueryChange}
          onFilterChange={handleFiltersChange}
        />
      </div>

      <div className="w-full">
        <div className="mb-6 flex items-center justify-between">
          <p className="text-gray-600">
            {pagination.total} listings found
            {query && ` for "${query}"`}
          </p>
        </div>

        {error && (
          <Alert
            type="error"
            title="Search Error"
            message={error.message}
            className="mb-6"
          />
        )}

        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex justify-center items-center min-h-[400px]"
            >
              <LoadingSpinner />
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ListingGrid listings={results} />
            </motion.div>
          )}
        </AnimatePresence>

        {pagination.totalPages > 1 && (
          <div className="mt-8 flex justify-center space-x-4">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-gray-700">
              Page {currentPage} of {pagination.totalPages}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= pagination.totalPages}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const SearchResultsWithSuspense = dynamic(
  () => Promise.resolve(SearchResultsComponent),
  {
    ssr: false,
    loading: () => <div>Loading...</div>
  }
);

export default function SearchResults() {
  return <SearchResultsWithSuspense />;
}
