'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { debounce } from 'lodash';
import { Leaf, MapPin, Search, X } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

interface SearchFilters {
  query: string;
  category?: string;
  city?: string;
  priceRange?: [number, number];
  ecoFeatures: string[];
  sustainabilityScore?: number;
  sortBy?: 'relevance' | 'rating' | 'price_low' | 'price_high';
}

interface SearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const categories = ['Coworking', 'Accommodation', 'Cafe', 'Restaurant', 'Activity'];
const ecoFeatures = [
  'Solar Powered',
  'Zero Waste',
  'Organic Food',
  'Rainwater Harvesting',
  'Composting',
  'Plastic Free',
];

export function SearchDialog({ isOpen, onClose }: SearchDialogProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    ecoFeatures: [],
  });
  const dialogRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Initialize filters from URL parameters
  useEffect(() => {
    const query = searchParams.get('q') || '';
    const category = searchParams.get('category') || undefined;
    const city = searchParams.get('city') || undefined;
    const ecoFeatures = searchParams.get('eco')?.split(',') || [];

    setFilters({
      query,
      category,
      city,
      ecoFeatures,
    });
  }, [searchParams]);

  // Focus search input on open
  useEffect(() => {
    if (isOpen) {
      searchInputRef.current?.focus();
    }
  }, [isOpen]);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dialogRef.current && !dialogRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Handle search updates with debouncing
  const debouncedSearch = useCallback(
    debounce((newFilters: SearchFilters) => {
      const params = new URLSearchParams();
      if (newFilters.query) params.set('q', newFilters.query);
      if (newFilters.category) params.set('category', newFilters.category);
      if (newFilters.city) params.set('city', newFilters.city);
      if (newFilters.ecoFeatures.length) {
        params.set('eco', newFilters.ecoFeatures.join(','));
      }

      router.push(`/listings?${params.toString()}`);
      onClose();
    }, 300),
    [router, onClose]
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFilters = { ...filters, query: e.target.value };
    setFilters(newFilters);
    debouncedSearch(newFilters);
  };

  const toggleEcoFeature = (feature: string) => {
    const newFilters = {
      ...filters,
      ecoFeatures: filters.ecoFeatures.includes(feature)
        ? filters.ecoFeatures.filter(f => f !== feature)
        : [...filters.ecoFeatures, feature],
    };
    setFilters(newFilters);
    debouncedSearch(newFilters);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-[10vh]"
        >
          <motion.div
            ref={dialogRef}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-2xl mx-4"
          >
            {/* Search Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={filters.query}
                  onChange={handleSearchChange}
                  placeholder="Search eco-friendly spaces..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400"
                />
                <button
                  onClick={onClose}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="p-4">
              {/* Categories */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                  Categories
                </h3>
                <div className="flex flex-wrap gap-2">
                  {categories.map(category => (
                    <button
                      key={category}
                      onClick={() => {
                        const newFilters = {
                          ...filters,
                          category: filters.category === category ? undefined : category,
                        };
                        setFilters(newFilters);
                        debouncedSearch(newFilters);
                      }}
                      className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                        filters.category === category
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              {/* Eco Features */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                  Eco Features
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {ecoFeatures.map(feature => (
                    <button
                      key={feature}
                      onClick={() => toggleEcoFeature(feature)}
                      className={`flex items-center px-3 py-2 rounded-lg text-sm transition-colors ${
                        filters.ecoFeatures.includes(feature)
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      <Leaf className="h-4 w-4 mr-2" />
                      {feature}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-b-lg">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                Popular Searches
              </h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    const newFilters = {
                      ...filters,
                      query: 'coworking spaces with fast wifi',
                    };
                    setFilters(newFilters);
                    debouncedSearch(newFilters);
                  }}
                  className="flex items-center px-3 py-1.5 rounded-full text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Coworking with Fast WiFi
                </button>
                <button
                  onClick={() => {
                    const newFilters = {
                      ...filters,
                      query: 'zero waste cafes',
                    };
                    setFilters(newFilters);
                    debouncedSearch(newFilters);
                  }}
                  className="flex items-center px-3 py-1.5 rounded-full text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <Leaf className="h-4 w-4 mr-2" />
                  Zero Waste Cafes
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
