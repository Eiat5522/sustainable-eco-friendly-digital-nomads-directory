import React, { useState, ChangeEvent } from 'react';
import { motion } from 'framer-motion';
import { SearchInput } from '../ui/search';
import { Mic } from 'lucide-react';
import type { SearchFilters, EcoTag } from '@/types';

interface FilterSidebarProps {
  filters: SearchFilters;
  onFilterChange: (filters: SearchFilters) => void;
  totalListings: number;
  filteredCount: number;
}

const CATEGORIES = ['coworking', 'cafe', 'accommodation'] as const;

const ECO_TAGS: EcoTag[] = [
  { id: 'zero-waste', label: 'Zero Waste', impact: 'high' },
  { id: 'renewable-energy', label: 'Renewable Energy', impact: 'high' },
  { id: 'plant-based', label: 'Plant-Based', impact: 'medium' },
  { id: 'eco-construction', label: 'Eco Construction', impact: 'high' },
  { id: 'water-conservation', label: 'Water Conservation', impact: 'medium' },
  { id: 'local-community', label: 'Local Community', impact: 'medium' },
  { id: 'organic', label: 'Organic', impact: 'medium' }
];

const impactColors = {
  high: 'bg-green-500',
  medium: 'bg-green-400',
  low: 'bg-green-300',
} as const;

export default function FilterSidebar({
  filters,
  onFilterChange,
  totalListings,
  filteredCount
}: FilterSidebarProps) {
  const [isListening, setIsListening] = useState(false);

  const startVoiceSearch = async () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Voice search is not supported in your browser');
      return;
    }

    setIsListening(true);
    // @ts-ignore - webkitSpeechRecognition is not in lib.dom.d.ts
    const recognition = new webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      handleSearchChange(transcript);
      setIsListening(false);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  const handleSearchChange = (query: string) => {
    onFilterChange({
      ...filters,
      query
    });
  };

  const handleCategoryChange = (category: string) => {
    const newCategories = filters.category?.includes(category)
      ? filters.category.filter(c => c !== category)
      : [...(filters.category || []), category];
    
    onFilterChange({
      ...filters,
      category: newCategories.length ? newCategories : undefined
    });
  };

  const handleEcoTagChange = (tagId: string) => {
    const newTags = filters.ecoTags?.includes(tagId)
      ? filters.ecoTags.filter(t => t !== tagId)
      : [...(filters.ecoTags || []), tagId];
    
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
    <aside className="w-80 bg-white dark:bg-gray-800 shadow-lg p-4 overflow-y-auto">
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Advanced Search</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Showing {filteredCount} of {totalListings} listings
        </p>
      </div>

      <div className="mb-6">
        <div className="relative">
          <SearchInput
            value={filters.query || ''}
            onChange={(e: ChangeEvent<HTMLInputElement>) => handleSearchChange(e.target.value)}
            placeholder="Search sustainable spaces..."
            className="w-full"
          />
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full
              ${isListening ? 'bg-green-100 text-green-600' : 'text-gray-400 hover:text-gray-600'}`}
            onClick={startVoiceSearch}
            type="button"
          >
            <Mic className="h-4 w-4" />
          </motion.button>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="font-medium mb-3 text-gray-900 dark:text-white">Categories</h3>
        <div className="space-y-2">
          {CATEGORIES.map(category => (
            <motion.label
              key={category}
              className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <input
                type="checkbox"
                checked={filters.category?.includes(category) ?? false}
                onChange={() => handleCategoryChange(category)}
                className="rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <span className="text-sm capitalize text-gray-700 dark:text-gray-300">{category}</span>
            </motion.label>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <h3 className="font-medium mb-3 text-gray-900 dark:text-white">Eco Features</h3>
        <div className="space-y-2">
          {ECO_TAGS.map(tag => (
            <motion.label
              key={tag.id}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={filters.ecoTags?.includes(tag.id) ?? false}
                  onChange={() => handleEcoTagChange(tag.id)}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">{tag.label}</span>
              </div>
              <span className={`w-2 h-2 rounded-full ${impactColors[tag.impact]}`} />
            </motion.label>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <h3 className="font-medium mb-3 text-gray-900 dark:text-white">Price Range</h3>
        <div className="space-y-4">
          <input
            type="range"
            min="0"
            max="10000"
            step="100"
            value={filters.maxPrice || 10000}
            onChange={(e: ChangeEvent<HTMLInputElement>) => handlePriceChange(filters.minPrice, Number(e.target.value))}
            className="w-full accent-green-500"
          />
          <div className="flex items-center space-x-4">
            <input
              type="number"
              min="0"
              max={filters.maxPrice || 10000}
              value={filters.minPrice || ''}
              onChange={(e: ChangeEvent<HTMLInputElement>) => handlePriceChange(Number(e.target.value), filters.maxPrice)}
              placeholder="Min"
              className="w-1/2 px-3 py-2 border rounded-lg focus:ring-green-500 focus:border-green-500"
            />
            <span className="text-gray-500">-</span>
            <input
              type="number"
              min={filters.minPrice || 0}
              max="10000"
              value={filters.maxPrice || ''}
              onChange={(e: ChangeEvent<HTMLInputElement>) => handlePriceChange(filters.minPrice, Number(e.target.value))}
              placeholder="Max"
              className="w-1/2 px-3 py-2 border rounded-lg focus:ring-green-500 focus:border-green-500"
            />
          </div>
        </div>
      </div>
    </aside>
  );
}
