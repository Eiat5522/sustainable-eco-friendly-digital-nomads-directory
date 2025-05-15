import { useState, useCallback } from 'react'
import { FilterSystem } from '@/components/FilterSystem'
import { useFilters, FilterDefinition } from '@/hooks/useFilters'
import type { EcoTag, City, ListingType } from '@/types/listing'

interface ListingFiltersProps {
  cities: City[]
  ecoTags: EcoTag[]
  onFiltersChange: (filters: ListingFilters) => void
  className?: string
}

export interface ListingFilters {
  cities: string[]
  types: ListingType[]
  ecoTags: string[]
  priceRange: string[]
}

const LISTING_TYPES: Array<{ id: ListingType; label: string }> = [
  { id: 'coworking', label: 'Coworking Spaces' },
  { id: 'cafe', label: 'Cafes' },
  { id: 'accommodation', label: 'Accommodation' },
  { id: 'restaurant', label: 'Restaurants' },
  { id: 'activities', label: 'Activities' },
]

const PRICE_RANGES = [
  { id: 'budget', label: 'Budget Friendly' },
  { id: 'moderate', label: 'Moderate' },
  { id: 'premium', label: 'Premium' },
]

export function ListingFilters({
  cities,
  ecoTags,
  onFiltersChange,
  className = '',
}: ListingFiltersProps) {
  // Track if mobile filter drawer is open
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  // Define filter groups
  const filterDefinitions: FilterDefinition[] = [
    {
      id: 'cities',
      label: 'Cities',
      options: cities.map((city) => ({
        id: city.slug,
        label: city.name,
        count: city.listingCount,
      })),
      multiSelect: true,
    },
    {
      id: 'types',
      label: 'Listing Type',
      options: LISTING_TYPES.map((type) => ({
        id: type.id,
        label: type.label,
      })),
      multiSelect: true,
    },
    {
      id: 'ecoTags',
      label: 'Eco Features',
      options: ecoTags.map((tag) => ({
        id: tag.slug,
        label: tag.name,
        count: tag.listingCount,
      })),
      multiSelect: true,
    },
    {
      id: 'priceRange',
      label: 'Price Range',
      options: PRICE_RANGES.map((range) => ({
        id: range.id,
        label: range.label,
      })),
      multiSelect: false,
    },
  ]

  // Set up filter handling
  const handleFilterChange = useCallback(
    (filters: { [groupId: string]: string[] }) => {
      onFiltersChange({
        cities: filters.cities || [],
        types: (filters.types || []) as ListingType[],
        ecoTags: filters.ecoTags || [],
        priceRange: filters.priceRange || [],
      })
    },
    [onFiltersChange]
  )

  const { activeFilters, activeFilterCount, toggleFilter, clearFilters } = useFilters({
    definitions: filterDefinitions,
    onFilterChange: handleFilterChange,
  })

  return (
    <>
      {/* Desktop Filters */}
      <div className={`hidden lg:block ${className}`}>
        <FilterSystem
          groups={filterDefinitions}
          onFilterChange={handleFilterChange}
          initialFilters={activeFilters}
        />
      </div>

      {/* Mobile Filter Button */}
      <div className="fixed bottom-4 left-4 right-4 z-40 lg:hidden">
        <button
          onClick={() => setIsMobileOpen(true)}
          className="flex w-full items-center justify-center space-x-2 rounded-full bg-green-600 px-4 py-3 text-white shadow-lg"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
            />
          </svg>
          <span>
            Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
          </span>
        </button>
      </div>

      {/* Mobile Filter Drawer */}
      <div
        className={`fixed inset-0 z-50 transform bg-white transition-transform duration-300 lg:hidden ${
          isMobileOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <h2 className="text-lg font-semibold">Filters</h2>
          <button
            onClick={() => setIsMobileOpen(false)}
            className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="h-full overflow-y-auto p-4 pb-32">
          <FilterSystem
            groups={filterDefinitions}
            onFilterChange={handleFilterChange}
            initialFilters={activeFilters}
          />
        </div>

        <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 bg-white p-4">
          <button
            onClick={() => setIsMobileOpen(false)}
            className="w-full rounded-lg bg-green-600 px-4 py-3 text-white"
          >
            Show Results
          </button>
        </div>
      </div>
    </>
  )
}
