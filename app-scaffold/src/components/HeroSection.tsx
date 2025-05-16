"use client";

import React, { useState } from 'react';

interface HeroSectionProps {
  title?: string;
  subtitle?: string;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  className?: string;
  ecoMetrics?: {
    sustainableLocations: number;
    co2Saved: number;
    greenCertified: number;
  };
}

interface MetricProps {
  label: string;
  value: string | number;
}

export function HeroSection({
  title = 'Discover Eco-Friendly Spaces',
  subtitle = 'Find sustainable locations for digital nomads across the globe',
  searchPlaceholder = 'Search eco-friendly spaces...',
  onSearch,
  className = '',
  ecoMetrics,
}: HeroSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const metrics: MetricProps[] = ecoMetrics ? [
    { label: 'Eco-Friendly Locations', value: ecoMetrics.sustainableLocations },
    { label: 'CO₂ Saved Monthly', value: `${ecoMetrics.co2Saved}kg` },
    { label: 'Green Certified', value: ecoMetrics.greenCertified },
  ] : [];

  const quickFilters = ['Eco Hostels', 'Solar Powered', 'Zero Waste', 'Organic Gardens'];

  return (
    <div className={`relative min-h-[90vh] w-full overflow-hidden bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900 dark:to-emerald-800 ${className}`}>
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10 bg-[url('/eco-pattern.svg')]" />
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/10 to-white/20 dark:via-black/10 dark:to-black/20" />

      {/* Content */}
      <div className="relative container mx-auto px-4 h-full flex flex-col justify-center items-center text-center">
        {/* Title and subtitle */}
        <div className="space-y-6 max-w-4xl">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-green-900 dark:text-green-50 transition-colors">
            {title}
          </h1>
          <p className="text-lg md:text-xl text-green-800/90 dark:text-green-100/90 max-w-2xl mx-auto">
            {subtitle}
          </p>
        </div>

        {/* Search form */}
        <form onSubmit={handleSearch} className="w-full max-w-2xl mt-12 mb-12">
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              value={searchQuery}
              onChange={handleInputChange}
              placeholder={searchPlaceholder}
              className="flex-1 px-6 py-4 rounded-full border border-green-200 dark:border-green-700 bg-white/80 dark:bg-black/20 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 transition-shadow"
            />
            <button
              type="submit"
              className="px-8 py-4 rounded-full bg-green-600 hover:bg-green-700 text-white font-medium transition-colors shadow-lg hover:shadow-xl"
            >
              Search
            </button>
          </div>
        </form>

        {/* Quick filters */}
        <div className="flex flex-wrap gap-3 justify-center mb-12">
          {quickFilters.map((tag) => (
            <button
              key={tag}
              type="button"
              className="px-4 py-2 rounded-full bg-white/20 dark:bg-black/20 hover:bg-white/30 dark:hover:bg-black/30 border border-green-200 dark:border-green-700 text-green-800 dark:text-green-200 text-sm transition-colors"
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Eco metrics */}
        {ecoMetrics && metrics.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl w-full mt-8">
            {metrics.map(({ label, value }) => (
              <div key={label} className="flex flex-col items-center p-6 rounded-2xl bg-white/10 dark:bg-black/10 backdrop-blur-sm border border-green-200/50 dark:border-green-700/50">
                <span className="text-2xl font-bold text-green-800 dark:text-green-200">{value}</span>
                <span className="text-sm text-green-700 dark:text-green-300">{label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
