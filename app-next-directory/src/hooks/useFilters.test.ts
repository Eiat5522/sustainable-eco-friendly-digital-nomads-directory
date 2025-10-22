import { renderHook, act } from '@testing-library/react'
import { useFilters, FilterDefinition } from './useFilters'

const definitions: FilterDefinition[] = [
  {
    id: 'category',
    label: 'Category',
    options: [
      { id: 'cafe', label: 'Cafe' },
      { id: 'coworking', label: 'Coworking' },
    ],
  },
  {
    id: 'amenities',
    label: 'Amenities',
    options: [
      { id: 'wifi', label: 'Wi-Fi' },
      { id: 'coffee', label: 'Coffee' },
    ],
    multiSelect: true,
  },
]

describe('useFilters', () => {
  it('should initialize with no active filters', () => {
    const { result } = renderHook(() => useFilters({ definitions }))
    expect(result.current.activeFilters).toEqual({})
    expect(result.current.activeFilterCount).toBe(0)
  })

  it('should initialize with initial filters', () => {
    const initialFilters = { category: ['cafe'] }
    const { result } = renderHook(() =>
      useFilters({ definitions, initialFilters })
    )
    expect(result.current.activeFilters).toEqual(initialFilters)
    expect(result.current.activeFilterCount).toBe(1)
  })

  it('should toggle a single-select filter', () => {
    const { result } = renderHook(() => useFilters({ definitions }))

    act(() => {
      result.current.toggleFilter('category', 'cafe')
    })
    expect(result.current.activeFilters).toEqual({ category: ['cafe'] })

    act(() => {
      result.current.toggleFilter('category', 'coworking')
    })
    expect(result.current.activeFilters).toEqual({ category: ['coworking'] })

    act(() => {
      result.current.toggleFilter('category', 'coworking')
    })
    expect(result.current.activeFilters).toEqual({ category: [] })
  })

  it('should toggle a multi-select filter', () => {
    const { result } = renderHook(() => useFilters({ definitions }))

    act(() => {
      result.current.toggleFilter('amenities', 'wifi')
    })
    expect(result.current.activeFilters).toEqual({ amenities: ['wifi'] })

    act(() => {
      result.current.toggleFilter('amenities', 'coffee')
    })
    expect(result.current.activeFilters).toEqual({
      amenities: ['wifi', 'coffee'],
    })

    act(() => {
      result.current.toggleFilter('amenities', 'wifi')
    })
    expect(result.current.activeFilters).toEqual({ amenities: ['coffee'] })
  })

  it('should clear all filters', () => {
    const initialFilters = { category: ['cafe'], amenities: ['wifi'] }
    const { result } = renderHook(() =>
      useFilters({ definitions, initialFilters })
    )

    act(() => {
      result.current.clearFilters()
    })
    expect(result.current.activeFilters).toEqual({})
  })

  it('should call onFilterChange when filters change', () => {
    const onFilterChange = jest.fn()
    const { result } = renderHook(() =>
      useFilters({ definitions, onFilterChange })
    )

    act(() => {
      result.current.toggleFilter('category', 'cafe')
    })
    expect(onFilterChange).toHaveBeenCalledWith({ category: ['cafe'] })

    act(() => {
      result.current.clearFilters()
    })
    expect(onFilterChange).toHaveBeenCalledWith({})
  })

  it('should return active filters for a group', () => {
    const initialFilters = { amenities: ['wifi', 'coffee'] }
    const { result } = renderHook(() =>
      useFilters({ definitions, initialFilters })
    )
    expect(result.current.getActiveFiltersForGroup('amenities')).toEqual([
      'wifi',
      'coffee',
    ])
    expect(result.current.getActiveFiltersForGroup('category')).toEqual([])
  })

  it('should check if an option is active', () => {
    const initialFilters = { amenities: ['wifi'] }
    const { result } = renderHook(() =>
      useFilters({ definitions, initialFilters })
    )
    expect(result.current.isOptionActive('amenities', 'wifi')).toBe(true)
    expect(result.current.isOptionActive('amenities', 'coffee')).toBe(false)
  })

  it('should return active filter labels', () => {
    const initialFilters = { category: ['cafe'], amenities: ['wifi'] }
    const { result } = renderHook(() =>
      useFilters({ definitions, initialFilters })
    )
    expect(result.current.getActiveFilterLabels()).toEqual([
      { groupId: 'category', optionId: 'cafe', label: 'Cafe' },
      { groupId: 'amenities', optionId: 'wifi', label: 'Wi-Fi' },
    ])
  })
})
