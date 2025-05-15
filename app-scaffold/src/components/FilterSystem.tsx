import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface FilterOption {
  id: string
  label: string
  count?: number
}

interface FilterGroup {
  id: string
  label: string
  options: FilterOption[]
  multiSelect?: boolean
}

interface FilterSystemProps {
  groups: FilterGroup[]
  onFilterChange: (filters: { [groupId: string]: string[] }) => void
  className?: string
  initialFilters?: { [groupId: string]: string[] }
}

export function FilterSystem({
  groups,
  onFilterChange,
  className = '',
  initialFilters = {},
}: FilterSystemProps) {
  const [activeFilters, setActiveFilters] = useState<{ [groupId: string]: string[] }>(initialFilters)
  const [openGroup, setOpenGroup] = useState<string | null>(null)

  useEffect(() => {
    onFilterChange(activeFilters)
  }, [activeFilters, onFilterChange])

  const toggleFilter = (groupId: string, optionId: string) => {
    setActiveFilters((prev) => {
      const group = groups.find((g) => g.id === groupId)
      const currentFilters = prev[groupId] || []
      let newFilters: string[]

      if (group?.multiSelect) {
        // For multi-select groups, toggle the option
        newFilters = currentFilters.includes(optionId)
          ? currentFilters.filter((id) => id !== optionId)
          : [...currentFilters, optionId]
      } else {
        // For single-select groups, replace the current selection
        newFilters = currentFilters.includes(optionId) ? [] : [optionId]
      }

      return {
        ...prev,
        [groupId]: newFilters,
      }
    })
  }

  const clearFilters = () => {
    setActiveFilters({})
  }

  const totalActiveFilters = Object.values(activeFilters).reduce(
    (sum, filters) => sum + filters.length,
    0
  )

  return (
    <div className={`w-full ${className}`}>
      {/* Filter Header */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Filters</h2>
        {totalActiveFilters > 0 && (
          <button
            onClick={clearFilters}
            className="text-sm text-green-600 hover:text-green-700"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Filter Groups */}
      <div className="space-y-4">
        {groups.map((group) => (
          <div key={group.id} className="rounded-lg border border-gray-200">
            <button
              onClick={() => setOpenGroup(openGroup === group.id ? null : group.id)}
              className="flex w-full items-center justify-between px-4 py-3 text-left"
            >
              <span className="font-medium text-gray-700">{group.label}</span>
              <span className="flex items-center">
                {activeFilters[group.id]?.length > 0 && (
                  <span className="mr-2 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800">
                    {activeFilters[group.id].length}
                  </span>
                )}
                <svg
                  className={`h-5 w-5 transform text-gray-500 transition-transform ${
                    openGroup === group.id ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </span>
            </button>

            <AnimatePresence>
              {openGroup === group.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-2 border-t border-gray-200 px-4 py-3">
                    {group.options.map((option) => (
                      <label
                        key={option.id}
                        className="flex cursor-pointer items-center space-x-3"
                      >
                        <input
                          type={group.multiSelect ? 'checkbox' : 'radio'}
                          checked={activeFilters[group.id]?.includes(option.id) || false}
                          onChange={() => toggleFilter(group.id, option.id)}
                          className={`h-4 w-4 ${
                            group.multiSelect
                              ? 'rounded border-gray-300 text-green-600 focus:ring-green-500'
                              : 'border-gray-300 text-green-600 focus:ring-green-500'
                          }`}
                        />
                        <span className="flex flex-1 items-center justify-between text-sm text-gray-700">
                          {option.label}
                          {option.count !== undefined && (
                            <span className="text-xs text-gray-500">{option.count}</span>
                          )}
                        </span>
                      </label>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* Active Filters Tags */}
      <div className="mt-4 flex flex-wrap gap-2">
        {Object.entries(activeFilters).map(([groupId, selectedOptions]) =>
          selectedOptions.map((optionId) => {
            const group = groups.find((g) => g.id === groupId)
            const option = group?.options.find((o) => o.id === optionId)
            if (!option) return null

            return (
              <motion.span
                key={`${groupId}-${optionId}`}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm text-green-800"
              >
                {option.label}
                <button
                  onClick={() => toggleFilter(groupId, optionId)}
                  className="ml-2 text-green-600 hover:text-green-700"
                >
                  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </motion.span>
            )
          })
        )}
      </div>
    </div>
  )
}
