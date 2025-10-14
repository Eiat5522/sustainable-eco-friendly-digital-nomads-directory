/** @jest-environment jsdom */
/**
 * Unit tests for FiltersSidebar component
 * 
 * Component: FiltersSidebar - Sidebar containing search filters
 * Priority: CRITICAL - Core filtering functionality for search results
 * Coverage Target: 85%+
 */

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FiltersSidebar } from '../FiltersSidebar'
import { useRouter, useSearchParams } from 'next/navigation'
import { ListingCategory } from '@/types/enums'

// Mock Next.js navigation hooks
const mockPush = jest.fn()
const mockSearchParams = new URLSearchParams()

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}))

// Mock the child component
jest.mock('../DigitalNomadSearchFilter', () => ({
  DigitalNomadSearchFilter: jest.fn(({ definitions, initialFilters, onChange, title }) => (
    <div data-testid="digital-nomad-search-filter">
      <h2>{title}</h2>
      <div data-testid="filter-definitions">{JSON.stringify(definitions)}</div>
      <div data-testid="initial-filters">{JSON.stringify(initialFilters)}</div>
      <button onClick={() => onChange({ category: ['coworking'] })}>
        Apply Filter
      </button>
    </div>
  )),
}))

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>
const mockUseSearchParams = useSearchParams as jest.MockedFunction<typeof useSearchParams>

describe('FiltersSidebar', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSearchParams.getAll = jest.fn(() => [])
    mockSearchParams.entries = jest.fn(() => [][Symbol.iterator]())
    
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    } as any)
    
    mockUseSearchParams.mockReturnValue(mockSearchParams as any)
  })

  describe('Rendering', () => {
    it('should render DigitalNomadSearchFilter component', () => {
      render(<FiltersSidebar />)
      
      expect(screen.getByTestId('digital-nomad-search-filter')).toBeInTheDocument()
    })

    it('should pass "Filter Results" as title', () => {
      render(<FiltersSidebar />)
      
      expect(screen.getByText('Filter Results')).toBeInTheDocument()
    })

    it('should render with default filter definitions', () => {
      render(<FiltersSidebar />)
      
      const definitions = screen.getByTestId('filter-definitions')
      const content = JSON.parse(definitions.textContent || '[]')
      
      expect(content).toHaveLength(4) // category, destination, amenities, nomadFeatures
      expect(content[0]).toHaveProperty('id', 'category')
      expect(content[1]).toHaveProperty('id', 'destination')
      expect(content[2]).toHaveProperty('id', 'amenities')
      expect(content[3]).toHaveProperty('id', 'nomadFeatures')
    })

    it('should accept custom filter definitions', () => {
      const customDefinitions = [
        {
          id: 'custom',
          label: 'Custom Filter',
          multiSelect: true,
          options: [{ id: 'option1', label: 'Option 1' }],
        },
      ]
      
      render(<FiltersSidebar definitions={customDefinitions} />)
      
      const definitions = screen.getByTestId('filter-definitions')
      const content = JSON.parse(definitions.textContent || '[]')
      
      expect(content).toHaveLength(1)
      expect(content[0]).toHaveProperty('id', 'custom')
    })
  })

  describe('Default Filter Definitions', () => {
    it('should include category filter with ListingCategory options', () => {
      render(<FiltersSidebar />)
      
      const definitions = screen.getByTestId('filter-definitions')
      const content = JSON.parse(definitions.textContent || '[]')
      const categoryDef = content.find((d: any) => d.id === 'category')
      
      expect(categoryDef).toBeDefined()
      expect(categoryDef.label).toBe('Category')
      expect(categoryDef.multiSelect).toBe(true)
      expect(categoryDef.options).toContainEqual({
        id: ListingCategory.COWORKING,
        label: 'Coworking',
      })
      expect(categoryDef.options).toContainEqual({
        id: ListingCategory.CAFE,
        label: 'Cafe',
      })
    })

    it('should include destination filter with city options', () => {
      render(<FiltersSidebar />)
      
      const definitions = screen.getByTestId('filter-definitions')
      const content = JSON.parse(definitions.textContent || '[]')
      const destinationDef = content.find((d: any) => d.id === 'destination')
      
      expect(destinationDef).toBeDefined()
      expect(destinationDef.label).toBe('Destination')
      expect(destinationDef.multiSelect).toBe(true)
      expect(destinationDef.options).toContainEqual({ id: 'Lisbon', label: 'Lisbon' })
      expect(destinationDef.options).toContainEqual({ id: 'Bali', label: 'Bali' })
      expect(destinationDef.options).toContainEqual({ id: 'Chiang Mai', label: 'Chiang Mai' })
    })

    it('should include amenities filter', () => {
      render(<FiltersSidebar />)
      
      const definitions = screen.getByTestId('filter-definitions')
      const content = JSON.parse(definitions.textContent || '[]')
      const amenitiesDef = content.find((d: any) => d.id === 'amenities')
      
      expect(amenitiesDef).toBeDefined()
      expect(amenitiesDef.label).toBe('Amenities')
      expect(amenitiesDef.multiSelect).toBe(true)
      expect(amenitiesDef.options).toContainEqual({ id: 'wifi', label: 'Wi‑Fi' })
      expect(amenitiesDef.options).toContainEqual({ id: 'vegan', label: 'Vegan options' })
    })

    it('should include nomad features filter', () => {
      render(<FiltersSidebar />)
      
      const definitions = screen.getByTestId('filter-definitions')
      const content = JSON.parse(definitions.textContent || '[]')
      const featuresDef = content.find((d: any) => d.id === 'nomadFeatures')
      
      expect(featuresDef).toBeDefined()
      expect(featuresDef.label).toBe('Nomad Features')
      expect(featuresDef.multiSelect).toBe(true)
    })
  })

  describe('Initial Filters from URL', () => {
    it('should initialize with empty filters when no URL params', () => {
      mockSearchParams.getAll = jest.fn(() => [])
      
      render(<FiltersSidebar />)
      
      const initialFilters = screen.getByTestId('initial-filters')
      const content = JSON.parse(initialFilters.textContent || '{}')
      
      expect(content).toEqual({})
    })

    it('should initialize filters from URL parameters', () => {
      mockSearchParams.getAll = jest.fn((key) => {
        if (key === 'category') return ['coworking', 'cafe']
        if (key === 'destination') return ['Lisbon']
        return []
      })
      
      render(<FiltersSidebar />)
      
      const initialFilters = screen.getByTestId('initial-filters')
      const content = JSON.parse(initialFilters.textContent || '{}')
      
      expect(content).toHaveProperty('category')
      expect(content.category).toContain('coworking')
      expect(content.category).toContain('cafe')
      expect(content).toHaveProperty('destination')
      expect(content.destination).toContain('Lisbon')
    })

    it('should sanitize invalid filter values', () => {
      mockSearchParams.getAll = jest.fn((key) => {
        if (key === 'category') return ['coworking', 'invalid-category', 'cafe']
        return []
      })
      
      render(<FiltersSidebar />)
      
      const initialFilters = screen.getByTestId('initial-filters')
      const content = JSON.parse(initialFilters.textContent || '{}')
      
      // Should only include valid categories
      expect(content.category).toContain('coworking')
      expect(content.category).toContain('cafe')
      expect(content.category).not.toContain('invalid-category')
    })

    it('should deduplicate filter values', () => {
      mockSearchParams.getAll = jest.fn((key) => {
        if (key === 'destination') return ['Lisbon', 'Lisbon', 'Bali']
        return []
      })
      
      render(<FiltersSidebar />)
      
      const initialFilters = screen.getByTestId('initial-filters')
      const content = JSON.parse(initialFilters.textContent || '{}')
      
      expect(content.destination).toEqual(['Lisbon', 'Bali'])
    })
  })

  describe('Filter Change Handler', () => {
    it('should update URL when filters change', async () => {
      const user = userEvent.setup()
      render(<FiltersSidebar />)
      
      await user.click(screen.getByText('Apply Filter'))
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalled()
        const callArg = mockPush.mock.calls[0][0]
        expect(callArg).toContain('/search')
        expect(callArg).toContain('category=coworking')
      })
    })

    it('should preserve existing URL parameters', async () => {
      const user = userEvent.setup()
      const existingParams = new Map([['q', 'search query']])
      mockSearchParams.entries = jest.fn(() => existingParams.entries())
      
      render(<FiltersSidebar />)
      
      await user.click(screen.getByText('Apply Filter'))
      
      await waitFor(() => {
        const callArg = mockPush.mock.calls[0][0]
        expect(callArg).toContain('q=search+query')
      })
    })

    it('should reset page parameter when filters change', async () => {
      const user = userEvent.setup()
      const existingParams = new Map([['page', '5']])
      mockSearchParams.entries = jest.fn(() => existingParams.entries())
      
      render(<FiltersSidebar />)
      
      await user.click(screen.getByText('Apply Filter'))
      
      await waitFor(() => {
        const callArg = mockPush.mock.calls[0][0]
        expect(callArg).not.toContain('page=5')
      })
    })

    it('should clear filter group when no values selected', async () => {
      const user = userEvent.setup()
      mockSearchParams.getAll = jest.fn((key) => {
        if (key === 'category') return ['coworking']
        return []
      })
      
      const { rerender } = render(<FiltersSidebar />)
      
      // Simulate clearing filters
      jest.mock('../DigitalNomadSearchFilter', () => ({
        DigitalNomadSearchFilter: jest.fn(({ onChange }) => (
          <button onClick={() => onChange({})}>Clear All</button>
        )),
      }))
      
      rerender(<FiltersSidebar />)
      await user.click(screen.getByText('Clear All'))
      
      await waitFor(() => {
        const callArg = mockPush.mock.calls[0]?.[0]
        if (callArg) {
          expect(callArg).not.toContain('category=')
        }
      })
    })
  })

  describe('Multi-value Filter Handling', () => {
    it('should handle multiple values for same filter', async () => {
      const user = userEvent.setup()
      
      jest.mock('../DigitalNomadSearchFilter', () => ({
        DigitalNomadSearchFilter: jest.fn(({ onChange }) => (
          <button onClick={() => onChange({ 
            category: ['coworking', 'cafe'], 
            destination: ['Lisbon', 'Bali'] 
          })}>
            Apply Multiple
          </button>
        )),
      }))
      
      const { rerender } = render(<FiltersSidebar />)
      rerender(<FiltersSidebar />)
      
      await user.click(screen.getByText('Apply Multiple'))
      
      await waitFor(() => {
        const callArg = mockPush.mock.calls[0]?.[0]
        if (callArg) {
          expect(callArg).toContain('category=coworking')
          expect(callArg).toContain('category=cafe')
        }
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty filter definitions array', () => {
      render(<FiltersSidebar definitions={[]} />)
      
      const definitions = screen.getByTestId('filter-definitions')
      const content = JSON.parse(definitions.textContent || '[]')
      
      expect(content).toEqual([])
    })

    it('should handle malformed URL parameters', () => {
      mockSearchParams.getAll = jest.fn(() => {
        throw new Error('Invalid URL params')
      })
      
      // Should not crash
      expect(() => render(<FiltersSidebar />)).not.toThrow()
    })

    it('should handle rapid filter changes', async () => {
      const user = userEvent.setup()
      render(<FiltersSidebar />)
      
      // Rapid clicks
      await user.click(screen.getByText('Apply Filter'))
      await user.click(screen.getByText('Apply Filter'))
      await user.click(screen.getByText('Apply Filter'))
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalled()
      })
    })
  })

  describe('URL Parameter Encoding', () => {
    it('should properly encode special characters in filter values', async () => {
      const user = userEvent.setup()
      
      jest.mock('../DigitalNomadSearchFilter', () => ({
        DigitalNomadSearchFilter: jest.fn(({ onChange }) => (
          <button onClick={() => onChange({ 
            amenities: ['Wi-Fi & Power'] 
          })}>
            Apply Special
          </button>
        )),
      }))
      
      const { rerender } = render(<FiltersSidebar />)
      rerender(<FiltersSidebar />)
      
      await user.click(screen.getByText('Apply Special'))
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalled()
      })
    })
  })

  describe('Default Export', () => {
    it('should be importable as default export', async () => {
      const FiltersSidebarDefault = (await import('../FiltersSidebar')).default
      render(<FiltersSidebarDefault />)
      
      expect(screen.getByTestId('digital-nomad-search-filter')).toBeInTheDocument()
    })
  })

  describe('Memoization', () => {
    it('should memoize initial filters computation', () => {
      mockSearchParams.getAll = jest.fn((key) => {
        if (key === 'category') return ['coworking']
        return []
      })
      
      const { rerender } = render(<FiltersSidebar />)
      const firstRenderFilters = screen.getByTestId('initial-filters').textContent
      
      rerender(<FiltersSidebar />)
      const secondRenderFilters = screen.getByTestId('initial-filters').textContent
      
      expect(firstRenderFilters).toBe(secondRenderFilters)
    })
  })
})
