import dynamic from 'next/dynamic';
import React, { useCallback, useState } from 'react';
import { ListingFilters } from '../types/filters';

// Dynamic import for LeafletMap to avoid SSR issues
const LeafletMap = dynamic(() => import('./LeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="h-64 bg-gray-200 rounded-md animate-pulse flex items-center justify-center">
      Loading map...
    </div>
  ),
});

// Simple debounce utility with proper typing
const debounce = (func: (...args: any[]) => void, delay: number) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

interface SearchFiltersProps extends Record<string, unknown> {
  onFilterChange: (filters: Partial<ListingFilters>) => void;
  initialFilters?: Partial<ListingFilters>;
}

const SearchFilters: React.FC<SearchFiltersProps> = ({ onFilterChange, initialFilters = {} }) => {
  // State management for all filter components
  const [searchQuery, setSearchQuery] = useState<string>(initialFilters.searchQuery || '');
  const [ecoCertification, setEcoCertification] = useState<string>(
    initialFilters.ecoCertification || ''
  );
  const [minPriceRange, setMinPriceRange] = useState<number>(initialFilters.minPriceRange || 0);
  const [maxPriceRange, setMaxPriceRange] = useState<number>(initialFilters.maxPriceRange || 500);
  const [sustainabilityScore, setSustainabilityScore] = useState<number>(
    initialFilters.sustainabilityScore || 0
  );
  const [accommodationType, setAccommodationType] = useState<string[]>(
    initialFilters.accommodationType || []
  );
  const [latitude, setLatitude] = useState<number | undefined>(initialFilters.latitude);
  const [longitude, setLongitude] = useState<number | undefined>(initialFilters.longitude);
  const [radius, setRadius] = useState<number>(initialFilters.radius || 10);
  const [isMapLoading, setIsMapLoading] = useState<boolean>(false);

  // Real Sanity data arrays
  const ecoCertifications = [
    'Green Globe',
    'Earth Check',
    'Rainforest Alliance',
    'LEED',
    'Green Key',
    'Thai Green Hotel',
    'Local Eco Cert',
    'Zero Waste',
  ];

  const accommodationTypes = [
    'Hotel',
    'Guesthouse',
    'Bungalow',
    'Resort',
    'Hostel',
    'Apartment/Condo',
    'Villa',
    'Eco Lodge',
  ];
  // Debounced filter change handler
  const debouncedFilterChange = useCallback(
    debounce((filters: Partial<ListingFilters>) => {
      onFilterChange(filters);
    }, 300),
    [onFilterChange]
  );

  // Generic input change handler
  const handleInputChange = (field: keyof ListingFilters, value: any) => {
    debouncedFilterChange({ [field]: value });
  };

  // Price range handlers
  const handlePriceChange = (type: 'min' | 'max', value: number) => {
    if (type === 'min') {
      setMinPriceRange(value);
      handleInputChange('minPriceRange', value);
    } else {
      setMaxPriceRange(value);
      handleInputChange('maxPriceRange', value);
    }
  };

  // Accommodation type toggle
  const handleAccommodationTypeToggle = (type: string) => {
    const newTypes = accommodationType.includes(type)
      ? accommodationType.filter((t: string) => t !== type)
      : [...accommodationType, type];
    setAccommodationType(newTypes);
    handleInputChange('accommodationType', newTypes);
  };

  // Location selection from map
  const handleLocationSelect = (lat: number, lng: number) => {
    setLatitude(lat);
    setLongitude(lng);
    handleInputChange('latitude', lat);
    handleInputChange('longitude', lng);
    handleInputChange('radius', radius);
  };

  // Radius change handler
  const handleRadiusChange = (newRadius: number) => {
    setRadius(newRadius);
    if (latitude && longitude) {
      handleInputChange('latitude', latitude);
      handleInputChange('longitude', longitude);
      handleInputChange('radius', newRadius);
    }
  };
  // Enhanced Star Rating Component
  const SustainabilityStarRating = ({
    score,
    onChange,
  }: {
    score: number;
    onChange: (score: number) => void;
  }) => {
    return (
      <div className="flex items-center space-x-1 mb-3">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className={`text-2xl ${
              star <= score / 20
                ? 'text-green-500 hover:text-green-600'
                : 'text-gray-300 hover:text-gray-400'
            } transition-colors duration-150`}
            aria-label={`${star} star${star !== 1 ? 's' : ''}`}
          >
            ★
          </button>
        ))}
        <span className="ml-2 text-sm text-gray-600">
          {score > 0 ? `${score}/100` : 'Any score'}
        </span>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6 bg-white rounded-lg shadow-lg border border-gray-100">
      <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
        🔍 Advanced Search Filters
        <span className="ml-2 text-sm font-normal text-gray-500">
          (Enhanced for Digital Nomads)
        </span>
      </h3>

      {/* Enhanced Location and Interactive Map */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            📍 Location & Map Search
          </label>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                handleInputChange('searchQuery', e.target.value);
              }}
              placeholder="Enter city, country, or region..."
              className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Enhanced Search Radius */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            🔍 Search Radius: <span className="text-blue-600 font-semibold">{radius} km</span>
          </label>
          <div className="relative">
              <input
                type="range"
                min="1"
                max="100"
                value={radius}
                onChange={e => handleRadiusChange(parseInt(e.target.value))}
                title="Search radius"
                className="w-full h-3 rounded-lg appearance-none cursor-pointer bg-gradient-to-r from-blue-500 via-blue-500 to-gray-300 slider"
              />
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>1 km</span>
              <span className="text-gray-400">🏃‍♂️ Walking distance</span>
              <span className="text-gray-400">🚗 Driving distance</span>
              <span>100 km</span>
            </div>
          </div>
        </div>

        {/* Interactive Map with Enhanced UI */}
        <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="bg-gradient-to-r from-blue-50 to-green-50 px-4 py-2 border-b border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 flex items-center">
              🗺️ Interactive Map
              <span className="ml-2 text-xs text-gray-500">(Click to set location)</span>
            </h4>
          </div>
          {typeof window !== 'undefined' && (
            <div className="h-64 relative">
              {isMapLoading ? (
                <div className="h-full flex items-center justify-center bg-gray-100">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                    <div className="text-gray-500 text-sm">Loading interactive map...</div>
                  </div>
                </div>
              ) : LeafletMap ? (
              <LeafletMap
                initialPosition={[latitude || 0, longitude || 0]}
                radius={radius}
                onLocationSelect={handleLocationSelect}
                className="h-full w-full"
              />
              ) : (
                <div className="h-full flex items-center justify-center bg-gray-100">
                  <div className="text-center text-gray-500">
                    <svg
                      className="h-12 w-12 mx-auto mb-2 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3"
                      />
                    </svg>
                    <div className="text-sm">Map temporarily unavailable</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Enhanced Price Range Slider for Budget Travelers */}
        <div className="bg-gray-50 p-5 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            💰 Budget Range:{' '}
            <span className="text-green-600 font-semibold">
              ${minPriceRange} - ${maxPriceRange}
            </span>{' '}
            per night
          </label>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <label className="text-sm text-gray-600 w-16">Min:</label>
              <input
                type="range"
                min="0"
                max="1000"
                step="10"
                value={minPriceRange}
                onChange={e => handlePriceChange('min', parseInt(e.target.value))}
                title="Minimum price per night"
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-thumb-green"
              />
              <span className="text-sm font-medium text-gray-700 w-16">${minPriceRange}</span>
            </div>
            <div className="flex items-center space-x-3">
              <label className="text-sm text-gray-600 w-16">Max:</label>
              <input
                type="range"
                min="0"
                max="1000"
                step="10"
                value={maxPriceRange}
                onChange={e => handlePriceChange('max', parseInt(e.target.value))}
                title="Maximum price per night"
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-thumb-green"
              />
              <span className="text-sm font-medium text-gray-700 w-16">${maxPriceRange}</span>
            </div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>Free</span>
            <span>$1000+</span>
          </div>
          <div className="mt-3 p-3 bg-green-50 rounded-md">
            <p className="text-xs text-green-700 flex items-center">
              💡 Perfect for budget-conscious digital nomads! Set your comfort range.
            </p>
          </div>
        </div>

        {/* Enhanced Sustainability Score Filter with Star Rating */}
        <div className="bg-gray-50 p-5 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            🌱 Minimum Sustainability Score
          </label>

          <SustainabilityStarRating
            score={sustainabilityScore}
            onChange={newScore => {
              const scoreValue = newScore * 20; // Convert 1-5 stars to 0-100 scale
              setSustainabilityScore(scoreValue);
              handleInputChange('sustainabilityScore', scoreValue);
            }}
          />

          <input
            type="range"
            min="0"
            max="100"
            value={sustainabilityScore}
            title="Minimum sustainability score"
            onChange={e => {
              const value = parseInt(e.target.value);
              setSustainabilityScore(value);
              handleInputChange('sustainabilityScore', value);
            }}
            className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gradient-to-r from-green-500 via-green-500 to-gray-300 mt-3"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>Any (0)</span>
            <span>Excellent (100)</span>
          </div>
        </div>

        {/* Enhanced Eco-Certification Filter */}
        <div className="bg-gray-50 p-5 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            🏆 Eco-Certification
          </label>
          <select
            value={ecoCertification}
            title="Eco certification"
            onChange={e => {
              setEcoCertification(e.target.value);
              handleInputChange('ecoCertification', e.target.value);
            }}
            className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
          >
            <option value="">Any Certification</option>
            {ecoCertifications.map(cert => (
              <option key={cert} value={cert}>
                {cert}
              </option>
            ))}
          </select>
        </div>

        {/* Enhanced Accommodation Type Filter */}
        <div className="bg-gray-50 p-5 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            🏠 Accommodation Types
          </label>
          <div className="grid grid-cols-2 gap-3">
            {accommodationTypes.map(type => (
              <label
                key={type}
                className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={accommodationType.includes(type)}
                  onChange={() => handleAccommodationTypeToggle(type)}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">{type}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchFilters;
