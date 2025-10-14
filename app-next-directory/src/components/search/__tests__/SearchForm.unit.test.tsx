/** @jest-environment jsdom */
/**
 * Unit tests for SearchForm component
 * 
 * Component: SearchForm - Main search form handling search queries and filters
 * Priority: CRITICAL - Primary search interface with complex state management
 * Coverage Target: 85%+
 */

import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SearchForm } from '@/components/search/SearchForm'
import { useRouter } from 'next/navigation'
import { useSearchListings } from '@/hooks/useSearchListings'

// Mock external dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

jest.mock('@/hooks/useSearchListings', () => ({
  useSearchListings: jest.fn(),
}))

const mockPush = jest.fn()
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>
const mockUseSearchListings = useSearchListings as jest.MockedFunction<typeof useSearchListings>

describe('SearchForm', () => {
  const mockSearchListings = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    } as any)

    mockUseSearchListings.mockReturnValue({
      listings: [],
      loading: false,
      error: null,
      searchListings: mockSearchListings,
      totalCount: 0,
      hasMore: false,
    })
  })

  describe('Rendering', () => {
    it('should render search form with proper accessibility attributes', () => {
      render(<SearchForm />)

      expect(screen.getByRole('search')).toHaveAttribute('aria-label', 'Search listings')
      expect(screen.getByLabelText('Search for eco-friendly venues')).toBeInTheDocument()
      expect(screen.getByLabelText('Filter by venue category')).toBeInTheDocument()
    })

    it('should render all category options', () => {
      render(<SearchForm />)
      
      const categorySelect = screen.getByLabelText('Filter by venue category')
      const options = categorySelect.querySelectorAll('option')
      
      expect(options).toHaveLength(5) // All categories, coworking, coliving, café, community
      expect(options[0]).toHaveTextContent('All categories')
      expect(options[1]).toHaveTextContent('Coworking')
      expect(options[2]).toHaveTextContent('Coliving')
      expect(options[3]).toHaveTextContent('Café')
      expect(options[4]).toHaveTextContent('Community Space')
    })

    it('should render filter presets', () => {
      render(<SearchForm />)
      
      const filterButton = screen.getByRole('button', { name: 'Show filters' })
      fireEvent.click(filterButton)
      
      expect(screen.getByText('Solar powered')).toBeInTheDocument()
      expect(screen.getByText('Vegan friendly')).toBeInTheDocument()
      expect(screen.getByText('Reliable Wi-Fi')).toBeInTheDocument()
    })

    it('should have proper ARIA attributes for inputs', () => {
      render(<SearchForm />)
      
      const searchInput = screen.getByLabelText('Search for eco-friendly venues')
      expect(searchInput).toHaveAttribute('aria-describedby', 'search-help')
      
      const categorySelect = screen.getByLabelText('Filter by venue category')
      expect(categorySelect).toHaveAttribute('aria-describedby', 'category-help')
    })
  })

  describe('Search Input', () => {
    it('should handle text input', async () => {
      const user = userEvent.setup()
      render(<SearchForm />)

      const searchInput = screen.getByLabelText('Search for eco-friendly venues')
      await user.type(searchInput, 'eco coworking')

      expect(searchInput).toHaveValue('eco coworking')
    })

    it('should maintain placeholder text', () => {
      render(<SearchForm />)
      
      const searchInput = screen.getByLabelText('Search for eco-friendly venues')
      expect(searchInput).toHaveAttribute('placeholder', 'Find sustainable coworking, cafés, retreats...')
    })

    it('should have searchbox role', () => {
      render(<SearchForm />)
      
      const searchInput = screen.getByRole('searchbox')
      expect(searchInput).toBeInTheDocument()
    })
  })

  describe('Category Filter', () => {
    it('should handle category selection', async () => {
      const user = userEvent.setup()
      render(<SearchForm />)

      const categorySelect = screen.getByLabelText('Filter by venue category')
      await user.selectOptions(categorySelect, 'coworking')

      expect(categorySelect).toHaveValue('coworking')
    })

    it('should default to empty value (all categories)', () => {
      render(<SearchForm />)
      
      const categorySelect = screen.getByLabelText('Filter by venue category') as HTMLSelectElement
      expect(categorySelect.value).toBe('')
    })
  })

  describe('Form Submission', () => {
    it('should handle search input and form submission', async () => {
      const user = userEvent.setup()
      
      render(<SearchForm />)

      const searchInput = screen.getByLabelText('Search for eco-friendly venues')
      await user.type(searchInput, 'eco coworking')

      const categorySelect = screen.getByLabelText('Filter by venue category')
      await user.selectOptions(categorySelect, 'coworking')

      const submitButton = screen.getByRole('button', { name: /search/i })
      await user.click(submitButton)

      expect(mockSearchListings).toHaveBeenCalledWith({
        query: 'eco coworking',
        category: 'coworking',
        filters: expect.any(Object),
      })

      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining('search=eco%20coworking')
      )
    })

    it('should submit empty search', async () => {
      const user = userEvent.setup()
      render(<SearchForm />)

      const submitButton = screen.getByRole('button', { name: /search/i })
      await user.click(submitButton)

      expect(mockSearchListings).toHaveBeenCalled()
      expect(mockPush).toHaveBeenCalledWith('/search')
    })

    it('should include active filters in submission', async () => {
      const user = userEvent.setup()
      render(<SearchForm />)

      const filterButton = screen.getByRole('button', { name: 'Show filters' })
      await user.click(filterButton)

      const solarCheckbox = screen.getByLabelText('Solar powered')
      await user.click(solarCheckbox)

      const submitButton = screen.getByRole('button', { name: /search/i })
      await user.click(submitButton)

      expect(mockSearchListings).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: { solarPowered: true },
        })
      )
    })

    it('should build URL with multiple filters', async () => {
      const user = userEvent.setup()
      render(<SearchForm />)

      const searchInput = screen.getByLabelText('Search for eco-friendly venues')
      await user.type(searchInput, 'test')

      const categorySelect = screen.getByLabelText('Filter by venue category')
      await user.selectOptions(categorySelect, 'cafe')

      const filterButton = screen.getByRole('button', { name: 'Show filters' })
      await user.click(filterButton)

      const veganCheckbox = screen.getByLabelText('Vegan friendly')
      await user.click(veganCheckbox)

      const submitButton = screen.getByRole('button', { name: /search/i })
      await user.click(submitButton)

      const url = mockPush.mock.calls[0][0]
      expect(url).toContain('search=test')
      expect(url).toContain('category=cafe')
      expect(url).toContain('filters=')
    })
  })

  describe('Filter Panel', () => {
    it('should handle filter panel toggle', async () => {
      const user = userEvent.setup()
      render(<SearchForm />)
      
      const filterButton = screen.getByRole('button', { name: 'Show filters' })
      
      expect(filterButton).toHaveAttribute('aria-expanded', 'false')
      expect(screen.queryByTestId('filter-panel')).not.toBeVisible()

      await user.click(filterButton)
      expect(filterButton).toHaveAttribute('aria-expanded', 'true')
      expect(screen.getByTestId('filter-panel')).toBeVisible()
      expect(filterButton).toHaveTextContent('Hide filters')

      await user.click(filterButton)
      expect(filterButton).toHaveAttribute('aria-expanded', 'false')
      expect(filterButton).toHaveTextContent('Show filters')
    })

    it('should toggle individual filter checkboxes', async () => {
      const user = userEvent.setup()
      render(<SearchForm />)

      const filterButton = screen.getByRole('button', { name: 'Show filters' })
      await user.click(filterButton)

      const solarCheckbox = screen.getByLabelText('Solar powered') as HTMLInputElement
      expect(solarCheckbox.checked).toBe(false)

      await user.click(solarCheckbox)
      expect(solarCheckbox.checked).toBe(true)

      await user.click(solarCheckbox)
      expect(solarCheckbox.checked).toBe(false)
    })

    it('should maintain filter state when toggling panel', async () => {
      const user = userEvent.setup()
      render(<SearchForm />)

      const filterButton = screen.getByRole('button', { name: 'Show filters' })
      await user.click(filterButton)

      const wifiCheckbox = screen.getByLabelText('Reliable Wi-Fi')
      await user.click(wifiCheckbox)

      await user.click(filterButton) // Hide
      await user.click(filterButton) // Show again

      const wifiCheckboxAgain = screen.getByLabelText('Reliable Wi-Fi') as HTMLInputElement
      expect(wifiCheckboxAgain.checked).toBe(true)
    })
  })

  describe('Loading State', () => {
    it('should display loading state during search', () => {
      mockUseSearchListings.mockReturnValue({
        listings: [],
        loading: true,
        error: null,
        searchListings: mockSearchListings,
        totalCount: 0,
        hasMore: false,
      })

      render(<SearchForm />)

      expect(screen.getByTestId('search-loading')).toBeInTheDocument()
      expect(screen.getByText('Searching...')).toBeInTheDocument()
    })

    it('should not render result items while loading', () => {
      mockUseSearchListings.mockReturnValue({
        listings: [],
        loading: true,
        error: null,
        searchListings: mockSearchListings,
        totalCount: 0,
        hasMore: false,
      })

      render(<SearchForm />)

      const resultsRegion = screen.getByRole('region', { name: 'Search results' })
      expect(within(resultsRegion).queryAllByRole('listitem')).toHaveLength(0)
    })
  })

  describe('Error State', () => {
    it('should display error state when search fails', () => {
      mockUseSearchListings.mockReturnValue({
        listings: [],
        loading: false,
        error: 'Failed to fetch listings',
        searchListings: mockSearchListings,
        totalCount: 0,
        hasMore: false,
      })

      render(<SearchForm />)

      expect(screen.getByText('Failed to fetch listings')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
    })

    it('should handle retry action', async () => {
      const user = userEvent.setup()
      mockUseSearchListings.mockReturnValue({
        listings: [],
        loading: false,
        error: 'Network error',
        searchListings: mockSearchListings,
        totalCount: 0,
        hasMore: false,
      })

      render(<SearchForm />)

      const retryButton = screen.getByRole('button', { name: /try again/i })
      await user.click(retryButton)

      expect(mockSearchListings).toHaveBeenCalled()
    })

    it('should have alert role for error message', () => {
      mockUseSearchListings.mockReturnValue({
        listings: [],
        loading: false,
        error: 'Error occurred',
        searchListings: mockSearchListings,
        totalCount: 0,
        hasMore: false,
      })

      render(<SearchForm />)

      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
  })

  describe('Search Results', () => {
    it('should display search results with controlled data', () => {
      const mockListings = [
        {
          id: 'test-1',
          title: 'Eco Coworking Space',
          category: 'coworking',
          city: 'Bangkok',
        },
        {
          id: 'test-2',
          title: 'Green Café',
          category: 'cafe',
          city: 'Bangkok',
        },
      ]

      mockUseSearchListings.mockReturnValue({
        listings: mockListings,
        loading: false,
        error: null,
        searchListings: mockSearchListings,
        totalCount: 2,
        hasMore: false,
      })

      render(<SearchForm />)

      expect(screen.getByText('2 results found')).toBeInTheDocument()
      expect(screen.getByText('Eco Coworking Space')).toBeInTheDocument()
      expect(screen.getByText('Green Café')).toBeInTheDocument()
    })

    it('should display empty state when no results found', () => {
      mockUseSearchListings.mockReturnValue({
        listings: [],
        loading: false,
        error: null,
        searchListings: mockSearchListings,
        totalCount: 0,
        hasMore: false,
      })

      render(<SearchForm />)

      expect(screen.getByTestId('empty-results')).toBeInTheDocument()
      expect(screen.getByText('No results found')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Clear filters' })).toBeInTheDocument()
    })

    it('should handle clear filters action', async () => {
      const user = userEvent.setup()
      mockUseSearchListings.mockReturnValue({
        listings: [],
        loading: false,
        error: null,
        searchListings: mockSearchListings,
        totalCount: 0,
        hasMore: false,
      })

      render(<SearchForm />)

      const clearButton = screen.getByRole('button', { name: 'Clear filters' })
      await user.click(clearButton)

      expect(mockSearchListings).toHaveBeenCalledWith({
        query: '',
        filters: {},
      })
      expect(mockPush).toHaveBeenCalledWith('/search')
    })

    it('should show hasMore indicator', () => {
      mockUseSearchListings.mockReturnValue({
        listings: [{ id: '1', title: 'Test' }],
        loading: false,
        error: null,
        searchListings: mockSearchListings,
        totalCount: 50,
        hasMore: true,
      })

      render(<SearchForm />)

      expect(screen.getByText(/more results available/i)).toBeInTheDocument()
    })

    it('should have aria-live region for results', () => {
      mockUseSearchListings.mockReturnValue({
        listings: [{ id: '1', title: 'Test' }],
        loading: false,
        error: null,
        searchListings: mockSearchListings,
        totalCount: 1,
        hasMore: false,
      })

      render(<SearchForm />)

      const resultsRegion = screen.getByRole('region', { name: 'Search results' })
      expect(resultsRegion).toHaveAttribute('aria-live', 'polite')

      const resultCount = screen.getByLabelText(/results found/)
      expect(resultCount).toHaveAttribute('aria-live', 'polite')
    })
  })

  describe('Keyboard Navigation', () => {
    it('should handle keyboard navigation through form elements', async () => {
      render(<SearchForm />)

      const searchInput = screen.getByLabelText('Search for eco-friendly venues')
      const categorySelect = screen.getByLabelText('Filter by venue category')
      const filterButton = screen.getByRole('button', { name: 'Show filters' })

      searchInput.focus()
      expect(searchInput).toHaveFocus()

      fireEvent.keyDown(searchInput, { key: 'Tab' })
      await waitFor(() => expect(categorySelect).toHaveFocus())

      fireEvent.keyDown(categorySelect, { key: 'Tab' })
      await waitFor(() => expect(filterButton).toHaveFocus())
    })

    it('should handle reverse tab navigation', async () => {
      render(<SearchForm />)

      const categorySelect = screen.getByLabelText('Filter by venue category')
      const searchInput = screen.getByLabelText('Search for eco-friendly venues')

      categorySelect.focus()
      fireEvent.keyDown(categorySelect, { key: 'Tab', shiftKey: true })
      
      await waitFor(() => expect(searchInput).toHaveFocus())
    })
  })

  describe('Edge Cases', () => {
    it('should handle special characters in search', async () => {
      const user = userEvent.setup()
      render(<SearchForm />)

      const searchInput = screen.getByLabelText('Search for eco-friendly venues')
      await user.type(searchInput, 'café & coworking!')

      const submitButton = screen.getByRole('button', { name: /search/i })
      await user.click(submitButton)

      expect(mockSearchListings).toHaveBeenCalledWith(
        expect.objectContaining({
          query: 'café & coworking!',
        })
      )
    })

    it('should handle very long search queries', async () => {
      const user = userEvent.setup()
      const longQuery = 'a'.repeat(500)
      render(<SearchForm />)

      const searchInput = screen.getByLabelText('Search for eco-friendly venues')
      await user.type(searchInput, longQuery)
      await user.click(screen.getByRole('button', { name: /search/i }))

      expect(mockSearchListings).toHaveBeenCalled()
    }, 10000)

    it('should handle rapid form submissions', async () => {
      const user = userEvent.setup()
      render(<SearchForm />)

      const submitButton = screen.getByRole('button', { name: /search/i })
      
      await user.click(submitButton)
      await user.click(submitButton)
      await user.click(submitButton)

      expect(mockSearchListings).toHaveBeenCalled()
    })
  })

  describe('Default Export', () => {
    it('should be importable as default export', async () => {
      const SearchFormDefault = (await import('../SearchForm')).default
      render(<SearchFormDefault />)

      expect(screen.getByRole('search')).toBeInTheDocument()
    })
  })
})