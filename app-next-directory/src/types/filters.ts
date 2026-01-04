import type { ListingCategory } from './enums';

// Filter combination operators
export type FilterOperator = 'AND' | 'OR';

// Filter group that combines multiple conditions
export interface FilterGroup {
  conditions: FilterCondition[];
  operator: FilterOperator;
  isEnabled?: boolean;
  label?: string;
}

export interface ListingFilters {
  searchQuery?: string;
  category?: ListingCategory;
  location?: string;
  ecoTags?: string[];
  nomadFeatures?: string[];

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

// Single filter condition mapped to the correct value type for each field
export type FilterCondition = {
  [Key in keyof ListingFilters]: {
    field: Key;
    value: NonNullable<ListingFilters[Key]>;
    operator?: FilterOperator;
  };
}[keyof ListingFilters];

export interface FilterResults<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}
