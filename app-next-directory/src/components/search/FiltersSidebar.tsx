'use client'

import { useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { DigitalNomadSearchFilter } from './DigitalNomadSearchFilter'
import type { FilterDefinition } from '@/hooks/useFilters'
import { ListingCategory } from '@/types/enums'

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
]

interface FiltersSidebarProps {
  definitions?: FilterDefinition[]
}

export function FiltersSidebar({ definitions = defaultDefinitions }: FiltersSidebarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const initialFilters = useMemo(() => {
    const initial: Record<string, string[]> = {}
    const allowedByGroup = new Map(
      definitions.map((d) => [d.id, new Set(d.options?.map((o) => o.id) ?? [])])
    )
    definitions.forEach((group) => {
      const allowed = allowedByGroup.get(group.id)
      const values = searchParams.getAll(group.id)
      const sanitized = allowed ? values.filter((v) => allowed.has(v)) : values
      if (sanitized.length) initial[group.id] = Array.from(new Set(sanitized))
    })
    return initial
  }, [searchParams, definitions])

  const handleChange = (filters: { [groupId: string]: string[] }) => {
    const params = new URLSearchParams(Array.from(searchParams.entries()))

    // Clear all known groups first
    definitions.forEach((g) => params.delete(g.id))

    // Rebuild from filters
    Object.entries(filters).forEach(([groupId, values]) => {
      values.forEach((v) => params.append(groupId, v))
    })

    // Reset pagination when filters change
    params.delete('page')
    router.push(`/search?${params.toString()}`)
  }

  return (
    <DigitalNomadSearchFilter
      definitions={definitions}
      initialFilters={initialFilters}
      onChange={handleChange}
      title="Filter Results"
    />
  )
}

export default FiltersSidebar
