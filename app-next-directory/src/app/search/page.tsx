'use client';

import { ListingGrid } from '@/components/listings/ListingGrid';
import DigitalNomadSearchFilter from '@/components/ui/DigitalNomadSearchFilter';
import { Alert } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { WorldMapDemo } from '@/components/ui/world-map-demo';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import React from 'react';

function SearchResultsComponent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams?.get('q') || '';

  const [query, setQuery] = React.useState(initialQuery);
  const [results, setResults] = React.useState<any[]>([]);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pagination, setPagination] = React.useState({
    page: 1,
    total: 0,
    totalPages: 0,
    hasMore: false
  });
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const fetchResults = React.useCallback(async (searchQuery: string, page: number = 1, filters: Record<string, string> = {}) => {
    if (!searchQuery.trim() && Object.keys(filters).length === 0) {
      setResults([]);
      setPagination({ page: 1, total: 0, totalPages: 0, hasMore: false });
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const queryParams = new URLSearchParams({
        q: searchQuery,
        page: page.toString(),
        limit: '12',
        ...filters,
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
  }, []);

  const handleQueryChange = React.useCallback((newQuery: string) => {
    setQuery(newQuery);
    const queryParams = new URLSearchParams(searchParams?.toString());
    queryParams.set('q', newQuery);
    router.push(`/search?${queryParams.toString()}`);
  }, [router, searchParams]);

  const handleFiltersChange = React.useCallback((filters: Record<string, string>) => {
    const queryParams = new URLSearchParams(searchParams?.toString());
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        queryParams.set(key, value);
      } else {
        queryParams.delete(key);
      }
    });
    queryParams.set('page', '1');
    router.push(`/search?${queryParams.toString()}`);
  }, [router, searchParams]);

  const handlePageChange = React.useCallback((newPage: number) => {
    setCurrentPage(newPage);
    const currentFilters = Object.fromEntries(searchParams?.entries() || []);
    fetchResults(query, newPage, currentFilters);
  }, [query, fetchResults, searchParams]);

  React.useEffect(() => {
    const currentFilters = Object.fromEntries(searchParams?.entries() || []);
    const q = currentFilters.q || '';
    const page = parseInt(currentFilters.page, 10) || 1;
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

export default function SearchResults() {
  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <SearchResultsComponent />
    </React.Suspense>
  );
}
