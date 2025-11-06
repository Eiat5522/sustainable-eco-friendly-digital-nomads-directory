export type { StrictComponent, StrictProps } from './react';

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

// LocalCity type
export interface LocalCity {
  id: string;
  name: string;
  country: string;
  slug: string;
  description: string;
  shortDescription?: string;
  images?: string[];
  primaryImage?: string;
  galleryImages?: string[];
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
  digitalNomadFeatures?: string[];
}

// Listing type
export interface Listing {
  id: string;
  name: string;
  slug: string;
  cityId: string;
  category: string;
  shortDescription: string;
  longDescription: string;
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
  
  reviewCount?: number;
}

export interface LocalCityPageProps extends Record<string, unknown> {
  city: string;
  listings: Listing[];
  // Add other properties as needed
}

export interface UnifiedListing {
  id: string;
  slug: string;
  title: string;
  city?: string;
  address?: string;
  ecoTags?: string[];
  ecoNotesDetailed?: string;
  // Add common properties from both Listing and SanityListing
}

// Add more types as needed
