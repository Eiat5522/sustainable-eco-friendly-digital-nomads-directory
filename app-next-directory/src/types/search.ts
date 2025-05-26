export interface SearchFilters {
  query: string;
  category?: 'coworking' | 'cafe' | 'accommodation';
  city?: string;
  ecoTags: string[];
  hasDigitalNomadFeatures: boolean;
  minSustainabilityScore?: number;
  maxPriceRange?: number;
}

export interface SustainabilityScore {
  score: number;
  factors: {
    ecoInitiatives: number;
    wasteManagement: number;
    energyEfficiency: number;
    localSourcing: number;
  };
}

export interface SortOption {
  field: 'relevance' | 'price' | 'rating' | 'sustainability' | 'distance';
  direction: 'asc' | 'desc';
  label: string;
}

export interface SearchResult {
  _id: string;
  name: string;
  slug: string;
  descriptionShort: string;
  category: string;
  city: {
    name: string;
    slug: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  coordinates?: {
    lat: number;
    lng: number;
  };
  mainImage: {
    asset: {
      _ref: string;
      url: string;
    };
    alt?: string;
  };
  ecoTags: string[];
  nomadFeatures: string[];
  priceRange?: {
    min: number;
    max: number;
    currency: string;
  };
  rating?: number;
  sustainabilityScore?: number;
  _score?: number;
}

export interface SearchResults {
  results: SearchResult[];
  pagination: {
    total: number;
    page: number;
    totalPages: number;
    hasMore: boolean;
  };
}
