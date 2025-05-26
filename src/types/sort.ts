export interface SortOption {
  field: string;
  displayName: string;
  direction: 'asc' | 'desc';
}

export const DEFAULT_SORT_OPTIONS: SortOption[] = [
  { field: 'name', displayName: 'Name', direction: 'asc' },
  { field: 'sustainabilityScore', displayName: 'Sustainability Score', direction: 'desc' },
  { field: 'rating', displayName: 'Rating', direction: 'desc' },
  { field: 'priceRange', displayName: 'Price', direction: 'asc' },
  { field: '_createdAt', displayName: 'Newest', direction: 'desc' }
];
