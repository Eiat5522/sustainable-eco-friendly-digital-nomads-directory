'use client';

import React, { useEffect } from 'react';
import DigitalNomadSearch from '@/components/ui/DigitalNomadSearch';

export interface SearchBoxProps {
  initialValue?: string;
  onSearch: (filters: {
    searchText: string;
    destinations: string[];
    categories: string[];
    amenities: string[];
  }) => void;
}

export default function SearchBox({ initialValue = '', onSearch }: SearchBoxProps) {
  useEffect(() => {
    if (initialValue) {
      onSearch({
        searchText: initialValue,
        destinations: [],
        categories: [],
        amenities: [],
      });
    }
  }, [initialValue, onSearch]);

  return <DigitalNomadSearch onFiltersChange={onSearch} />;
}

