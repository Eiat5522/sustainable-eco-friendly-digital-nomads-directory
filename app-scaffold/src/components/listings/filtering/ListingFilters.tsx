'use client';

import { useCallback, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { debounce } from 'lodash';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { SearchInput } from '@/components/ui/search';
import { formatPrice } from '@/lib/utils';
import { Filter, X } from 'lucide-react';
import type { Listing } from '@/types/listings';
import type { SanityListing } from '@/types/sanity';

interface ListingFiltersProps {
  listings: (Listing | SanityListing)[];
  onFilterChange: (filters: FilterState) => void;
  className?: string;
  isLoading?: boolean;
}

interface FilterState {
  searchQuery: string;
  category: string | null;
  city: string | null;
  ecoTags: string[];
  nomadFeatures: string[];
  priceRange: [number, number];
  minRating: number | null;
  wifi: boolean;
  sustainableOnly: boolean;
}

const INITIAL_FILTER_STATE: FilterState = {
  searchQuery: '',
  category: null,
  city: null,
  ecoTags: [],
  nomadFeatures: [],
  priceRange: [0, 50000],
  minRating: null,
  wifi: false,
  sustainableOnly: false,
};

export default function ListingFilters({
  listings,
  onFilterChange,
  className = '',
  isLoading = false,
}: ListingFiltersProps) {
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTER_STATE);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Extract unique filter options from listings
  const categories = Array.from(new Set(listings.map(l => l.category)));
  const cities = Array.from(new Set(listings.map(l => {
    if ('city' in l && typeof l.city === 'string') return l.city;
    return null;
  }).filter(Boolean)));

  // Handler for mobile filters toggle
  const toggleMobileFilters = () => {
    setIsMobileFiltersOpen(!isMobileFiltersOpen);
  };

  // Debounced filter handler
  const debouncedFilterChange = useCallback(
    debounce((newFilters: FilterState) => {
      onFilterChange(newFilters);
    }, 300),
    [onFilterChange]
  );

  useEffect(() => {
    debouncedFilterChange(filters);
    return () => {
      debouncedFilterChange.cancel();
    };
  }, [filters, debouncedFilterChange]);

  const handleSearchChange = (value: string) => {
    setFilters(prev => ({
      ...prev,
      searchQuery: value
    }));
  };

  const handleCategoryChange = (category: string | null) => {
    setFilters(prev => ({
      ...prev,
      category
    }));
  };

  const handleCityChange = (city: string | null) => {
    setFilters(prev => ({
      ...prev,
      city
    }));
  };

  const handleEcoTagToggle = (tag: string) => {
    setFilters(prev => ({
      ...prev,
      ecoTags: prev.ecoTags.includes(tag)
        ? prev.ecoTags.filter(t => t !== tag)
        : [...prev.ecoTags, tag]
    }));
  };

  const handleNomadFeatureToggle = (feature: string) => {
    setFilters(prev => ({
      ...prev,
      nomadFeatures: prev.nomadFeatures.includes(feature)
        ? prev.nomadFeatures.filter(f => f !== feature)
        : [...prev.nomadFeatures, feature]
    }));
  };

  const handlePriceRangeChange = (value: number[]) => {
    setFilters(prev => ({
      ...prev,
      priceRange: [value[0], value[1]] as [number, number]
    }));
  };

  const handleWifiToggle = (checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      wifi: checked
    }));
  };

  const handleSustainableOnlyToggle = (checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      sustainableOnly: checked
    }));
  };

  const resetFilters = () => {
    setFilters(INITIAL_FILTER_STATE);
  };

  return (
    <>
      {/* Mobile Filter Button */}
      <div className="lg:hidden fixed bottom-4 right-4 z-40">
        <button
          onClick={toggleMobileFilters}
          className="flex items-center justify-center w-12 h-12 rounded-full bg-primary-500 text-white shadow-lg"
          aria-label="Toggle filters"
        >
          <Filter className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile Filter Drawer */}
      <AnimatePresence>
        {isMobileFiltersOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 lg:hidden"
          >
            <div className="absolute inset-0 bg-black/50" onClick={toggleMobileFilters} />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30 }}
              className="absolute right-0 top-0 h-full w-full max-w-xs bg-white px-4 py-6 shadow-xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">Filters</h2>
                <button
                  onClick={toggleMobileFilters}
                  className="rounded-full p-2 hover:bg-gray-100"
                  aria-label="Close filters"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              {/* Filter Content */}
              <div className="space-y-6 overflow-y-auto max-h-[calc(100vh-10rem)]">
                <FilterContent
                  filters={filters}
                  isLoading={isLoading}
                  listings={listings}
                  onSearchChange={handleSearchChange}
                  onCategoryChange={handleCategoryChange}
                  onCityChange={handleCityChange}
                  onEcoTagToggle={handleEcoTagToggle}
                  onNomadFeatureToggle={handleNomadFeatureToggle}
                  onPriceRangeChange={handlePriceRangeChange}
                  onWifiToggle={handleWifiToggle}
                  onSustainableOnlyToggle={handleSustainableOnlyToggle}
                  categories={categories}
                  cities={cities}
                />
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t">
                <button
                  onClick={resetFilters}
                  className="w-full py-2 text-sm text-primary-600 hover:text-primary-700"
                >
                  Reset all filters
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Filters */}
      <div className={`hidden lg:block ${className}`}>
        <FilterContent
          filters={filters}
          isLoading={isLoading}
          listings={listings}
          onSearchChange={handleSearchChange}
          onCategoryChange={handleCategoryChange}
          onCityChange={handleCityChange}
          onEcoTagToggle={handleEcoTagToggle}
          onNomadFeatureToggle={handleNomadFeatureToggle}
          onPriceRangeChange={handlePriceRangeChange}
          onWifiToggle={handleWifiToggle}
          onSustainableOnlyToggle={handleSustainableOnlyToggle}
          categories={categories}
          cities={cities}
        />
      </div>
    </>
  );
}

// Separate component for filter content to avoid duplication
function FilterContent({
  filters,
  isLoading,
  listings,
  onSearchChange,
  onCategoryChange,
  onCityChange,
  onEcoTagToggle,
  onNomadFeatureToggle,
  onPriceRangeChange,
  onWifiToggle,
  onSustainableOnlyToggle,
  categories,
  cities,
}: {
  filters: FilterState;
  isLoading: boolean;
  listings: (Listing | SanityListing)[];
  onSearchChange: (value: string) => void;
  onCategoryChange: (category: string | null) => void;
  onCityChange: (city: string | null) => void;
  onEcoTagToggle: (tag: string) => void;
  onNomadFeatureToggle: (feature: string) => void;
  onPriceRangeChange: (value: number[]) => void;
  onWifiToggle: (checked: boolean) => void;
  onSustainableOnlyToggle: (checked: boolean) => void;
  categories: string[];
  cities: string[];
}) {
  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="space-y-2">
        <label htmlFor="search" className="text-sm font-medium">
          Search
        </label>
        <SearchInput
          id="search"
          value={filters.searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search listings..."
          className="w-full"
        />
      </div>

      {/* Categories */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Categories</h3>
        {isLoading ? (
          <LoadingPlaceholder />
        ) : (
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Badge
                key={category}
                variant={filters.category === category ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => onCategoryChange(category)}
              >
                {category}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Cities */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Location</h3>
        {isLoading ? (
          <LoadingPlaceholder />
        ) : (
          <div className="flex flex-wrap gap-2">
            {cities.map((city) => (
              <Badge
                key={city}
                variant={filters.city === city ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => onCityChange(city)}
              >
                {city}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Price Range */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Price Range</h3>
          <span className="text-sm text-gray-500">
            {formatPrice(filters.priceRange[0])} - {formatPrice(filters.priceRange[1])}
          </span>
        </div>
        <Slider
          defaultValue={filters.priceRange}
          min={0}
          max={50000}
          step={1000}
          onValueChange={onPriceRangeChange}
          className="w-full"
        />
      </div>

      {/* Eco Features */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Sustainability Features</h3>
        {isLoading ? (
          <LoadingPlaceholder />
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {Array.from(new Set(listings.flatMap(l => {
              if ('ecoTags' in l) return l.ecoTags || [];
              return [];
            }))).map(tag => (
              <div key={tag} className="flex items-center space-x-2">
                <Checkbox
                  id={`eco-${tag}`}
                  checked={filters.ecoTags.includes(tag)}
                  onCheckedChange={() => onEcoTagToggle(tag)}
                />
                <label
                  htmlFor={`eco-${tag}`}
                  className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {tag.replace(/_/g, ' ')}
                </label>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Toggles */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label htmlFor="wifi" className="text-sm font-medium">
            Fast WiFi Available
          </label>
          <Switch
            id="wifi"
            checked={filters.wifi}
            onCheckedChange={onWifiToggle}
          />
        </div>
        <div className="flex items-center justify-between">
          <label htmlFor="sustainable" className="text-sm font-medium">
            Sustainable Only
          </label>
          <Switch
            id="sustainable"
            checked={filters.sustainableOnly}
            onCheckedChange={onSustainableOnlyToggle}
          />
        </div>
      </div>
    </div>
  );
}

function LoadingPlaceholder() {
  return (
    <div className="space-y-2 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-24" />
      <div className="space-y-1">
        <div className="h-3 bg-gray-200 rounded w-32" />
        <div className="h-3 bg-gray-200 rounded w-28" />
        <div className="h-3 bg-gray-200 rounded w-36" />
      </div>
    </div>
  );
}
