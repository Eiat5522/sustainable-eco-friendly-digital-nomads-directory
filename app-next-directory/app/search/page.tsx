'use client';

import { ListingGrid } from '@/components/listings/ListingGrid';
import DigitalNomadSearch from '@/components/ui/DigitalNomadSearch';
import { Alert } from '@/components/ui/Alert';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import React, { useCallback, useState } from 'react';
import { Leaf, Laptop } from 'lucide-react';

// Types
interface SearchResult {
  id: string;
  title: string;
}

interface SearchPagination {
  page: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

// Filters payload emitted by DigitalNomadSearch
interface DnFilters {
  searchText: string;
  destinations: string[];
  categories: string[];
  amenities: string[];
}

function SearchResultsComponent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams?.get('q') || '';

  const [query, setQuery] = useState<string>(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pagination, setPagination] = useState<SearchPagination>({
    page: 1,
    total: 0,
    totalPages: 0,
    hasMore: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchResults = useCallback(
    async (
      searchQuery: string,
      page = 1,
      filters: Record<string, string | string[]> = {}
    ) => {
      if (
        !searchQuery.trim() &&
        Object.values(filters).every((v) => (Array.isArray(v) ? v.length === 0 : !v))
      ) {
        setResults([]);
        setPagination({ page: 1, total: 0, totalPages: 0, hasMore: false });
        return;
      }
      setIsLoading(true);
      setError(null);
      const queryParams = new URLSearchParams();
      queryParams.set('q', searchQuery);
      queryParams.set('page', page.toString());
      queryParams.set('limit', '12');
      Object.entries(filters).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach((v) => v && queryParams.append(key, v));
        } else if (value) {
          queryParams.set(key, value);
        }
      });

      try {
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        const response = await fetch(`${baseUrl}/api/search?${queryParams.toString()}`);
        if (!response.ok) throw new Error('Search request failed');
        const data = await response.json();
        if (data.success) {
          setResults(data.data.results || []);
          setPagination(
            data.data.pagination || { page: 1, total: 0, totalPages: 0, hasMore: false }
          );
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

  const handleFiltersChange = useCallback(
    (filters: DnFilters) => {
      const queryParams = new URLSearchParams(searchParams?.toString());
      // reset relevant params
      queryParams.delete('destination');
      queryParams.delete('category');
      queryParams.delete('amenities');
      // update q from searchText when provided
      if (typeof filters.searchText === 'string') {
        queryParams.set('q', filters.searchText);
      }
      // map plural keys -> API param keys
      const unique = (arr: string[]) => Array.from(new Set(arr.map((v) => v.trim()).filter(Boolean)));
      unique(filters.destinations || []).forEach((v) => queryParams.append('destination', v));
      unique(filters.categories || []).forEach((v) => queryParams.append('category', v));
      unique(filters.amenities || []).forEach((v) => queryParams.append('amenities', v));

      queryParams.set('page', '1');
      router.push(`/search?${queryParams.toString()}`);
    },
    [router, searchParams]
  );

  const handlePageChange = useCallback(
    (newPage: number) => {
      setCurrentPage(newPage);
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
      fetchResults(query, newPage, currentFilters);
    },
    [query, searchParams, fetchResults]
  );

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
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-green-800 flex items-center gap-3">
          <Leaf className="h-8 w-8 text-green-600" />
          Leaf & Laptop
          <Laptop className="h-8 w-8 text-emerald-600" />
        </h1>
        <p className="text-green-700">
          Discover eco-friendly workspaces and sustainable destinations for conscious digital nomads.
        </p>
      </div>

      <DigitalNomadSearch
        onFiltersChange={handleFiltersChange}
        className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 shadow-sm"
      />

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="mb-6 flex items-center justify-between">
          <p className="text-green-700">
            {pagination.total} listings found
            {query && ` for "${query}"`}
          </p>
        </div>

        {error && (
          <Alert type="error" title="Search Error" message={error.message} className="mb-6" />
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
              {/* Map API results to AppListingCard to satisfy ListingGrid typing */}
              <ListingGrid listings={results as unknown as import('@/types/appView').AppListingCard[]} />
            </motion.div>
          )}
        </AnimatePresence>

        {pagination.totalPages > 1 && (
          <div className="mt-8 flex justify-center space-x-4">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="px-4 py-2 bg-green-200 text-green-800 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-300"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-green-700">
              Page {currentPage} of {pagination.totalPages}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= pagination.totalPages}
              className="px-4 py-2 bg-green-200 text-green-800 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-300"
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
    loading: () => <div>Loading...</div>,
  }
);

export default function SearchResults() {
  return <SearchResultsWithSuspense />;
}