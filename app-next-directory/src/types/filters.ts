import { CategoryType } from './sanity';

// Filter combination operators
export type FilterOperator = 'AND' | 'OR';

// Single filter condition
export interface FilterCondition {
  field: keyof ListingFilters;
  value: any;
  operator?: FilterOperator;
}

// Filter group that combines multiple conditions
export interface FilterGroup {
  conditions: FilterCondition[];
  operator: FilterOperator;
  isEnabled?: boolean;
  label?: string;
}

export interface ListingFilters {
  searchQuery?: string;
  category?: CategoryType;
  location?: string;
  ecoTags?: string[];
  nomadFeatures?: string[];
  minRating?: number;
  maxPriceRange?: number;
  // New fields for advanced search filters
  minPriceRange?: number; // Minimum price for dual range slider (budget filtering)
  sustainabilityScore?: number; // Separate eco-focused score (1-5, distinct from general rating)
  radius?: number; // Search radius in kilometers for geo-filtering
  latitude?: number; // Geo-search latitude
  longitude?: number; // Geo-search longitude
  accommodationType?: string[]; // Specific accommodation types for travelers
  ecoCertification?: string; // Specific eco-certifications
  combinations?: FilterGroup[];
  combinationOperator?: FilterOperator; // Global operator for combining filter groups
}

export interface FilterResults<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}
