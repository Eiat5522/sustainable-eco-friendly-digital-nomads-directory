/** @jsxImportSource react */
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import debounce from 'lodash/debounce';
import { type SearchFilters } from '@/types/search';
import { type Listing } from '@/types/listings';
import '../../../types/speech-recognition';

interface SearchSidebarProps {
  listings: Listing[];
  cities: string[];
  ecoTags: string[];
}

interface SpeechRecognitionEvent {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
}

export default function SearchSidebar({ listings, cities, ecoTags }: SearchSidebarProps): React.ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<SearchFilters>({
    query: searchParams?.get('q') || '',
    category: (searchParams?.get('category') as SearchFilters['category']) || undefined,
    city: searchParams?.get('city') || undefined,
    ecoTags: searchParams?.get('ecoTags')?.split(',') || [],
    hasDigitalNomadFeatures: searchParams?.get('dnFeatures') === 'true',
    minSustainabilityScore: Number(searchParams?.get('minScore')) || undefined,
    maxPriceRange: Number(searchParams?.get('maxPrice')) || undefined,
  });

  const [isVoiceSearchActive, setIsVoiceSearchActive] = useState<boolean>(false);
  const recognition = useRef<SpeechRecognition | null>(null);

  // Initialize speech recognition
  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      recognition.current = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
      recognition.current.continuous = false;
      recognition.current.lang = 'en-US';
      
      recognition.current.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript;
        setFilters((prev: SearchFilters) => ({ ...prev, query: transcript }));
        setIsVoiceSearchActive(false);
      };

      recognition.current.onerror = () => {
        setIsVoiceSearchActive(false);
      };
    }
  }, []);

  const updateURL = useCallback(
    debounce((newFilters: SearchFilters) => {
      const params = new URLSearchParams();
      if (newFilters.query) params.set('q', newFilters.query);
      if (newFilters.category) params.set('category', newFilters.category);
      if (newFilters.city) params.set('city', newFilters.city);
      if (newFilters.ecoTags.length) params.set('ecoTags', newFilters.ecoTags.join(','));
      if (newFilters.hasDigitalNomadFeatures) params.set('dnFeatures', 'true');
      if (newFilters.minSustainabilityScore) params.set('minScore', String(newFilters.minSustainabilityScore));
      if (newFilters.maxPriceRange) params.set('maxPrice', String(newFilters.maxPriceRange));
      
      router.push(`/listings?${params.toString()}`);
    }, 300),
    [router]
  );

  useEffect(() => {
    updateURL(filters);
  }, [filters, updateURL]);

  const handleVoiceSearch = () => {
    if (recognition.current) {
      if (isVoiceSearchActive) {
        recognition.current.stop();
      } else {
        recognition.current.start();
        setIsVoiceSearchActive(true);
      }
    }
  };

  return (
    <aside className="w-full md:w-80 bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 space-y-6 flex-shrink-0">
      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          value={filters.query}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilters((prev: SearchFilters) => ({ ...prev, query: e.target.value }))}
          placeholder="Search locations..."
          className="w-full px-4 py-2 pr-12 rounded-lg border border-gray-200 dark:border-gray-700
                   bg-white dark:bg-slate-900 text-gray-900 dark:text-white
                   focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400
                   focus:border-transparent"
          aria-label="Search locations"
        />
        <button
          onClick={handleVoiceSearch}
          className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full
                    transition-colors duration-200
                    ${isVoiceSearchActive
                      ? 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
          aria-label={isVoiceSearchActive ? 'Stop voice search' : 'Start voice search'}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
          </svg>
        </button>
      </div>

      {/* Category Filter */}
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-900 dark:text-white">Category</h3>
        <div className="space-y-2">
          {(['coworking', 'cafe', 'accommodation'] as const).map((category) => (
            <label key={category} className="flex items-center space-x-3">
              <input
                type="radio"
                name="category"
                checked={filters.category === category}
                onChange={() => setFilters((prev: SearchFilters) => ({ ...prev, category: category }))}
                className="form-radio text-green-600 dark:text-green-500
                         focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400"
              />
              <span className="text-gray-700 dark:text-gray-300 capitalize">{category}</span>
            </label>
          ))}
        </div>
      </div>

      {/* City Filter */}
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-900 dark:text-white">City</h3>
        <select
          value={filters.city || ''}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => 
            setFilters((prev: SearchFilters) => ({ ...prev, city: e.target.value || undefined }))}
          className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700
                   bg-white dark:bg-slate-900 text-gray-900 dark:text-white
                   focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400"
        >
          <option value="">All Cities</option>
          {cities.map((city) => (
            <option key={city} value={city}>{city}</option>
          ))}
        </select>
      </div>

      {/* Eco Tags */}
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-900 dark:text-white">Sustainability Features</h3>
        <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
          {ecoTags.map((tag) => (
            <label key={tag} className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={filters.ecoTags.includes(tag)}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setFilters((prev: SearchFilters) => ({
                    ...prev,
                    ecoTags: e.target.checked
                      ? [...prev.ecoTags, tag]
                      : prev.ecoTags.filter((t: string) => t !== tag)
                  }));
                }}
                className="form-checkbox text-green-600 dark:text-green-500
                         rounded focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400"
              />
              <span className="text-gray-700 dark:text-gray-300">{tag.replace(/_/g, ' ')}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Digital Nomad Features Toggle */}
      <div className="space-y-3">
        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={filters.hasDigitalNomadFeatures}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
              setFilters((prev: SearchFilters) => ({ ...prev, hasDigitalNomadFeatures: e.target.checked }))}
            className="form-checkbox text-green-600 dark:text-green-500
                     rounded focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400"
          />
          <span className="text-gray-700 dark:text-gray-300">Has Digital Nomad Features</span>
        </label>
      </div>

      {/* Sustainability Score Range */}
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-900 dark:text-white">Minimum Sustainability Score</h3>
        <input
          type="range"
          min="0"
          max="100"
          step="10"
          value={filters.minSustainabilityScore || 0}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
            setFilters((prev: SearchFilters) => ({ ...prev, minSustainabilityScore: Number(e.target.value) || undefined }))}
          className="w-full accent-green-600 dark:accent-green-500"
        />
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>0</span>
          <span>50</span>
          <span>100</span>
        </div>
      </div>

      {/* Price Range */}
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-900 dark:text-white">Maximum Price (THB)</h3>
        <input
          type="range"
          min="0"
          max="10000"
          step="500"
          value={filters.maxPriceRange || 10000}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
            setFilters((prev: SearchFilters) => ({ ...prev, maxPriceRange: Number(e.target.value) || undefined }))}
          className="w-full accent-green-600 dark:accent-green-500"
        />
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>฿0</span>
          <span>฿{filters.maxPriceRange || 10000}</span>
        </div>
      </div>

      {/* Reset Filters */}
      <button
        onClick={() => setFilters({
          query: '',
          ecoTags: [],
          hasDigitalNomadFeatures: false,
        })}
        className="w-full px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300
                 bg-gray-100 dark:bg-gray-700 rounded-lg
                 hover:bg-gray-200 dark:hover:bg-gray-600
                 transition-colors duration-200"
      >
        Reset Filters
      </button>
    </aside>
  );
}
