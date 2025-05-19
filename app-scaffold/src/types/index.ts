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
