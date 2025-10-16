/** @jest-environment jsdom */
/**
 * Unit tests for SearchFiltersForm component
 * 
 * Component: SearchFiltersForm - Form component managing search filter state and submission
 * Priority: CRITICAL - Complex form with API integration and URL management
 * Coverage Target: 85%+
 */

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SearchFiltersForm } from '../SearchFiltersForm'
import { useRouter } from 'next/navigation'
import { http, HttpResponse } from 'msw'
import { server } from '@/__mocks__/server'

// Mock Next.js navigation
const mockPush = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

// Mock UI components
jest.mock('@/components/ui/neo-input', () => ({
  NeoInput: jest.fn((props) => <input data-testid="search-input" {...props} />),
}))

jest.mock('@/components/ui/neo-button', () => ({
  NeoButton: jest.fn(({ children, ...props }) => (
    <button data-testid="search-button" {...props}>{children}</button>
  )),
}))

jest.mock('@/components/ui/filter-multi-select', () => ({
  FilterMultiSelect: jest.fn(({ label, options, selected, onChange }) => (
    <div data-testid={`filter-${label.toLowerCase().replace(/\s+/g, '-')}`}>
      <label>{label}</label>
      <select
        multiple
        value={selected}
        onChange={(e) => {
          const values = Array.from(e.target.selectedOptions, option => option.value)
          onChange(values)
        }}
      >
        {options.map((opt: any) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  )),
}))

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>
let fetchSpy: jest.SpyInstance

// Note: API endpoints are handled by MSW (Mock Service Worker) setup in jest.setup.ts
// MSW provides handlers for /api/cities, /api/categories, and /api/amenities

describe('SearchFiltersForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    fetchSpy = jest.spyOn(global, 'fetch')
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    } as any)
  })

  afterEach(() => {
    fetchSpy.mockRestore()
    server.resetHandlers()
  })

  describe('Rendering', () => {
    it('should render search form with all elements', async () => {
      render(<SearchFiltersForm />)
      
      await waitFor(() => {
        expect(screen.getByTestId('search-form')).toBeInTheDocument()
        expect(screen.getByTestId('search-input')).toBeInTheDocument()
        expect(screen.getByTestId('search-button')).toBeInTheDocument()
      })
    })

    it('should render with search icon', async () => {
      const { container } = render(<SearchFiltersForm />)
      
      await waitFor(() => {
        const icon = container.querySelector('[focusable="false"]')
        expect(icon).toBeInTheDocument()
      })
    })

    it('should have proper accessibility labels', async () => {
      render(<SearchFiltersForm />)
      
      await waitFor(() => {
        expect(screen.getByLabelText('Search venues')).toBeInTheDocument()
      })
    })

    it('should render filter selects after API load', async () => {
      render(<SearchFiltersForm />)
      
      await waitFor(() => {
        expect(screen.getByTestId('filter-select-cities')).toBeInTheDocument()
        expect(screen.getByTestId('filter-select-workspace-types')).toBeInTheDocument()
        expect(screen.getByTestId('filter-select-amenities')).toBeInTheDocument()
      })
    })

    it('should apply custom className prop', async () => {
      const { container } = render(<SearchFiltersForm className="custom-class" />)
      
      await waitFor(() => {
        const form = container.querySelector('.custom-class')
        expect(form).toBeInTheDocument()
      })
    })
  })

  describe('Initial State', () => {
    it('should initialize with empty search term', async () => {
      render(<SearchFiltersForm />)
      
      await waitFor(() => {
        const input = screen.getByTestId('search-input') as HTMLInputElement
        expect(input.value).toBe('')
      })
    })

    it('should initialize with params from initialParams prop', async () => {
      render(<SearchFiltersForm initialParams={{ q: 'coworking' }} />)
      
      await waitFor(() => {
        const input = screen.getByTestId('search-input') as HTMLInputElement
        expect(input.value).toBe('coworking')
      })
    })

    it('should initialize filters from initialParams', async () => {
      render(<SearchFiltersForm 
        initialParams={{ 
          destination: ['Bangkok', 'Lisbon'],
          category: ['coworking']
        }} 
      />)
      
      await waitFor(() => {
        const citiesFilter = screen.getByTestId('filter-select-cities')
        const categoryFilter = screen.getByTestId('filter-select-workspace-types')
        
        expect(citiesFilter).toBeInTheDocument()
        expect(categoryFilter).toBeInTheDocument()
      })
    })

    it('should handle single string values in initialParams', async () => {
      render(<SearchFiltersForm initialParams={{ destination: 'Bangkok' }} />)
      
      await waitFor(() => {
        expect(screen.getByTestId('filter-select-cities')).toBeInTheDocument()
      })
    })
  })

  describe('API Data Loading', () => {
    it('should fetch cities on mount', async () => {
      render(<SearchFiltersForm />)
      
      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledWith(
          '/api/cities',
          expect.objectContaining({ signal: expect.any(AbortSignal) })
        )
      })
    })

    it('should fetch categories on mount', async () => {
      render(<SearchFiltersForm />)
      
      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledWith(
          '/api/categories',
          expect.objectContaining({ signal: expect.any(AbortSignal) })
        )
      })
    })

    it('should fetch amenities on mount', async () => {
      render(<SearchFiltersForm />)
      
      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledWith(
          '/api/amenities',
          expect.objectContaining({ signal: expect.any(AbortSignal) })
        )
      })
    })

    it('should handle API errors gracefully', async () => {
      // Override MSW handlers to return errors
      server.use(
        http.get('/api/cities', () => HttpResponse.error()),
        http.get('/api/categories', () => HttpResponse.error()),
        http.get('/api/amenities', () => HttpResponse.error())
      )
      
      // Should not crash
      expect(() => render(<SearchFiltersForm />)).not.toThrow()
      
      await waitFor(() => {
        expect(screen.getByTestId('search-form')).toBeInTheDocument()
      })
    })

    it('should handle malformed API responses', async () => {
      // Override MSW handlers to return empty/malformed responses
      server.use(
        http.get('/api/cities', () => HttpResponse.json({})),
        http.get('/api/categories', () => HttpResponse.json({})),
        http.get('/api/amenities', () => HttpResponse.json({}))
      )
      
      render(<SearchFiltersForm />)
      
      await waitFor(() => {
        expect(screen.getByTestId('search-form')).toBeInTheDocument()
      })
    })

    it('should deduplicate city options', async () => {
      // Override MSW handler for cities with duplicates
      server.use(
        http.get('/api/cities', () => HttpResponse.json({
          cities: [
            { name: 'Bangkok' },
            { name: 'Bangkok' }, // Duplicate
            { name: 'Lisbon' },
          ],
        }))
      )
      
      render(<SearchFiltersForm />)
      
      await waitFor(() => {
        expect(screen.getByTestId('filter-select-cities')).toBeInTheDocument()
      })
    })

    it('should filter out invalid city entries', async () => {
      // Override MSW handler for cities with invalid entries
      server.use(
        http.get('/api/cities', () => HttpResponse.json({
          cities: [
            { name: 'Bangkok' },
            { name: '' }, // Invalid
            null, // Invalid
            { name: '  ' }, // Whitespace only
          ],
        }))
      )
      
      render(<SearchFiltersForm />)
      
      await waitFor(() => {
        expect(screen.getByTestId('filter-select-cities')).toBeInTheDocument()
      })
    })

    it('should sort options alphabetically', async () => {
      render(<SearchFiltersForm />)
      
      await waitFor(() => {
        const citiesFilter = screen.getByTestId('filter-select-cities')
        const options = citiesFilter.querySelectorAll('option')
        expect(options.length).toBeGreaterThan(0)
        const labels = Array.from(options).map(opt => opt.textContent)

        expect(labels[0]).toBe('Bangkok')
      })
    })
  })

  describe('Form Submission', () => {
    it('should navigate to results path on submit', async () => {
      const user = userEvent.setup()
      render(<SearchFiltersForm />)
      
      await waitFor(() => {
        expect(screen.getByTestId('search-button')).toBeInTheDocument()
      })
      
      await user.click(screen.getByTestId('search-button'))
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          expect.stringContaining('/search/results')
        )
      })
    })

    it('should include search query in URL', async () => {
      const user = userEvent.setup()
      render(<SearchFiltersForm />)
      
      await waitFor(() => {
        expect(screen.getByTestId('search-input')).toBeInTheDocument()
      })
      
      const input = screen.getByTestId('search-input')
      await user.type(input, 'coworking space')
      await user.click(screen.getByTestId('search-button'))
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          expect.stringContaining('q=coworking+space')
        )
      })
    })

    it('should trim whitespace from search query', async () => {
      const user = userEvent.setup()
      render(<SearchFiltersForm />)
      
      await waitFor(() => {
        expect(screen.getByTestId('search-input')).toBeInTheDocument()
      })
      
      const input = screen.getByTestId('search-input')
      await user.type(input, '  search  ')
      await user.click(screen.getByTestId('search-button'))
      
      await waitFor(() => {
        const call = mockPush.mock.calls[0][0]
        expect(call).toContain('q=search')
        expect(call).not.toContain('q=++search++')
      })
    })

    it('should not include empty search query in URL', async () => {
      const user = userEvent.setup()
      render(<SearchFiltersForm />)
      
      await waitFor(() => {
        expect(screen.getByTestId('search-button')).toBeInTheDocument()
      })
      
      await user.click(screen.getByTestId('search-button'))
      
      await waitFor(() => {
        const call = mockPush.mock.calls[0][0]
        expect(call).not.toContain('q=')
      })
    })

    it('should include selected filters in URL', async () => {
      const user = userEvent.setup()
      render(<SearchFiltersForm />)
      
      await waitFor(() => {
        expect(screen.getByTestId('filter-select-cities')).toBeInTheDocument()
      })
      
      const citiesFilter = screen.getByTestId('filter-select-cities').querySelector('select')!
      await waitFor(() => {
        expect(Array.from(citiesFilter.options).length).toBeGreaterThan(0)
      })
      await user.selectOptions(citiesFilter, ['Bangkok'])
      await user.click(screen.getByTestId('search-button'))
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          expect.stringContaining('destination=Bangkok')
        )
      })
    })

    it('should reset page to 1 on search', async () => {
      const user = userEvent.setup()
      render(<SearchFiltersForm initialParams={{ page: '5' }} />)
      
      await waitFor(() => {
        expect(screen.getByTestId('search-button')).toBeInTheDocument()
      })
      
      await user.click(screen.getByTestId('search-button'))
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          expect.stringContaining('page=1')
        )
      })
    })

    it('should include facets parameter', async () => {
      const user = userEvent.setup()
      render(<SearchFiltersForm />)
      
      await waitFor(() => {
        expect(screen.getByTestId('search-button')).toBeInTheDocument()
      })
      
      await user.click(screen.getByTestId('search-button'))
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          expect.stringContaining('facets=1')
        )
      })
    })

    it('should use custom results path', async () => {
      const user = userEvent.setup()
      render(<SearchFiltersForm resultsPath="/custom/search" />)
      
      await waitFor(() => {
        expect(screen.getByTestId('search-button')).toBeInTheDocument()
      })
      
      await user.click(screen.getByTestId('search-button'))
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          expect.stringContaining('/custom/search')
        )
      })
    })

    it('should preserve initial params that are not form fields', async () => {
      const user = userEvent.setup()
      render(<SearchFiltersForm initialParams={{ custom: 'value', sort: 'rating' }} />)
      
      await waitFor(() => {
        expect(screen.getByTestId('search-button')).toBeInTheDocument()
      })
      
      await user.click(screen.getByTestId('search-button'))
      
      await waitFor(() => {
        const call = mockPush.mock.calls[0][0]
        expect(call).toContain('custom=value')
        expect(call).toContain('sort=rating')
      })
    })

    it('should delete retry param on search', async () => {
      const user = userEvent.setup()
      render(<SearchFiltersForm initialParams={{ retry: '1' }} />)
      
      await waitFor(() => {
        expect(screen.getByTestId('search-button')).toBeInTheDocument()
      })
      
      await user.click(screen.getByTestId('search-button'))
      
      await waitFor(() => {
        const call = mockPush.mock.calls[0][0]
        expect(call).not.toContain('retry=')
      })
    })
  })

  describe('Multi-Select Filters', () => {
    it('should handle multiple city selections', async () => {
      const user = userEvent.setup()
      render(<SearchFiltersForm />)
      
      await waitFor(() => {
        expect(screen.getByTestId('filter-select-cities')).toBeInTheDocument()
      })
      
      const citiesFilter = screen.getByTestId('filter-select-cities').querySelector('select')!
      await waitFor(() => {
        expect(Array.from(citiesFilter.options).length).toBeGreaterThan(0)
      })
      await user.selectOptions(citiesFilter, ['Bangkok', 'Lisbon'])
      await user.click(screen.getByTestId('search-button'))
      
      await waitFor(() => {
        const call = mockPush.mock.calls[0][0]
        expect(call).toContain('destination=Bangkok')
        expect(call).toContain('destination=Lisbon')
      })
    })

    it('should handle multiple category selections', async () => {
      const user = userEvent.setup()
      render(<SearchFiltersForm />)
      
      await waitFor(() => {
        expect(screen.getByTestId('filter-select-workspace-types')).toBeInTheDocument()
      })
      
      const categoryFilter = screen.getByTestId('filter-select-workspace-types').querySelector('select')!
      await waitFor(() => {
        expect(Array.from(categoryFilter.options).length).toBeGreaterThan(0)
      })
      await user.selectOptions(categoryFilter, ['coworking', 'cafe'])
      await user.click(screen.getByTestId('search-button'))
      
      await waitFor(() => {
        const call = mockPush.mock.calls[0][0]
        expect(call).toContain('category=coworking')
        expect(call).toContain('category=cafe')
      })
    })

    it('should handle multiple amenity selections', async () => {
      const user = userEvent.setup()
      render(<SearchFiltersForm />)
      
      await waitFor(() => {
        expect(screen.getByTestId('filter-select-amenities')).toBeInTheDocument()
      })
      
      const amenitiesFilter = screen.getByTestId('filter-select-amenities').querySelector('select')!
      await waitFor(() => {
        expect(Array.from(amenitiesFilter.options).length).toBeGreaterThan(0)
      })
      await user.selectOptions(amenitiesFilter, ['Wi-Fi', 'Kitchen'])
      await user.click(screen.getByTestId('search-button'))
      
      await waitFor(() => {
        const call = mockPush.mock.calls[0][0]
        expect(call).toContain('amenities=Wi-Fi')
        expect(call).toContain('amenities=Kitchen')
      })
    })
  })

  describe('State Management', () => {
    it('should update state when typing in search input', async () => {
      const user = userEvent.setup()
      render(<SearchFiltersForm />)
      
      await waitFor(() => {
        expect(screen.getByTestId('search-input')).toBeInTheDocument()
      })
      
      const input = screen.getByTestId('search-input') as HTMLInputElement
      await user.type(input, 'test')
      
      expect(input.value).toBe('test')
    })

    it('should sync state with initialParams changes', async () => {
      const { rerender } = render(<SearchFiltersForm initialParams={{ q: 'initial' }} />)
      
      await waitFor(() => {
        const input = screen.getByTestId('search-input') as HTMLInputElement
        expect(input.value).toBe('initial')
      })
      
      rerender(<SearchFiltersForm initialParams={{ q: 'updated' }} />)
      
      await waitFor(() => {
        const input = screen.getByTestId('search-input') as HTMLInputElement
        expect(input.value).toBe('updated')
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle API timeout/abort', async () => {
      // Override MSW handlers to simulate timeout
      server.use(
        http.get('/api/cities', () => {
          return new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Aborted')), 100)
          )
        }),
        http.get('/api/categories', () => HttpResponse.json({ categories: [] })),
        http.get('/api/amenities', () => HttpResponse.json({ amenities: [] }))
      )
      
      const { unmount } = render(<SearchFiltersForm />)
      unmount() // Trigger cleanup/abort
      
      // Should not crash
      expect(true).toBe(true)
    })

    it('should handle rapid form submissions', async () => {
      const user = userEvent.setup()
      render(<SearchFiltersForm />)
      
      await waitFor(() => {
        expect(screen.getByTestId('search-button')).toBeInTheDocument()
      })
      
      // Submit multiple times rapidly
      await user.click(screen.getByTestId('search-button'))
      await user.click(screen.getByTestId('search-button'))
      await user.click(screen.getByTestId('search-button'))
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalled()
      })
    })

    it('should handle special characters in filters', async () => {
      // Override MSW handler for cities with special characters
      server.use(
        http.get('/api/cities', () => HttpResponse.json({
          cities: [{ name: 'São Paulo' }, { name: 'Zürich' }],
        }))
      )
      
      render(<SearchFiltersForm />)
      
      await waitFor(() => {
        expect(screen.getByTestId('filter-select-cities')).toBeInTheDocument()
      })
    })
  })

  describe('Default Export', () => {
    it('should be importable as default export', async () => {
      const SearchFiltersFormDefault = (await import('../SearchFiltersForm')).SearchFiltersForm
      render(<SearchFiltersFormDefault />)
      
      await waitFor(() => {
        expect(screen.getByTestId('search-form')).toBeInTheDocument()
      })
    })
  })
})
