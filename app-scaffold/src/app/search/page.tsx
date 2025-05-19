'use client';

import { FilterSidebar } from '@/components/listings/FilterSidebar';
import { ListingGrid } from '@/components/listings/ListingGrid';
import { SearchBar } from '@/components/search/SearchBar';
import { Alert } from '@/components/ui/Alert';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Pagination } from '@/components/ui/Pagination';
import { useSearch } from '@/hooks/useSearch';
import type { SearchFilters } from '@/types/search';
import { AnimatePresence, motion } from 'framer-motion';
import { useSearchParams } from 'next/navigation';

export default function SearchResults() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams?.get('q') || '';
  const initialFilters: SearchFilters = {
    query: initialQuery,
    category: (searchParams?.get('category') as SearchFilters['category']) || undefined,
    city: searchParams?.get('city') || undefined,
    ecoTags: searchParams?.get('ecoTags')?.split(',') || [],
    hasDigitalNomadFeatures: searchParams?.get('dnFeatures') === 'true',
    minSustainabilityScore: Number(searchParams?.get('minScore')) || undefined,
    maxPriceRange: Number(searchParams?.get('maxPrice')) || undefined,
  };

  const {
    query,
    filters,
    sort,
    page,
    results,
    pagination,
    isLoading,
    error,
    suggestions,
    isLoadingSuggestions,
    handleQueryChange,
    handleFiltersChange,
    handleSortChange,
    handlePageChange,
    clearFilters
  } = useSearch({
    initialQuery,
    initialFilters,
    debounceMs: 300
  });

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

      <div className="flex flex-col md:flex-row gap-8">
        {/* Filters Sidebar */}
        <div className="w-full md:w-80 flex-shrink-0">
          <FilterSidebar
            filters={filters}
            onFilterChange={handleFiltersChange}
            onSortChange={handleSortChange}
            onClear={clearFilters}
            totalListings={pagination.total}
            filteredCount={results.length}
          />
        </div>

        {/* Results Area */}
        <div className="flex-grow">
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
                <ListingGrid
                  listings={results}
                  searchQuery={query}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="mt-8">
              <Pagination
                currentPage={page}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
