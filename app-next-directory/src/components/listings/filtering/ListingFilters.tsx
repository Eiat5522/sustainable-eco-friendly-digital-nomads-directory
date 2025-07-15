'use client';

import React, { useCallback, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { debounce } from 'lodash';
import { Filter, X } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Checkbox } from '@/components/ui/Checkbox';
import { RangeSlider } from '@/components/ui/RangeSlider';
import { SortSelect } from '@/components/listings/sorting/SortSelect';
import { SearchInput } from '@/components/ui/SearchInput';
import { cn } from '@/lib/utils';
import { SortOption } from '@/types/sort';
import { FilterCombinations } from './FilterCombinations';
import { FilterGroup, FilterOperator } from '@/types/filters';

export interface FiltersState {
  search: string;
  categories: string[];
  cities: string[];
  priceRange: [number, number];
  ecoTags: string[];
  nomadFeatures: string[];
  sort?: SortOption;
  combinations: FilterGroup[];
  combinationOperator: FilterOperator;
}

interface ListingFiltersProps {
  className?: string;
  onFiltersChange: (filters: FiltersState) => void;
  onSortChange: (sortOption: SortOption) => void;
  categories: string[];
  cities: string[];
  loading?: boolean;
}

const defaultFilters: FiltersState = {
  search: '',
  categories: [],
  cities: [],
  priceRange: [0, 1000],
  ecoTags: [],
  nomadFeatures: [],
  sort: undefined,
  combinations: [],
  combinationOperator: 'AND'
};

export function ListingFilters({
  className,
  onFiltersChange,
  onSortChange,
  categories,
  cities,
  loading = false
}: ListingFiltersProps) {
  const [filters, setFilters] = useState<FiltersState>(defaultFilters);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  const debouncedOnFiltersChange = useCallback(
    debounce((newFilters: FiltersState) => {
      onFiltersChange(newFilters);
    }, 500),
    [onFiltersChange]
  ) as (filters: FiltersState) => void;

  useEffect(() => {
    debouncedOnFiltersChange(filters);
  }, [filters, debouncedOnFiltersChange]);

  const handleSortChange = (sortOption: SortOption) => {
    setFilters((prev: FiltersState) => ({ ...prev, sort: sortOption }));
    onSortChange(sortOption);
  };

  const toggleCategory = (category: string) => {
    setFilters((prev: FiltersState) => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter((c: string) => c !== category)
        : [...prev.categories, category]
    }));
  };

  const toggleCity = (city: string) => {
    setFilters((prev: FiltersState) => ({
      ...prev,
      cities: prev.cities.includes(city)
        ? prev.cities.filter((c: string) => c !== city)
        : [...prev.cities, city]
    }));
  };

  const setPriceRange = (range: [number, number]) => {
    setFilters((prev: FiltersState) => ({ ...prev, priceRange: range }));
  };

  const toggleEcoTag = (tag: string) => {
    setFilters((prev: FiltersState) => ({
      ...prev,
      ecoTags: prev.ecoTags.includes(tag)
        ? prev.ecoTags.filter((t: string) => t !== tag)
        : [...prev.ecoTags, tag]
    }));
  };

  const toggleNomadFeature = (feature: string) => {
    setFilters((prev: FiltersState) => ({
      ...prev,
      nomadFeatures: prev.nomadFeatures.includes(feature)
        ? prev.nomadFeatures.filter((f: string) => f !== feature)
        : [...prev.nomadFeatures, feature]
    }));
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters((prev: FiltersState) => ({ ...prev, search: e.target.value }));
  };

  const toggleMobileFilters = () => {
    setIsMobileFiltersOpen(!isMobileFiltersOpen);
  };

  const resetFilters = () => {
    setFilters(defaultFilters);
  };

  if (loading) {
    return <LoadingFilters />;
  }

  return (
    <>
      <div className="lg:hidden fixed bottom-4 right-4 z-40">
        <button
          type="button"
          title="Open filters"
          aria-label="Open filters"
          onClick={toggleMobileFilters}
          className="bg-primary-600 text-white p-4 rounded-full shadow-lg flex items-center space-x-2"
        >
          <Filter className="h-5 w-5" />
        </button>
      </div>

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
              className="absolute right-0 top-0 h-full w-full max-w-xs bg-white p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">Filters</h2>
                <button onClick={toggleMobileFilters} className="text-gray-500">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-6 overflow-y-auto max-h-[calc(100vh-10rem)]">
                <FiltersContent
                  filters={filters}
                  categories={categories}
                  cities={cities.filter((city): city is string => city !== null)}
                  onSearchChange={handleSearchChange}
                  toggleCategory={toggleCategory}
                  toggleCity={toggleCity}
                  setPriceRange={setPriceRange}
                  toggleEcoTag={toggleEcoTag}
                  toggleNomadFeature={toggleNomadFeature}
                  onSortChange={handleSortChange}
                  onCombinationsChange={(combinations) => setFilters((prev) => ({ ...prev, combinations }))}
                  onCombinationOperatorChange={(operator) => setFilters((prev) => ({ ...prev, combinationOperator: operator }))}
                />
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t">
                <button
                  onClick={resetFilters}
                  className="w-full py-2 text-sm text-primary-600 hover:text-primary-700"
                >
                  Reset Filters
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={cn('hidden lg:block', className)}>
        <FiltersContent
          filters={filters}
          categories={categories}
          cities={cities.filter((city): city is string => city !== null)}
          onSearchChange={handleSearchChange}
          toggleCategory={toggleCategory}
          toggleCity={toggleCity}
          setPriceRange={setPriceRange}
          toggleEcoTag={toggleEcoTag}
          toggleNomadFeature={toggleNomadFeature}
          onSortChange={handleSortChange}
          onCombinationsChange={(combinations) => setFilters((prev) => ({ ...prev, combinations }))}
          onCombinationOperatorChange={(operator) => setFilters((prev) => ({ ...prev, combinationOperator: operator }))}
        />
      </div>
    </>
  );
}

interface FiltersContentProps {
  filters: FiltersState;
  categories: string[];
  cities: string[];
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  toggleCategory: (category: string) => void;
  toggleCity: (city: string) => void;
  setPriceRange: (range: [number, number]) => void;
  toggleEcoTag: (tag: string) => void;
  toggleNomadFeature: (feature: string) => void;
  onSortChange: (sortOption: SortOption) => void;
  onCombinationsChange: (combinations: FilterGroup[]) => void;
  onCombinationOperatorChange: (operator: FilterOperator) => void;
}

function FiltersContent({
  filters,
  categories,
  cities,
  onSearchChange,
  toggleCategory,
  toggleCity,
  setPriceRange,
  toggleEcoTag,
  toggleNomadFeature,
  onSortChange,
  onCombinationsChange,
  onCombinationOperatorChange
}: FiltersContentProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <SortSelect onSortChange={onSortChange} />
      </div>

      <div className="space-y-2">
        <label htmlFor="search" className="text-sm font-medium">
          Search
        </label>
        <SearchInput
          value={filters.search}
          onChange={onSearchChange}
          placeholder="Search listings..."
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium">Categories</h3>
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Badge
                key={category}
                variant={filters.categories.includes(category) ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => toggleCategory(category)}
              >
                {category}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium">Cities</h3>
        {cities.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {cities.map((city) => (
              <Badge
                key={city}
                variant={filters.cities.includes(city) ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => toggleCity(city)}
              >
                {city}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Price Range</h3>
          <span className="text-sm text-gray-500">
            ${filters.priceRange[0]} - ${filters.priceRange[1]}
          </span>
        </div>
        <RangeSlider
          min={0}
          max={1000}
          step={50}
          value={filters.priceRange}
          onChange={setPriceRange}
        />
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium">Sustainability Features</h3>
        <div className="grid grid-cols-2 gap-2">
          {['Solar Power', 'Composting', 'Water Conservation', 'Local Food'].map((tag) => (
            <div key={tag} className="flex items-center space-x-2">
              <Checkbox
                id={`eco-${tag}`}
                checked={filters.ecoTags.includes(tag)}
                onCheckedChange={() => toggleEcoTag(tag)}
              />
              <label
                htmlFor={`eco-${tag}`}
                className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {tag}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label htmlFor="wifi" className="text-sm font-medium">
            High-Speed WiFi
          </label>
          <Checkbox
            id="wifi"
            checked={filters.nomadFeatures.includes('wifi')}
            onCheckedChange={() => toggleNomadFeature('wifi')}
          />
        </div>
        <div className="flex items-center justify-between">
          <label htmlFor="sustainable" className="text-sm font-medium">
            Sustainable Workspace
          </label>
          <Checkbox
            id="sustainable"
            checked={filters.nomadFeatures.includes('sustainable')}
            onCheckedChange={() => toggleNomadFeature('sustainable')}
          />
        </div>
      </div>

      <FilterCombinations
        combinations={filters.combinations}
        onCombinationsChange={onCombinationsChange}
        globalOperator={filters.combinationOperator}
        onGlobalOperatorChange={onCombinationOperatorChange}
      />
    </div>
  );
}

function LoadingFilters() {
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
