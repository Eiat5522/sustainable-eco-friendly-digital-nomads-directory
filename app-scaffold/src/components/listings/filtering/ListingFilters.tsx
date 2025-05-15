'use client';

import { useCallback, useState, useEffect } from 'react';
import { debounce } from 'lodash';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { SearchInput } from '@/components/ui/search';
import type { Listing } from '@/types/listings';
import type { SanityListing } from '@/types/sanity';

interface ListingFiltersProps {
  listings: (Listing | SanityListing)[];
  onFilterChange: (filters: FilterState) => void;
  className?: string;
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

export default function ListingFilters({
  listings,
  onFilterChange,
  className = '',
}: ListingFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    category: null,
    city: null,
    ecoTags: [],
    nomadFeatures: [],
    priceRange: [0, 50000],
    minRating: null,
    wifi: false,
    sustainableOnly: false,
  });

  // Extract unique filter options from listings
  const categories = Array.from(new Set(listings.map(l => l.category)));
  const cities = Array.from(new Set(listings.map(l => {
    if ('city' in l && typeof l.city === 'string') return l.city;
    return (l as Listing).city;
  }).filter(Boolean)));
  
  const allEcoTags = Array.from(new Set(listings.flatMap(l => {
    if ('ecoTags' in l) return l.ecoTags || [];
    return (l as Listing).eco_focus_tags || [];
  })));
  
  const allNomadFeatures = Array.from(new Set(listings.flatMap(l => {
    if ('nomadFeatures' in l) return l.nomadFeatures || [];
    return (l as Listing).digital_nomad_features || [];
  })));

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

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(e.target.value);
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
        : [...prev.ecoTags, tag],
    }));
  };

  const handleNomadFeatureToggle = (feature: string) => {
    setFilters(prev => ({
      ...prev,
      nomadFeatures: prev.nomadFeatures.includes(feature)
        ? prev.nomadFeatures.filter(f => f !== feature)
        : [...prev.nomadFeatures, feature],
    }));
  };

  const handlePriceRangeChange = (value: number[]) => {
    setFilters(prev => ({ ...prev, priceRange: [value[0], value[1]] }));
  };

  const handleWifiToggle = () => {
    setFilters(prev => ({ ...prev, wifi: !prev.wifi }));
  };

  const handleSustainableToggle = () => {
    setFilters(prev => ({ ...prev, sustainableOnly: !prev.sustainableOnly }));
  };

  const resetFilters = () => {
    setFilters({
      searchQuery: '',
      category: null,
      city: null,
      ecoTags: [],
      nomadFeatures: [],
      priceRange: [0, 50000],
      minRating: null,
      wifi: false,
      sustainableOnly: false,
    });
  };

  const activeFiltersCount = Object.values(filters).filter(value => {
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'boolean') return value;
    return value !== null;
  }).length;

  return (
    <div className={`bg-white rounded-lg shadow p-4 space-y-6 ${className}`}>
      {/* Search */}
      <div>
        <h3 className="text-base font-medium mb-2">Search</h3>
        <SearchInput
          placeholder="Search for listings..."
          onChange={handleSearchChange}
        />
      </div>

      {/* Categories */}
      <div>
        <h3 className="text-base font-medium mb-2">Category</h3>
        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <Badge
              key={category}
              variant={filters.category === category ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => handleCategoryChange(category)}
            >
              {category}
            </Badge>
          ))}
        </div>
      </div>

      {/* Cities */}
      <div>
        <h3 className="text-base font-medium mb-2">Location</h3>
        <div className="flex flex-wrap gap-2">
          {cities.map(city => (
            <Badge
              key={city}
              variant={filters.city === city ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => handleCityChange(city)}
            >
              {city}
            </Badge>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="text-base font-medium mb-2">Price Range (THB)</h3>
        <Slider
          defaultValue={[filters.priceRange[0], filters.priceRange[1]]}
          max={50000}
          step={1000}
          onValueChange={handlePriceRangeChange}
          className="w-full"
        />
        <div className="flex justify-between mt-2 text-sm text-muted-foreground">
          <span>฿{filters.priceRange[0].toLocaleString()}</span>
          <span>฿{filters.priceRange[1].toLocaleString()}</span>
        </div>
      </div>

      {/* Eco Features */}
      <div>
        <h3 className="text-base font-medium mb-2">Sustainability Features</h3>
        <div className="grid grid-cols-2 gap-2">
          {allEcoTags.map(tag => (
            <div key={tag} className="flex items-center space-x-2">
              <Checkbox
                id={`eco-${tag}`}
                checked={filters.ecoTags.includes(tag)}
                onCheckedChange={() => handleEcoTagToggle(tag)}
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
      </div>

      {/* Digital Nomad Features */}
      <div>
        <h3 className="text-base font-medium mb-2">Digital Nomad Features</h3>
        <div className="grid grid-cols-2 gap-2">
          {allNomadFeatures.map(feature => (
            <div key={feature} className="flex items-center space-x-2">
              <Checkbox
                id={`feature-${feature}`}
                checked={filters.nomadFeatures.includes(feature)}
                onCheckedChange={() => handleNomadFeatureToggle(feature)}
              />
              <label
                htmlFor={`feature-${feature}`}
                className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {feature.replace(/_/g, ' ')}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Filters */}
      <div>
        <h3 className="text-base font-medium mb-2">Quick Filters</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label htmlFor="wifi" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Fast WiFi
            </label>
            <Switch
              id="wifi"
              checked={filters.wifi}
              onCheckedChange={handleWifiToggle}
            />
          </div>
          <div className="flex items-center justify-between">
            <label htmlFor="sustainable" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Sustainable Only
            </label>
            <Switch
              id="sustainable"
              checked={filters.sustainableOnly}
              onCheckedChange={handleSustainableToggle}
            />
          </div>
        </div>
      </div>

      {/* Reset Filters */}
      <div className="pt-4 border-t">
        <button
          onClick={resetFilters}
          className="w-full py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
        >
          Reset All Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
        </button>
      </div>
    </div>
  );
}
