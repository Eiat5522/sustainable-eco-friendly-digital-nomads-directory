"use client";

import { useState, useEffect, useCallback } from 'react';
import { debounce } from 'lodash';
import type { Listing } from '@/types/listings';
import type { SanityListing } from '@/types/sanity';

interface ListingFiltersProps {
  listings: (Listing | SanityListing)[];
  onFilterChange: (filters: FilterState) => void;
}

interface FilterState {
  searchQuery: string;
  category: string | null;
  city: string | null;
  ecoTags: string[];
  features: string[];
  priceRange: [number, number];
  minRating: number | null;
}

export default function ListingFilters({ listings, onFilterChange }: ListingFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    category: null,
    city: null,
    ecoTags: [],
    features: [],
    priceRange: [0, 50000],
    minRating: null
  });

  // Extract unique values for filter options, filtering out undefined/null and ensuring strings
  const categories = Array.from(
    new Set(
      listings
        .map(l => l.category)
        .filter(c => typeof c === 'string' && c.trim() !== '')
    )
  ) as string[];
  const cities = Array.from(
    new Set(
      listings
        .map(l => {
          if ('city' in l && typeof l.city === 'string') return l.city;
          return (l as Listing).city;
        })
        .filter((c): c is string => typeof c === 'string' && c.trim() !== '')
    )
  );
  const allEcoTags = Array.from(
    new Set(
      listings
        .flatMap(l => {
          if ('ecoTags' in l) return Array.isArray(l.ecoTags) ? l.ecoTags : [];
          return Array.isArray((l as Listing).eco_focus_tags) ? (l as Listing).eco_focus_tags : [];
        })
        .filter((t): t is string => typeof t === 'string' && t.trim() !== '')
    )
  );
  const allFeatures = Array.from(
    new Set(
      listings
        .flatMap(l => {
          if ('nomadFeatures' in l) return Array.isArray(l.nomadFeatures) ? l.nomadFeatures : [];
          return Array.isArray((l as Listing).digital_nomad_features) ? (l as Listing).digital_nomad_features : [];
        })
        .filter((f): f is string => typeof f === 'string' && f.trim() !== '')
    )
  );

  // Debounced search handler
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      setFilters(prev => ({ ...prev, searchQuery: query }));
    }, 300),
    []
  );

  useEffect(() => {
    onFilterChange(filters);
  }, [filters, onFilterChange]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(event.target.value);
  };

  const handleCategoryChange = (category: string | null) => {
    setFilters(prev => ({ ...prev, category }));
  };

  const handleCityChange = (city: string | null) => {
    setFilters(prev => ({ ...prev, city }));
  };

  const handleRatingChange = (rating: number | null) => {
    setFilters(prev => ({ ...prev, minRating: rating }));
  };

  const handleEcoTagToggle = (tag: string) => {
    setFilters(prev => ({
      ...prev,
      ecoTags: prev.ecoTags.includes(tag)
        ? prev.ecoTags.filter(t => t !== tag)
        : [...prev.ecoTags, tag]
    }));
  };

  const handleFeatureToggle = (feature: string) => {
    setFilters(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }));
  };

  const handlePriceRangeChange = (value: [number, number]) => {
    setFilters(prev => ({ ...prev, priceRange: value }));
  };

  const resetFilters = () => {
    setFilters({
      searchQuery: '',
      category: null,
      city: null,
      ecoTags: [],
      features: [],
      priceRange: [0, 50000],
      minRating: null
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
      {/* Search Input */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Search</h3>
        <input
          type="text"
          placeholder="Search listings..."
          onChange={handleSearchChange}
          className="w-full px-4 py-2 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
        />
      </div>

      {/* Rating Filter */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Minimum Rating</h3>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleRatingChange(null)}
            className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
              filters.minRating === null
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            Any
          </button>
          {[1, 2, 3, 4, 5].map(rating => (
            <button
              type="button"
              key={rating}
              onClick={() => handleRatingChange(rating)}
              className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                filters.minRating === rating
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              {rating}★+
            </button>
          ))}
        </div>
      </div>

      {/* Category Filter */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Category</h3>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleCategoryChange(null)}
            className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
              !filters.category
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            All
          </button>
          {categories.map(category => (
            <button
              type="button"
              key={category}
              onClick={() => handleCategoryChange(category)}
              className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                filters.category === category
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              {typeof category === 'string' && category.length > 0
                ? category.charAt(0).toUpperCase() + category.slice(1)
                : 'Unknown'}
            </button>
          ))}
        </div>
      </div>

      {/* City Filter */}
      <div>
        <label htmlFor="city-select" className="sr-only">
          City
        </label>
        <h3 className="text-lg font-semibold mb-3">Location</h3>
        <select
          id="city-select"
          value={filters.city || ""}
          onChange={(e) => handleCityChange(e.target.value || null)}
          className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
        >
          <option value="">All Cities</option>
          {cities.map(city => (
            <option key={city} value={city}>{city}</option>
          ))}
        </select>
      </div>

      {/* Price Range Filter */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Price Range (THB/month)</h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">฿{filters.priceRange[0].toLocaleString()}</span>
            <span className="text-sm text-gray-600">฿{filters.priceRange[1].toLocaleString()}</span>
          </div>
          <input
            type="range"
            min="0"
            max="50000"
            title="Maximum price"
            step="1000"
            value={filters.priceRange[1]}
            onChange={(e) => handlePriceRangeChange([filters.priceRange[0], parseInt(e.target.value)])}
            className="w-full accent-primary-600"
          />
        </div>
      </div>

      {/* Eco Tags Filter */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Sustainability Features</h3>
        <div className="space-y-2">
          {allEcoTags.map(tag => (
            <label key={tag} className="flex items-center">
              <input
                type="checkbox"
                checked={filters.ecoTags.includes(tag)}
                onChange={() => handleEcoTagToggle(tag)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-600">{tag}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Digital Nomad Features Filter */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Digital Nomad Features</h3>
        <div className="space-y-2">
          {allFeatures.map(feature => (
            <label key={feature} className="flex items-center">
              <input
                type="checkbox"
                checked={filters.features.includes(feature)}
                onChange={() => handleFeatureToggle(feature)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-600">{feature}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Reset Filters Button */}
      <div className="pt-4 border-t">
        <button
          type="button"
          onClick={resetFilters}
          className="w-full py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
        >
          Reset All Filters {getActiveFilterCount(filters) > 0 && `(${getActiveFilterCount(filters)})`}
        </button>
      </div>
    </div>
  );
}

function getActiveFilterCount(filters: FilterState): number {
  return (
    (filters.searchQuery ? 1 : 0) +
    (filters.category ? 1 : 0) +
    (filters.city ? 1 : 0) +
    (filters.minRating ? 1 : 0) +
    filters.ecoTags.length +
    filters.features.length
  );
}
