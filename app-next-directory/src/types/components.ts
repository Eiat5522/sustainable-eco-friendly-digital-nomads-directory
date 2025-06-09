export type FilterOperator = 'AND' | 'OR';

export interface FilterCondition {
  field: string;
  value: string | number | boolean;
  operator?: FilterOperator;
}

export interface FilterGroup {
  conditions: FilterCondition[];
  operator: FilterOperator;
  isEnabled?: boolean;
  label?: string;
}

export interface FilterValues {
  searchQuery?: string;
  category?: string;
  location?: string;
  ecoTags?: string[];
  nomadFeatures?: string[];
  minRating?: number;
  maxPriceRange?: number;
  combinations?: FilterGroup[];
  combinationOperator?: FilterOperator;
}

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  asChild?: boolean;
}
