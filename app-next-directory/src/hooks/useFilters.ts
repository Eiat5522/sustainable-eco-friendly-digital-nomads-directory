import { useState, useCallback, useMemo } from 'react'

export interface FilterDefinition {
  id: string
  label: string
  options: {
    id: string
    label: string
    count?: number
  }[]
  multiSelect?: boolean
}

export interface UseFiltersOptions {
  definitions: FilterDefinition[]
  initialFilters?: { [groupId: string]: string[] }
  onFilterChange?: (filters: { [groupId: string]: string[] }) => void
}

export function useFilters({
  definitions,
  initialFilters = {},
  onFilterChange,
}: UseFiltersOptions) {
  const [activeFilters, setActiveFilters] = useState<{ [groupId: string]: string[] }>(initialFilters)

  const toggleFilter = useCallback(
    (groupId: string, optionId: string) => {
      setActiveFilters((prev) => {
        const group = definitions.find((d) => d.id === groupId)
        const currentFilters = prev[groupId] || []
        let newFilters: string[]

        if (group?.multiSelect) {
          newFilters = currentFilters.includes(optionId)
            ? currentFilters.filter((id) => id !== optionId)
            : [...currentFilters, optionId]
        } else {
          newFilters = currentFilters.includes(optionId) ? [] : [optionId]
        }

        const updatedFilters = {
          ...prev,
          [groupId]: newFilters,
        }

        onFilterChange?.(updatedFilters)
        return updatedFilters
      })
    },
    [definitions, onFilterChange]
  )

  const clearFilters = useCallback(() => {
    setActiveFilters({})
    onFilterChange?.({})
  }, [onFilterChange])

  const activeFilterCount = useMemo(
    () => Object.values(activeFilters).reduce((sum, filters) => sum + filters.length, 0),
    [activeFilters]
  )

  const getActiveFiltersForGroup = useCallback(
    (groupId: string) => activeFilters[groupId] || [],
    [activeFilters]
  )

  const isOptionActive = useCallback(
    (groupId: string, optionId: string) => {
      return activeFilters[groupId]?.includes(optionId) || false
    },
    [activeFilters]
  )

  const getActiveFilterLabels = useCallback(() => {
    return Object.entries(activeFilters).flatMap(([groupId, optionIds]) => {
      const group = definitions.find((d) => d.id === groupId)
      return optionIds.map((optionId) => {
        const option = group?.options.find((o) => o.id === optionId)
        return option ? { groupId, optionId, label: option.label } : null
      })
    }).filter((item): item is NonNullable<typeof item> => item !== null)
  }, [activeFilters, definitions])

  return {
    activeFilters,
    activeFilterCount,
    toggleFilter,
    clearFilters,
    getActiveFiltersForGroup,
    isOptionActive,
    getActiveFilterLabels,
  }
}
