export interface EcoTag {
  id: string;
  label: string;
  impact: 'high' | 'medium' | 'low';
}

export interface SearchFilters {
  category?: string[];
  ecoTags?: string[];
  minPrice?: number;
  maxPrice?: number;
  query?: string;
}

export interface FilterOption {
  id: string;
  label: string;
  count?: number;
  icon?: string;
  ecoImpact?: 'high' | 'medium' | 'low';
}

export interface FilterGroup {
  id: string;
  label: string;
  options: FilterOption[];
  multiSelect?: boolean;
  icon?: string;
}

// City type
export interface City {
  id: string;
  name: string;
  country: string;
  slug: string;
  description: string;
  description_short?: string;
  images?: string[];
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  airQuality?: string;
  internetSpeed?: number;
  costOfLiving?: string;
  climate?: string;
  safety?: string;
  walkability?: string;
  sustainabilityInitiatives?: string[];
  nomadFeatures?: string[];
}

// Listing type
export interface Listing {
  id: string;
  name: string;
  slug: string;
  cityId: string;
  category: string;
  description_short: string;
  description_long: string;
  imageUrl: string;
  images?: string[];
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  eco_features?: string[];
  amenities?: string[];
  price?: number;
  currency?: string;
  rating?: number;
  reviewCount?: number;
}

export interface CityPageProps extends Record<string, unknown> {
  city: string;
  listings: Listing[];
  // Add other properties as needed
}

export interface UnifiedListing {
  id: string;
  slug: string;
  title: string;
  city?: string;
  address_string?: string;
  eco_focus_tags?: string[];
  eco_notes_detailed?: string;
  // Add common properties from both Listing and SanityListing
}

// Add more types as needed
