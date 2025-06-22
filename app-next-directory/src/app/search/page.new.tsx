'use client';

import { ListingGrid } from '@/components/listings/ListingGrid';
import DigitalNomadSearchFilter from '@/components/ui/DigitalNomadSearchFilter';
import { Alert } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { WorldMapDemo } from '@/components/ui/world-map-demo';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useCallback, useState } from 'react';

// Type definitions
interface SearchResult {
  id: string;
  title: string;
  // Add other properties as needed
}

interface SearchFilters extends Record<string, string | string[]> {
  destination?: string[];
  category?: string[];
  features_amenities?: string[];
}

interface SearchPagination {
  page: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

function SearchResultsComponent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams?.get('q') || '';

  const [query, setQuery] = useState<string>(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<SearchPagination>({
    page: 1,
    total: 0,
    totalPages: 0,
    hasMore: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchResults = useCallback(async (searchQuery: string, page: number = 1, filters: SearchFilters = {}) => {
    if (!searchQuery.trim() && Object.values(filters).every(v => !v || (Array.isArray(v) && v.length === 0))) {
      setResults([]);
      setPagination({ page: 1, total: 0, totalPages: 0, hasMore: false });
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      queryParams.set('q', searchQuery);
      queryParams.set('page', String(page));
      queryParams.set('limit', '12');
      
      Object.entries(filters).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach(v => v && queryParams.append(key, v));
        } else if (value) {
          queryParams.set(key, String(value));
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
  }, []);

  const handleQueryChange = useCallback((newQuery: string) => {
    setQuery(newQuery);
    const queryParams = new URLSearchParams(searchParams?.toString());
    queryParams.set('q', newQuery);
    router.push(`/search?${queryParams.toString()}`);
  }, [router, searchParams]);

  const handleFiltersChange = useCallback((filters: SearchFilters) => {
    const queryParams = new URLSearchParams(searchParams?.toString());
    // Clear existing filter params before setting new ones
    queryParams.delete('destination');
    queryParams.delete('category');
    queryParams.delete('features_amenities');

    Object.entries(filters).forEach(([key, values]) => {
      if (Array.isArray(values) && values.length > 0) {
        values.forEach(value => {
          queryParams.append(key, value);
        });
      }
    });
    queryParams.set('page', '1');
    router.push(`/search?${queryParams.toString()}`);
  }, [router, searchParams]);

  const handlePageChange = useCallback((newPage: number) => {
    setCurrentPage(newPage);
    const currentFilters: SearchFilters = {};
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
  }, [query, searchParams, fetchResults]);

  return (
    <div className="flex flex-col min-h-screen">
      <WorldMapDemo className="w-full h-64 mb-8" />
      
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row gap-8">
          <DigitalNomadSearchFilter
            onSearch={handleQueryChange}
            onFilterChange={handleFiltersChange}
          />

          <main className="flex-1">
            {error ? (
              <Alert variant="destructive" title="Error" description={error.message} />
            ) : isLoading ? (
              <LoadingSpinner />
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={query + currentPage}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <ListingGrid
                    results={results}
                    currentPage={pagination.page}
                    totalPages={pagination.totalPages}
                    onPageChange={handlePageChange}
                  />
                </motion.div>
              </AnimatePresence>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

// Using dynamic import with loading state
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
