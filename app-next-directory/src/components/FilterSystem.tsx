'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DOMPurify from 'dompurify';
interface FilterOption {
  id: string;
  label: string;
  count?: number;
  icon?: string; // SVG icon string
  ecoImpact?: 'high' | 'medium' | 'low'; // Eco-impact rating
}

interface FilterGroup {
  id: string;
  label: string;
  options: FilterOption[];
  multiSelect?: boolean;
  icon?: string; // SVG icon string
}

interface FilterSystemProps {
  groups: FilterGroup[];
  onFilterChange: (filters: { [groupId: string]: string[] }) => void;
  className?: string;
  initialFilters?: { [groupId: string]: string[] };
}

// SVG icons for common filter categories
// Note: icons package currently exports only a subset; provide fallbacks
import { LeafIcon as AmenitiesIcon } from './icons';
import { LeafIcon as SustainabilityIcon } from './icons';
import { MapPinIcon as LocationIcon } from './icons';
import { LeafIcon as PriceIcon } from './icons';

const filterIcons: Record<string, React.ComponentType> = {
  amenities: AmenitiesIcon,
  sustainability: SustainabilityIcon,
  location: LocationIcon,
  price: PriceIcon,
};

// Helper to get icon component by key
const getIconComponent = (key: string) => filterIcons[key];
const ecoImpactColors = {
  high: 'bg-primary-500',
  medium: 'bg-primary-400',
  low: 'bg-primary-300',
};

export function FilterSystem({
  groups,
  onFilterChange,
  className = '',
  initialFilters = {},
}: FilterSystemProps) {
  const [activeFilters, setActiveFilters] = useState<{ [groupId: string]: string[] }>(
    initialFilters
  );
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    onFilterChange(activeFilters);
}, [activeFilters, onFilterChange]);

    const toggleFilter = (groupId: string, optionId: string) => {
    setActiveFilters(prev => {
      const group = groups.find(g => g.id === groupId);
      if (!group) {
        return prev;
      }
      const currentFilters = prev[groupId] || [];
      let newFilters: string[];

      if (group.multiSelect) {
        // For multi-select groups, toggle the option
        newFilters = currentFilters.includes(optionId)
          ? currentFilters.filter(id => id !== optionId)
          : [...currentFilters, optionId];
      } else {
        // For single-select groups, replace the current selection
        newFilters = currentFilters.includes(optionId) ? [] : [optionId];
      }

      return { ...prev, [groupId]: newFilters };
    });
  };

  const toggleGroup = (groupId: string) => {
    setOpenGroup(openGroup === groupId ? null : groupId);
  };

  const clearAll = () => {
    setActiveFilters({});
  };

  const getActiveFilterCount = () => {
    return Object.values(activeFilters).reduce((count, filters) => count + filters.length, 0);
  };
  // Helper to render SVG icons safely
  const renderIcon = (iconString?: string) => {
    if (!iconString) return null;
    // Only render on client side to avoid hydration mismatches
    if (typeof window === 'undefined') return null;
    const sanitized = DOMPurify.sanitize(iconString, { USE_PROFILES: { svg: true } });
    
    // Additional validation to ensure we have valid SVG content
    if (!sanitized.trim()) return null;
    return (
      <svg
        className="icon w-5 h-5"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
        focusable="false"
        suppressHydrationWarning
        // Safe to use dangerouslySetInnerHTML here because content is sanitized by DOMPurify
        dangerouslySetInnerHTML={{ __html: sanitized }}
      />
    );
  };

  return (
    <div className={`filter-system ${className}`}>
      {/* Desktop view */}
      <div className="hidden lg:block bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
            <svg
              className="icon w-5 h-5 mr-2 text-primary-500"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M14,12V19.88C14.04,20.18 13.94,20.5 13.71,20.71C13.32,21.1 12.69,21.1 12.3,20.71L10.29,18.7C10.06,18.47 9.96,18.16 10,17.87V12H9.97L4.21,4.62C3.87,4.19 3.95,3.56 4.38,3.22C4.57,3.08 4.78,3 5,3H19C19.22,3 19.43,3.08 19.62,3.22C20.05,3.56 20.13,4.19 19.79,4.62L14.03,12H14Z" />
            </svg>
            Filters
          </h2>

          {getActiveFilterCount() > 0 && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 font-medium"
              onClick={clearAll}
            >
              Clear all
            </motion.button>
          )}
        </div>

        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {groups.map(group => {
            const isOpen = openGroup === group.id;
            const activeOptions = activeFilters[group.id] || [];

            return (
              <div key={group.id} className="filter-group">
                <button
                  className="w-full flex justify-between items-center p-4 hover:bg-gray-50 dark:hover:bg-gray-750 text-left"
                  onClick={() => toggleGroup(group.id)}
                >
                  <div className="flex items-center">
                    {group.icon && (
                      <span className="mr-2 text-primary-500">{renderIcon(group.icon)}</span>
                    )}
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {group.label}
                    </span>
                  </div>

                  <div className="flex items-center">
                    {activeOptions.length > 0 && (
                      <span className="mr-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200">
                        {activeOptions.length}
                      </span>
                    )}
                    <svg
                      className={`icon w-5 h-5 text-gray-500 transition-transform ${isOpen ? 'transform rotate-180' : ''}`}
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 pt-0 bg-gray-50 dark:bg-gray-750/50">
                        <div className="space-y-2">
                          {group.options.map(option => {
                            const isActive = activeOptions.includes(option.id);

                            return (
                              <div key={option.id} className="flex items-center">
                                <button
                                  type="button"
                                  className={`flex items-center justify-between w-full px-3 py-2 text-sm rounded-lg ${
                                    isActive
                                      ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-medium'
                                      : 'hover:bg-gray-100 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300'
                                  }`}
                                  onClick={() => toggleFilter(group.id, option.id)}
                                  role={group.multiSelect ? 'checkbox' : 'radio'}
                                  aria-checked={isActive}
                                  tabIndex={0}
                                >
                                  <div className="flex items-center">
                                    {/* Custom checkbox */}
                                    <div
                                      className={`w-5 h-5 flex items-center justify-center rounded border mr-3 transition-colors ${
                                        isActive
                                          ? 'bg-primary-500 border-primary-500'
                                          : 'border-gray-300 dark:border-gray-600'
                                      }`}
                                      aria-hidden="true"
                                    >
                                      {isActive && (
                                        <motion.svg
                                          initial={{ scale: 0 }}
                                          animate={{ scale: 1 }}
                                          className="w-3 h-3 text-white"
                                          viewBox="0 0 20 20"
                                          fill="currentColor"
                                          aria-hidden="true"
                                          focusable="false"
                                        >
                                          <path
                                            fillRule="evenodd"
                                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                            clipRule="evenodd"
                                          />
                                        </motion.svg>
                                      )}
                                    </div>

                                    {option.icon && (
                                      <span className="mr-2 text-gray-500">
                                        {renderIcon(option.icon)}
                                      </span>
                                    )}

                                    <span>{option.label}</span>

                                    {/* Eco impact indicator */}
                                    {option.ecoImpact && (
                                      <span
                                        className={`ml-2 w-2 h-2 rounded-full ${ecoImpactColors[option.ecoImpact]}`}
                                      ></span>
                                    )}
                                  </div>

                                  {option.count !== undefined && (
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      {option.count}
                                    </span>
                                  )}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile view - filter button */}
      <div className="lg:hidden">
        <button
          className="fixed z-40 bottom-6 right-6 w-14 h-14 rounded-full bg-primary-500 text-white shadow-lg flex items-center justify-center"
          onClick={() => setMobileFiltersOpen(true)}
        >
          <svg className="icon w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
            />
          </svg>
        </button>

        {/* Mobile filters modal */}
        <AnimatePresence>
          {mobileFiltersOpen && (
            <motion.div
              className="fixed inset-0 z-50 overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div
                className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm"
                onClick={() => setMobileFiltersOpen(false)}
              ></div>

              <motion.div
                className="absolute inset-y-0 right-0 max-w-full flex"
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              >
                <div className="w-screen max-w-md">
                  <div className="h-full flex flex-col bg-white dark:bg-gray-800 shadow-xl overflow-y-auto">
                    <div className="flex-1 overflow-y-auto py-6 px-4">
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                          <svg
                            className="icon w-5 h-5 mr-2 text-primary-500"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            aria-hidden="true"
                          >
                            <path d="M14,12V19.88C14.04,20.18 13.94,20.5 13.71,20.71C13.32,21.1 12.69,21.1 12.3,20.71L10.29,18.7C10.06,18.47 9.96,18.16 10,17.87V12H9.97L4.21,4.62C3.87,4.19 3.95,3.56 4.38,3.22C4.57,3.08 4.78,3 5,3H19C19.22,3 19.43,3.08 19.62,3.22C20.05,3.56 20.13,4.19 19.79,4.62L14.03,12H14Z" />
                          </svg>
                          Filters
                        </h2>
                        <button
                          className="-mr-2 w-10 h-10 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                          onClick={() => setMobileFiltersOpen(false)}
                          aria-label="Close menu"
                        >
                          <span className="sr-only">Close menu</span>
                          <svg
                            className="icon h-6 w-6"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            aria-hidden="true"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>

                      {getActiveFilterCount() > 0 && (
                        <div className="mb-6 flex">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="flex items-center justify-center w-full px-4 py-2 rounded-lg bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-300"
                            onClick={clearAll}
                          >
                            <svg
                              className="icon w-4 h-4 mr-2"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              aria-hidden="true"
                            >
                              <path
                                fillRule="evenodd"
                                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Clear all filters ({getActiveFilterCount()})
                          </motion.button>
                        </div>
                      )}

                      {/* Mobile filter groups */}
                      <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {groups.map(group => {
                          const activeOptions = activeFilters[group.id] || [];
                          return (
                            <div key={group.id} className="py-6">
                              <h3 className="flow-root">
                                <button
                                  type="button"
                                  className="flex w-full items-center justify-between py-3 text-sm text-gray-400 hover:text-gray-500"
                                  onClick={() => toggleGroup(group.id)}
                                >
                                  <div className="flex items-center">
                                    {group.icon && (
                                      <span className="mr-3 text-primary-500">
                                        {renderIcon(group.icon)}
                                      </span>
                                    )}
                                    <span className="font-medium text-gray-900 dark:text-white">
                                      {group.label}
                                    </span>

                                    {activeOptions.length > 0 && (
                                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200">
                                        {activeOptions.length}
                                      </span>
                                    )}
                                  </div>
                                  <span className="ml-6 flex items-center">
                                    <svg
                                      className={`icon h-5 w-5 transition-transform ${openGroup === group.id ? 'rotate-180' : ''}`}
                                      viewBox="0 0 20 20"
                                      fill="currentColor"
                                      aria-hidden="true"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                  </span>
                                </button>
                              </h3>

                              <AnimatePresence>
                                {openGroup === group.id && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="mt-2 overflow-hidden"
                                  >
                                    <div className="space-y-4 px-1">
                                      {group.options.map(option => {
                                        const isActive = activeOptions.includes(option.id);

                                        return (
                                          <div key={option.id} className="flex items-center">
                                            <button
                                              className={`flex items-center justify-between w-full py-2 text-sm ${
                                                isActive
                                                  ? 'text-primary-600 dark:text-primary-400 font-medium'
                                                  : 'text-gray-700 dark:text-gray-300'
                                              }`}
                                              onClick={() => toggleFilter(group.id, option.id)}
                                            >
                                              <div className="flex items-center">
                                                {/* Custom checkbox */}
                                                <div
                                                  className={`w-5 h-5 flex items-center justify-center rounded border mr-3 transition-colors ${
                                                    isActive
                                                      ? 'bg-primary-500 border-primary-500'
                                                      : 'border-gray-300 dark:border-gray-600'
                                                  }`}
                                                  aria-hidden="true"
                                                >
                                                  {isActive && (
                                                    <motion.svg
                                                      initial={{ scale: 0 }}
                                                      animate={{ scale: 1 }}
                                                      className="w-3 h-3 text-white"
                                                      viewBox="0 0 20 20"
                                                      fill="currentColor"
                                                    >
                                                      <path
                                                        fillRule="evenodd"
                                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                        clipRule="evenodd"
                                                      />
                                                    </motion.svg>
                                                  )}
                                                </div>

                                                {option.icon && (
                                                  <span className="mr-2 text-gray-400">
                                                    {renderIcon(option.icon)}
                                                  </span>
                                                )}

                                                <span>{option.label}</span>
                                              </div>

                                              {option.count !== undefined && (
                                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                                  {option.count}
                                                </span>
                                              )}
                                            </button>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-700 py-4 px-4">
                      <button
                        type="button"
                        className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-primary-500 hover:bg-primary-600"
                        onClick={() => setMobileFiltersOpen(false)}
                      >
                        Apply filters ({getActiveFilterCount()})
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Active filter summary */}
      {getActiveFilterCount() > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {Object.entries(activeFilters).map(([groupId, optionIds]) => {
            const group = groups.find(g => g.id === groupId);
            if (!group || optionIds.length === 0) return null;

            return optionIds.map(optionId => {
              const option = group.options.find(o => o.id === optionId);
              if (!option) return null;

              return (
                <motion.div
                  key={`${groupId}-${optionId}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="inline-flex items-center px-3 py-1.5 rounded-full bg-primary-50 dark:bg-primary-900/30 border border-primary-100 dark:border-primary-800"
                >
                  <span className="text-sm text-primary-700 dark:text-primary-300 mr-1">
                    {option.label}
                  </span>
                  <button
                    type="button"
                    aria-label={`Remove ${option.label}`}
                    className="flex-shrink-0 ml-1 text-primary-500 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-200 focus:outline-none"
                    onClick={() => toggleFilter(groupId, optionId)}
                  >
                    <svg className="icon h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </motion.div>
              );
            });
          })}
        </div>
      )}
    </div>
  );
}
