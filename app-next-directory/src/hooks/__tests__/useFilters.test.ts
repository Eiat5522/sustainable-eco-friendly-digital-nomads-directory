/**
 * @jest-environment jsdom
 */
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import { useFilters, FilterDefinition } from '../useFilters';

describe('useFilters', () => {
  const mockDefinitions: FilterDefinition[] = [
    {
      id: 'category',
      label: 'Category',
      options: [
        { id: 'cafe', label: 'Cafe', count: 5 },
        { id: 'coworking', label: 'Coworking', count: 3 },
        { id: 'accommodation', label: 'Accommodation', count: 8 },
      ],
      multiSelect: true,
    },
    {
      id: 'price',
      label: 'Price Range',
      options: [
        { id: 'budget', label: 'Budget', count: 10 },
        { id: 'mid', label: 'Mid-range', count: 15 },
        { id: 'luxury', label: 'Luxury', count: 7 },
      ],
      multiSelect: false,
    },
  ];

  let mockOnFilterChange: jest.MockedFunction<(filters: { [groupId: string]: string[] }) => void>;

  beforeEach(() => {
    mockOnFilterChange = jest.fn();
  });

  describe('initialization', () => {
    it('should initialize with empty filters when no initial filters provided', () => {
      const { result } = renderHook(() =>
        useFilters({ definitions: mockDefinitions })
      );

      expect(result.current.activeFilters).toEqual({});
      expect(result.current.activeFilterCount).toBe(0);
    });

    it('should initialize with provided initial filters', () => {
      const initialFilters = {
        category: ['cafe', 'coworking'],
        price: ['mid'],
      };

      const { result } = renderHook(() =>
        useFilters({
          definitions: mockDefinitions,
          initialFilters,
        })
      );

      expect(result.current.activeFilters).toEqual(initialFilters);
      expect(result.current.activeFilterCount).toBe(3);
    });
  });

  describe('toggleFilter', () => {
    it('should add filter when not present (multiSelect)', () => {
      const { result } = renderHook(() =>
        useFilters({
          definitions: mockDefinitions,
          onFilterChange: mockOnFilterChange,
        })
      );

      act(() => {
        result.current.toggleFilter('category', 'cafe');
      });

      expect(result.current.activeFilters).toEqual({
        category: ['cafe'],
      });
      expect(mockOnFilterChange).toHaveBeenCalledWith({
        category: ['cafe'],
      });
    });

    it('should remove filter when present (multiSelect)', () => {
      const { result } = renderHook(() =>
        useFilters({
          definitions: mockDefinitions,
          initialFilters: { category: ['cafe', 'coworking'] },
          onFilterChange: mockOnFilterChange,
        })
      );

      act(() => {
        result.current.toggleFilter('category', 'cafe');
      });

      expect(result.current.activeFilters).toEqual({
        category: ['coworking'],
      });
      expect(mockOnFilterChange).toHaveBeenCalledWith({
        category: ['coworking'],
      });
    });

    it('should add multiple filters (multiSelect)', () => {
      const { result } = renderHook(() =>
        useFilters({
          definitions: mockDefinitions,
          initialFilters: { category: ['cafe'] },
          onFilterChange: mockOnFilterChange,
        })
      );

      act(() => {
        result.current.toggleFilter('category', 'coworking');
      });

      expect(result.current.activeFilters).toEqual({
        category: ['cafe', 'coworking'],
      });
    });

    it('should replace filter when not multiSelect', () => {
      const { result } = renderHook(() =>
        useFilters({
          definitions: mockDefinitions,
          onFilterChange: mockOnFilterChange,
        })
      );

      act(() => {
        result.current.toggleFilter('price', 'budget');
      });

      expect(result.current.activeFilters).toEqual({
        price: ['budget'],
      });

      act(() => {
        result.current.toggleFilter('price', 'luxury');
      });

      expect(result.current.activeFilters).toEqual({
        price: ['luxury'],
      });
    });

    it('should remove filter when same option toggled (not multiSelect)', () => {
      const { result } = renderHook(() =>
        useFilters({
          definitions: mockDefinitions,
          initialFilters: { price: ['budget'] },
          onFilterChange: mockOnFilterChange,
        })
      );

      act(() => {
        result.current.toggleFilter('price', 'budget');
      });

      expect(result.current.activeFilters).toEqual({
        price: [],
      });
    });
  });

  describe('clearFilters', () => {
    it('should clear all filters', () => {
      const { result } = renderHook(() =>
        useFilters({
          definitions: mockDefinitions,
          initialFilters: {
            category: ['cafe', 'coworking'],
            price: ['mid'],
          },
          onFilterChange: mockOnFilterChange,
        })
      );

      act(() => {
        result.current.clearFilters();
      });

      expect(result.current.activeFilters).toEqual({});
      expect(result.current.activeFilterCount).toBe(0);
      expect(mockOnFilterChange).toHaveBeenCalledWith({});
    });
  });

  describe('helper functions', () => {
    it('should return active filters for a group', () => {
      const { result } = renderHook(() =>
        useFilters({
          definitions: mockDefinitions,
          initialFilters: {
            category: ['cafe', 'coworking'],
            price: ['mid'],
          },
        })
      );

      expect(result.current.getActiveFiltersForGroup('category')).toEqual(['cafe', 'coworking']);
      expect(result.current.getActiveFiltersForGroup('price')).toEqual(['mid']);
      expect(result.current.getActiveFiltersForGroup('nonexistent')).toEqual([]);
    });

    it('should check if option is active', () => {
      const { result } = renderHook(() =>
        useFilters({
          definitions: mockDefinitions,
          initialFilters: {
            category: ['cafe', 'coworking'],
            price: ['mid'],
          },
        })
      );

      expect(result.current.isOptionActive('category', 'cafe')).toBe(true);
      expect(result.current.isOptionActive('category', 'accommodation')).toBe(false);
      expect(result.current.isOptionActive('price', 'mid')).toBe(true);
      expect(result.current.isOptionActive('price', 'budget')).toBe(false);
      expect(result.current.isOptionActive('nonexistent', 'option')).toBe(false);
    });

    it('should return active filter labels', () => {
      const { result } = renderHook(() =>
        useFilters({
          definitions: mockDefinitions,
          initialFilters: {
            category: ['cafe', 'coworking'],
            price: ['mid'],
          },
        })
      );

      const labels = result.current.getActiveFilterLabels();
      expect(labels).toHaveLength(3);
      expect(labels).toContainEqual({
        groupId: 'category',
        optionId: 'cafe',
        label: 'Cafe',
      });
      expect(labels).toContainEqual({
        groupId: 'category',
        optionId: 'coworking',
        label: 'Coworking',
      });
      expect(labels).toContainEqual({
        groupId: 'price',
        optionId: 'mid',
        label: 'Mid-range',
      });
    });

    it('should handle missing options when getting labels', () => {
      const { result } = renderHook(() =>
        useFilters({
          definitions: mockDefinitions,
          initialFilters: {
            category: ['nonexistent'],
          },
        })
      );

      const labels = result.current.getActiveFilterLabels();
      expect(labels).toHaveLength(0);
    });
  });

  describe('activeFilterCount', () => {
    it('should count total active filters across all groups', () => {
      const { result } = renderHook(() =>
        useFilters({
          definitions: mockDefinitions,
          initialFilters: {
            category: ['cafe', 'coworking', 'accommodation'],
            price: ['mid'],
          },
        })
      );

      expect(result.current.activeFilterCount).toBe(4);
    });

    it('should update count when filters change', () => {
      const { result } = renderHook(() =>
        useFilters({
          definitions: mockDefinitions,
          initialFilters: {
            category: ['cafe'],
          },
        })
      );

      expect(result.current.activeFilterCount).toBe(1);

      act(() => {
        result.current.toggleFilter('category', 'coworking');
      });

      expect(result.current.activeFilterCount).toBe(2);

      act(() => {
        result.current.toggleFilter('price', 'budget');
      });

      expect(result.current.activeFilterCount).toBe(3);
    });
  });

  describe('onFilterChange callback', () => {
    it('should not call callback when not provided', () => {
      const { result } = renderHook(() =>
        useFilters({ definitions: mockDefinitions })
      );

      act(() => {
        result.current.toggleFilter('category', 'cafe');
      });

      // Should not throw error
      expect(result.current.activeFilters).toEqual({
        category: ['cafe'],
      });
    });

    it('should call callback with updated filters', () => {
      const { result } = renderHook(() =>
        useFilters({
          definitions: mockDefinitions,
          onFilterChange: mockOnFilterChange,
        })
      );

      act(() => {
        result.current.toggleFilter('category', 'cafe');
      });

      expect(mockOnFilterChange).toHaveBeenCalledWith({
        category: ['cafe'],
      });

      act(() => {
        result.current.toggleFilter('price', 'budget');
      });

      expect(mockOnFilterChange).toHaveBeenCalledWith({
        category: ['cafe'],
        price: ['budget'],
      });
    });
  });
});
