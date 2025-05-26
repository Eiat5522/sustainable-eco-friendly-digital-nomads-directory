import { FilterSystem } from '@/components/FilterSystem'
import { FilterDefinition, useFilters } from '@/hooks/useFilters'
import type { City, EcoTag, ListingType } from '@/types/listing'
import { useCallback, useState, useEffect } from 'react'

interface ListingFiltersProps {
  cities: City[]
  ecoTags: EcoTag[]
  onFiltersChange: (filters: ListingFilters) => void
  className?: string
}

export interface ListingFilters {
  searchQuery?: string;
  cities: string[]
  types: ListingType[]
  ecoTags: string[]
  priceRange: string[]
  location: {
    city: string;
    radius: number;
  } | null;
  minRating?: number;
  nomadFeatures?: string[];
  ecoCertification?: string[];
  accommodationType?: string[];
  sustainabilityScore?: string;
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

const RATING_OPTIONS = [
  { id: '5', label: '5 Stars' },
  { id: '4', label: '4 Stars & Up' },
  { id: '3', label: '3 Stars & Up' },
  { id: '2', label: '2 Stars & Up' },
  { id: '1', label: '1 Star & Up' },
];

const NOMAD_FEATURES_OPTIONS = [
  { id: 'wifi', label: 'High-Speed WiFi' },
  { id: 'power', label: 'Reliable Power Outlets' },
  { id: 'desk', label: 'Comfortable Desk/Workspace' },
  { id: 'quiet', label: 'Quiet Environment' },
  { id: 'community', label: 'Community Access' },
];

export function ListingFilters({
  cities,
  ecoTags,
  onFiltersChange,
  className = '',
}: ListingFiltersProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('');
  const [currentHookFilters, setCurrentHookFilters] = useState<{ [groupId: string]: string[] }>({});

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
    {
      id: 'location',
      label: 'Location',
      options: [],
      multiSelect: false,
    },
    {
      id: 'minRating',
      label: 'Minimum Rating',
      options: RATING_OPTIONS,
      multiSelect: false,
    },
    {
      id: 'nomadFeatures',
      label: 'Digital Nomad Features',
      options: NOMAD_FEATURES_OPTIONS,
      multiSelect: true,
    },
    {
      id: 'ecoCertification',
      label: 'Eco Certification',
      options: [],
      multiSelect: true,
    },
    {
      id: 'accommodationType',
      label: 'Accommodation Type',
      options: [],
      multiSelect: true,
    },
    {
      id: 'sustainabilityScore',
      label: 'Sustainability Score',
      options: [],
      multiSelect: false,
    },
  ]

  const handleHookFilterChange = useCallback((hookFilters: { [groupId: string]: string[] }) => {
    setCurrentHookFilters(hookFilters);
  }, []);

  const { activeFilters, activeFilterCount, toggleFilter, clearFilters } = useFilters({
    definitions: filterDefinitions,
    onFilterChange: handleHookFilterChange,
  })

  useEffect(() => {
    const combinedFilters: ListingFilters = {
      searchQuery: searchQuery,
      cities: currentHookFilters.cities || [],
      types: (currentHookFilters.types || []) as ListingType[],
      ecoTags: currentHookFilters.ecoTags || [],
      priceRange: currentHookFilters.priceRange || [],
      location: currentHookFilters.location && currentHookFilters.location.length > 0
                  ? { city: currentHookFilters.location[0], radius: parseInt(currentHookFilters.location[1], 10) }
                  : null,
      minRating: currentHookFilters.minRating && currentHookFilters.minRating.length > 0
                  ? parseInt(currentHookFilters.minRating[0])
                  : undefined,
      nomadFeatures: currentHookFilters.nomadFeatures || [],
      ecoCertification: currentHookFilters.ecoCertification || [],
      accommodationType: currentHookFilters.accommodationType || [],
      sustainabilityScore: currentHookFilters.sustainabilityScore && currentHookFilters.sustainabilityScore.length > 0
                  ? currentHookFilters.sustainabilityScore[0]
                  : undefined,
    };
    onFiltersChange(combinedFilters);
  }, [searchQuery, currentHookFilters, onFiltersChange]);

  const handleSearchInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleClearAllFilters = () => {
    setSearchQuery('');
    clearFilters();
  };

  return (
    <>
      <div className={`mb-4 ${className}`}>
        <label htmlFor="listingSearch" className="sr-only">Search listings</label>
        <input
          type="search"
          id="listingSearch"
          placeholder="Search by keyword..."
          value={searchQuery}
          onChange={handleSearchInputChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
        />
      </div>

      {/* Desktop Filters */}
      <div className={`hidden lg:block ${className}`}>
        <FilterSystem
          groups={filterDefinitions}
          onFilterChange={handleHookFilterChange}
          initialFilters={activeFilters}
        />
      </div>

      {/* Mobile Filter Button */}
      <div className="fixed bottom-4 left-4 right-4 z-40 lg:hidden">
        <button
          onClick={() => setIsMobileOpen(true)}
