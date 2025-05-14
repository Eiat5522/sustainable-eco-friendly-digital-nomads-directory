import React from 'react';

interface Filters {
  category?: string[];
  ecoTags?: string[];
  minPrice?: number;
  maxPrice?: number;
}

interface FilterSidebarProps {
  filters: Filters;
  onFilterChange: (filters: Filters) => void;
  totalListings: number;
  filteredCount: number;
}

const CATEGORIES = ['coworking', 'cafe', 'accommodation'];
const ECO_TAGS = [
  'zero-waste',
  'renewable-energy',
  'plant-based',
  'eco-construction',
  'water-conservation',
  'local-community',
  'organic'
];

export default function FilterSidebar({
  filters,
  onFilterChange,
  totalListings,
  filteredCount
}: FilterSidebarProps) {
  const handleCategoryChange = (category: string) => {
    const newCategories = filters.category?.includes(category)
      ? filters.category.filter(c => c !== category)
      : [...(filters.category || []), category];
    
    onFilterChange({
      ...filters,
      category: newCategories.length ? newCategories : undefined
    });
  };

  const handleEcoTagChange = (tag: string) => {
    const newTags = filters.ecoTags?.includes(tag)
      ? filters.ecoTags.filter(t => t !== tag)
      : [...(filters.ecoTags || []), tag];
    
    onFilterChange({
      ...filters,
      ecoTags: newTags.length ? newTags : undefined
    });
  };

  const handlePriceChange = (min?: number, max?: number) => {
    onFilterChange({
      ...filters,
      minPrice: min,
      maxPrice: max
    });
  };

  return (
    <aside className="w-80 bg-white shadow-lg p-4 overflow-y-auto">
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Filters</h2>
        <p className="text-sm text-gray-600">
          Showing {filteredCount} of {totalListings} listings
        </p>
      </div>

      <div className="mb-6">
        <h3 className="font-medium mb-2">Categories</h3>
        <div className="space-y-2">
          {CATEGORIES.map(category => (
            <label key={category} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={filters.category?.includes(category) ?? false}
                onChange={() => handleCategoryChange(category)}
                className="rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <span className="text-sm capitalize">{category}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <h3 className="font-medium mb-2">Eco Features</h3>
        <div className="space-y-2">
          {ECO_TAGS.map(tag => (
            <label key={tag} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={filters.ecoTags?.includes(tag) ?? false}
                onChange={() => handleEcoTagChange(tag)}
                className="rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <span className="text-sm capitalize">{tag.replace(/-/g, ' ')}</span>
            </label>
          ))}
        </div>
      </div>

      {(filters.category?.includes('accommodation') || !filters.category?.length) && (
        <div className="mb-6">
          <h3 className="font-medium mb-2">Price Range (THB/night)</h3>
          <div className="space-y-2">
            <div className="flex space-x-2">
              <input
                type="number"
                placeholder="Min"
                value={filters.minPrice ?? ''}
                onChange={e => handlePriceChange(
                  e.target.value ? Number(e.target.value) : undefined,
                  filters.maxPrice
                )}
                className="w-full p-2 border rounded"
              />
              <input
                type="number"
                placeholder="Max"
                value={filters.maxPrice ?? ''}
                onChange={e => handlePriceChange(
                  filters.minPrice,
                  e.target.value ? Number(e.target.value) : undefined
                )}
                className="w-full p-2 border rounded"
              />
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
