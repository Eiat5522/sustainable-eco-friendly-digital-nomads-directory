'use client';

import { ListingGrid } from '@/components/listings/ListingGrid';
import { SearchBar } from '@/components/search/SearchBar';
import { Alert } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState, Suspense } from 'react';

function SearchResultsComponent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams?.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    totalPages: 0,
    hasMore: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  // Fetch search results
  const fetchResults = useCallback(async (searchQuery: string, page: number = 1) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setPagination({ page: 1, total: 0, totalPages: 0, hasMore: false });
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&page=${page}&limit=12`);
      
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

  // Handle search query changes
  const handleQueryChange = useCallback((newQuery: string) => {
    setQuery(newQuery);
    router.push(`/search?q=${encodeURIComponent(newQuery)}`);
  }, [router]);

  // Handle page changes
  const handlePageChange = useCallback((newPage: number) => {
    setCurrentPage(newPage);
    fetchResults(query, newPage);
  }, [query, fetchResults]);

  // Initial search when component mounts or query changes
  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
      fetchResults(initialQuery);
    }
  }, [initialQuery, fetchResults]);

  // Mock functions for compatibility with existing components
  const handleFiltersChange = useCallback(() => {}, []);
  const handleSortChange = useCallback(() => {}, []);
  const clearFilters = useCallback(() => {}, []);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Search Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Search Results</h1>
        <div className="relative">
          <SearchBar
            value={query}
            onChange={handleQueryChange}
            suggestions={suggestions}
            isLoading={isLoadingSuggestions}
          />
        </div>
      </div>

      {/* Results Area */}
      <div className="w-full">
        {/* Results Header */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-gray-600">
            {pagination.total} listings found
            {query && ` for "${query}"`}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert
            type="error"
            title="Search Error"
            message={error.message}
            className="mb-6"
          />
        )}

        {/* Results Grid */}
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

        {/* Simple Pagination */}
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
    <Suspense fallback={<div>Loading...</div>}>
      <SearchResultsComponent />
    </Suspense>
  );
}
