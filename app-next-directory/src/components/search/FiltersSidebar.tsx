'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { FilterDefinition } from '@/hooks/useFilters';
import { ListingCategory } from '@/types/enums';
import { DigitalNomadSearchFilter } from './DigitalNomadSearchFilter';

type FiltersMap = Record<string, string[]>;

const ignoredClearCommandPatterns = ['clear filters', 'reset filters', 'remove filters'] as const;

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function ignoredTokenize(value: string): string[] {
  return normalizeText(value).split(' ').filter(Boolean);
}

type FiltersMapEntry = [groupId: string, values: string[]];

function createFiltersKey(filters: FiltersMap): string {
  const entries: FiltersMapEntry[] = Object.entries(filters)
    .map(([groupId, values]): FiltersMapEntry => {
      const uniqueValues = [...new Set(values ?? [])].filter(Boolean).sort();
      return [groupId, uniqueValues];
    })
    .sort(([groupA], [groupB]) => groupA.localeCompare(groupB));
  return JSON.stringify(entries);
}

function normalizeFilters(filters: FiltersMap): FiltersMap {
  const normalized: FiltersMap = {};
  Object.entries(filters).forEach(([groupId, values]) => {
    const unique = Array.from(new Set(values.filter(Boolean)));
    if (unique.length) normalized[groupId] = unique;
  });
  return normalized;
}

function ignoredFilterToAllowedValues(
  filters: FiltersMap,
  allowedByGroup: Map<string, Set<string>>
): FiltersMap {
  const sanitized: FiltersMap = {};
  Object.entries(filters).forEach(([groupId, values]) => {
    const allowed = allowedByGroup.get(groupId);
    if (!allowed) return;
    const unique = Array.from(new Set(values)).filter(value => allowed.has(value));
    if (unique.length) sanitized[groupId] = unique;
  });
  return sanitized;
}

const defaultDefinitions: FilterDefinition[] = [
  {
    id: 'category',
    label: 'Category',
    multiSelect: true,
    options: [
      { id: ListingCategory.COWORKING, label: 'Coworking' },
      { id: ListingCategory.CAFE, label: 'Cafe' },
      { id: ListingCategory.ACCOMMODATION, label: 'Accommodation' },
      { id: ListingCategory.RESTAURANT, label: 'Restaurant' },
      { id: ListingCategory.ACTIVITIES, label: 'Activities' },
    ],
  },
  {
    id: 'destination',
    label: 'Destination',
    multiSelect: true,
    options: [
      { id: 'Lisbon', label: 'Lisbon' },
      { id: 'Bali', label: 'Bali' },
      { id: 'Chiang Mai', label: 'Chiang Mai' },
    ],
  },
  {
    id: 'amenities',
    label: 'Amenities',
    multiSelect: true,
    options: [
      { id: 'wifi', label: 'Wi‑Fi' },
      { id: 'vegan', label: 'Vegan options' },
      { id: 'outdoor', label: 'Outdoor seating' },
    ],
  },
  {
    id: 'nomadFeatures',
    label: 'Nomad Features',
    multiSelect: true,
    options: [
      { id: 'fast-internet', label: 'Fast Internet' },
      { id: 'community', label: 'Community Events' },
    ],
  },
];

interface FiltersSidebarProps {
  definitions?: FilterDefinition[];
}

export function FiltersSidebar({ definitions = defaultDefinitions }: FiltersSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const allowedByGroup = useMemo(
    () => new Map(definitions.map(d => [d.id, new Set(d.options?.map(o => o.id) ?? [])])),
    [definitions]
  );

  const initialFilters = useMemo(() => {
    const initial: FiltersMap = {};
    definitions.forEach(group => {
      const allowed = allowedByGroup.get(group.id);
      const values = searchParams.getAll(group.id);
      const sanitized = allowed ? values.filter(value => allowed.has(value)) : values;
      if (sanitized.length) {
        initial[group.id] = Array.from(new Set(sanitized));
      }
    });
    return initial;
  }, [allowedByGroup, definitions, searchParams]);

  const [controlledFilters, setControlledFilters] = useState<FiltersMap>(initialFilters);
  const [filtersKey, setFiltersKey] = useState(() => createFiltersKey(initialFilters));
  const filtersKeyRef = useRef(filtersKey);

  useEffect(() => {
    const nextKey = createFiltersKey(initialFilters);
    if (nextKey !== filtersKeyRef.current) {
      filtersKeyRef.current = nextKey;
      setControlledFilters(initialFilters);
      setFiltersKey(nextKey);
    }
  }, [initialFilters]);

  useEffect(() => {
    filtersKeyRef.current = filtersKey;
  }, [filtersKey]);

  const applyFilters = useCallback(
    (filters: FiltersMap) => {
      const normalized = normalizeFilters(filters);
      const nextKey = createFiltersKey(normalized);
      if (nextKey === filtersKeyRef.current) return;

      filtersKeyRef.current = nextKey;
      setControlledFilters(normalized);
      setFiltersKey(nextKey);

      const params = new URLSearchParams(Array.from(searchParams.entries()));
      definitions.forEach(group => params.delete(group.id));
      Object.entries(normalized).forEach(([groupId, values]) => {
        values.forEach(value => params.append(groupId, value));
      });
      params.delete('page');
      const query = params.toString();
      router.push(query ? `/search?${query}` : '/search');
    },
    [definitions, router, searchParams]
  );

  const handleChange = useCallback(
    (filters: FiltersMap) => {
      applyFilters(filters);
    },
    [applyFilters]
  );

  return (
    <div className="space-y-4">
      <DigitalNomadSearchFilter
        key={filtersKey}
        definitions={definitions}
        initialFilters={controlledFilters}
        onChange={handleChange}
        title="Filter Results"
      />
    </div>
  );
}

export default FiltersSidebar;
