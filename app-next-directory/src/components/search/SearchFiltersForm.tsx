'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Search, MapPin, Building2, Home, Wifi, Shield, Key } from 'lucide-react'
import { NeoInput } from '@/components/ui/neo-input'
import { NeoButton } from '@/components/ui/neo-button'
import { FilterMultiSelect, Option } from '@/components/ui/filter-multi-select'
import type {
  City,
  CityResponse,
  CategoryResponse,
  Amenity,
  AmenityResponse,
} from '@/types/api-responses'
import type { SearchParamRecord } from '@/types/search'

function toStringArray(value: string | string[] | undefined): string[] {
  if (value === undefined) return []
  const arr = Array.isArray(value) ? value : [value]
  return Array.from(
    new Set(
      arr
        .map((entry) => String(entry).trim())
        .filter((entry) => entry.length > 0)
    )
  )
}

function firstString(value: string | string[] | undefined): string {
  if (value === undefined) return ''
  if (Array.isArray(value)) return value.length > 0 ? String(value[0]) : ''
  return String(value)
}

function recordToParams(record: SearchParamRecord): URLSearchParams {
  const params = new URLSearchParams()
  const entries = Object.entries(record)
  entries.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
  for (const [key, raw] of entries) {
    if (raw === undefined) continue
    if (Array.isArray(raw)) {
      raw.forEach((value) => params.append(key, String(value)))
    } else {
      params.set(key, String(raw))
    }
  }
  return params
}

interface SearchFiltersFormProps {
  initialParams?: SearchParamRecord
  resultsPath?: string
  className?: string
}

const DEFAULT_RESULTS_PATH = '/search/results'

export function SearchFiltersForm({ initialParams = {}, resultsPath = DEFAULT_RESULTS_PATH, className }: SearchFiltersFormProps) {
  const router = useRouter()

  const initialSearchTerm = React.useMemo(() => firstString(initialParams.q), [initialParams])
  const initialCities = React.useMemo(() => toStringArray(initialParams.destination), [initialParams])
  const initialCategories = React.useMemo(() => toStringArray(initialParams.category), [initialParams])
  const initialAmenities = React.useMemo(() => toStringArray(initialParams.amenities), [initialParams])
  const initialLimit = React.useMemo(() => firstString(initialParams.limit) || '12', [initialParams])

  const [searchTerm, setSearchTerm] = React.useState(initialSearchTerm)
  const [selectedCities, setSelectedCities] = React.useState<string[]>(initialCities)
  const [selectedCategories, setSelectedCategories] = React.useState<string[]>(initialCategories)
  const [selectedAmenities, setSelectedAmenities] = React.useState<string[]>(initialAmenities)

  const [cityOptions, setCityOptions] = React.useState<Option[]>([])
  const [categoryOptions, setCategoryOptions] = React.useState<Option[]>([])
  const [amenityOptions, setAmenityOptions] = React.useState<Option[]>([])

  React.useEffect(() => {
    setSearchTerm(initialSearchTerm)
    setSelectedCities(initialCities)
    setSelectedCategories(initialCategories)
    setSelectedAmenities(initialAmenities)
  }, [initialSearchTerm, initialCities, initialCategories, initialAmenities])

  React.useEffect(() => {
    let cancelled = false
    const controller = new AbortController()
    const signal = controller.signal

    async function loadFilters() {
      try {
        const [citiesRes, categoriesRes, amenitiesRes] = await Promise.all([
          fetch('/api/cities', { signal })
            .then((response) => (response.ok ? (response.json() as Promise<CityResponse>) : Promise.reject(response.statusText)))
            .catch((): CityResponse => ({ cities: [] })),
          fetch('/api/categories', { signal })
            .then((response) => (response.ok ? (response.json() as Promise<CategoryResponse>) : Promise.reject(response.statusText)))
            .catch((): CategoryResponse => ({ categories: [] })),
          fetch('/api/amenities', { signal })
            .then((response) => (response.ok ? (response.json() as Promise<AmenityResponse>) : Promise.reject(response.statusText)))
            .catch((): AmenityResponse => ({ amenities: [] })),
        ])
        if (cancelled) return

        const unwrap = <T extends Record<string, unknown>>(payload: unknown): T | undefined => {
          if (!payload || typeof payload !== 'object') return undefined
          const dataField = (payload as { data?: unknown }).data
          if (dataField && typeof dataField === 'object') {
            return dataField as T
          }
          return payload as T | undefined
        }

        const citiesPayload = unwrap<CityResponse>(citiesRes)
        const categoriesPayload = unwrap<CategoryResponse>(categoriesRes)
        const amenitiesPayload = unwrap<AmenityResponse>(amenitiesRes)

        const cities = Array.isArray(citiesPayload?.cities) ? (citiesPayload.cities as City[]) : []
        const cityOpts: Option[] = Array.from(
          new Map(
            cities
              .filter((city): city is City => typeof city?.name === 'string' && city.name.trim().length > 0)
              .map((city) => {
                const name = city.name.trim()
                const value = name
                return [value, { value, label: name, icon: MapPin } as Option] as const
              })
          ).values()
        ).sort((a, b) => a.label.localeCompare(b.label))
        setCityOptions(cityOpts)

        const categories = Array.isArray(categoriesPayload?.categories)
          ? (categoriesPayload.categories as string[])
          : []
        const categoryOpts: Option[] = Array.from(
          new Set(
            categories
              .map((category) => (typeof category === 'string' ? category.trim() : ''))
              .filter(Boolean) as string[]
          )
        )
          .map((category) => ({
            value: category,
            label: category[0].toUpperCase() + category.slice(1),
            icon: category.toLowerCase().includes('work') ? Building2 : Home,
          }))
          .sort((a, b) => a.label.localeCompare(b.label))
        setCategoryOptions(categoryOpts)

        const amenities = Array.isArray(amenitiesPayload?.amenities)
          ? (amenitiesPayload.amenities as unknown[])
          : []
        const amenityOpts: Option[] = Array.from(
          new Map(
            amenities
              .filter((amenity): amenity is Amenity => {
                if (typeof amenity !== 'object' || amenity === null) return false
                const entry = amenity as Record<string, unknown>
                return typeof entry.name === 'string' && entry.name.trim().length > 0
              })
              .map((amenity) => {
                const name = amenity.name.trim()
                const lower = name.toLowerCase()
                const icon =
                  lower.includes('wifi') ? Wifi :
                  lower.includes('security') ? Shield :
                  lower.includes('key') ? Key : Wifi
                return [name, { value: name, label: name, icon } as Option] as const
              })
          ).values()
        ).sort((a, b) => a.label.localeCompare(b.label))
        setAmenityOptions(amenityOpts)
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Failed to load filter metadata', error)
        }
      }
    }

    loadFilters()
    return () => {
      cancelled = true
      controller.abort()
    }
  }, [])

  const handleSearch = React.useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      const params = recordToParams(initialParams)
      const keysToReset = ['q', 'destination', 'category', 'amenities', 'page'] as const
      keysToReset.forEach((key) => params.delete(key))

      const trimmedQuery = searchTerm.trim()
      if (trimmedQuery) params.set('q', trimmedQuery)
      selectedCities.forEach((city) => params.append('destination', city))
      selectedCategories.forEach((category) => params.append('category', category))
      selectedAmenities.forEach((amenity) => params.append('amenities', amenity))

      params.set('page', '1')
      if (!params.has('limit') && initialLimit) params.set('limit', initialLimit)
      params.set('facets', '1')

      const query = params.toString()
      router.push(query ? `${resultsPath}?${query}` : resultsPath)
    },
    [initialParams, initialLimit, resultsPath, router, searchTerm, selectedAmenities, selectedCategories, selectedCities]
  )

  const formClassName = className ? `max-w-2xl mx-auto ${className}` : 'max-w-2xl mx-auto'

  return (
    <form onSubmit={handleSearch} className={formClassName}>
      <div className="relative">
        <label htmlFor="search-page-input" className="sr-only">Search venues</label>
        <Search
          aria-hidden="true"
          focusable="false"
          className="absolute left-4 top-1/2 -translate-y-1/2 transform text-neo-text-secondary"
          size={20}
        />
        <NeoInput
          id="search-page-input"
          placeholder="Search by name, city, or amenities"
          className="h-16 pl-12 pr-16 text-lg"
          type="search"
          name="q"
          autoComplete="on"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
        <NeoButton
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 transform"
          size="md"
        >
          Search
        </NeoButton>
      </div>
      <div className="mt-4 flex flex-wrap gap-4">
        <FilterMultiSelect
          label="Select cities"
          options={cityOptions}
          selected={selectedCities}
          onChange={setSelectedCities}
          triggerIcon={MapPin}
        />
        <FilterMultiSelect
          label="Select workspace types"
          options={categoryOptions}
          selected={selectedCategories}
          onChange={setSelectedCategories}
          triggerIcon={Building2}
        />
        <FilterMultiSelect
          label="Select amenities"
          options={amenityOptions}
          selected={selectedAmenities}
          onChange={setSelectedAmenities}
          triggerIcon={Wifi}
        />
      </div>
    </form>
  )
}
