'use client';

import React from 'react';
import DigitalNomadSearchFilter, {
  type MultiSelectFilters,
} from '@/components/ui/DigitalNomadSearchFilter';

export interface FiltersSidebarProps {
  onChange?: (params: {
    destination?: string[];
    category?: string[];
    nomadFeatures?: string[];
    amenities?: string[];
  }) => void;
}

export default function FiltersSidebar({ onChange }: FiltersSidebarProps) {
  const handleFilterChange = (filters: MultiSelectFilters) => {
    const params: FiltersSidebarProps['onChange'] extends (...args: any) => any
      ? Parameters<FiltersSidebarProps['onChange']>[0]
      : Record<string, never> = {};

    if (filters.destination.length) params.destination = filters.destination;
    if (filters.category.length) params.category = filters.category;
    if (filters.nomadFeatures.length) params.nomadFeatures = filters.nomadFeatures;
    if (filters.amenities.length) params.amenities = filters.amenities;

    onChange?.(params);
  };

  return <DigitalNomadSearchFilter onFilterChange={handleFilterChange} />;
}

