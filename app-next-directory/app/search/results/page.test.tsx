/** @jest-environment jsdom */
/**
 * Unit tests for Search Results Page
 * 
 * Component: ResultsPage - Server component displaying search results with pagination
 * Priority: CRITICAL - Main search results display
 * Coverage Target: 85%+
 */

import '@testing-library/jest-dom'
import React from 'react'
import { render, screen } from '@testing-library/react'

// Mock Next.js components
jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }: any) {
    return <a href={href} {...props}>{children}</a>
  }
})

// Mock layout components
jest.mock('@/components/listings/ListingGrid', () => ({
  ListingGrid: function MockListingGrid({ listings }: any) {
    return (
      <div data-testid="listing-grid">
        {listings.map((listing: any) => (
          <div key={listing.id} data-testid={`listing-${listing.id}`}>
            {listing.name}
          </div>
        ))}
      </div>
    )
  },
}))

jest.mock('@/components/search/SearchFiltersForm', () => ({
  SearchFiltersForm: function MockSearchFiltersForm({ initialParams }: any) {
    return <div data-testid="search-filters-form" data-params={JSON.stringify(initialParams)} />
  },
}))

jest.mock('@/components/ui/neo-button', () => ({
  NeoButton: function MockNeoButton({ children, asChild, disabled, ...props }: any) {
    if (asChild) {
      return <div data-testid="neo-button" data-disabled={disabled} {...props}>{children}</div>
    }
    return <button data-testid="neo-button" disabled={disabled} {...props}>{children}</button>
  },
}))

// Mock the search API route handler
const mockSearchResults = [
  {
    _id: 'test-1',
    name: 'Test Cafe',
    slug: 'test-cafe',
    category: 'cafe',
    city: {
      _id: 'city-1',
      name: 'Bangkok',
      slug: 'bangkok',
      country: 'Thailand',
    },
    primaryImage: {
      asset: {
        url: 'https://example.com/image.jpg',
      },
    },
    shortDescription: 'A great test cafe',
    amenityNames: ['wifi', 'coffee'],
    moderation: { featured: true },
  },
  {
    _id: 'test-2',
    name: 'Coworking Space',
    slug: { current: 'coworking-space' },
    category: 'coworking',
    location: {
      _id: 'city-2',
      name: 'Lisbon',
      slug: 'lisbon',
      country: 'Portugal',
    },
    primaryImage: null,
    shortDescription: null,
    amenityNames: null,
    moderation: { featured: false },
  },
]

let mockGetHandler = jest.fn(async () => {
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    json: async () => ({
      data: {
        results: mockSearchResults,
        pagination: {
          page: 1,
          limit: 12,
          total: 2,
          totalPages: 1,
          hasMore: false,
        },
      },
    }),
  }
})

jest.mock('../../api/search/route', () => ({
  get GET() {
    return mockGetHandler
  },
}))

// Import the module functions we want to test
import ResultsPage from '../page'

describe('ResultsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetHandler = jest.fn(async () => {
      return {
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({
          data: {
            results: mockSearchResults,
            pagination: {
              page: 1,
              limit: 12,
              total: 2,
              totalPages: 1,
              hasMore: false,
            },
          },
        }),
      }
    })
  })

  describe('Successful Results', () => {
    it('should render listing grid with results', async () => {
      const jsx = await ResultsPage({ searchParams: Promise.resolve({}) })
      const { container } = render(jsx)

      expect(screen.getByTestId('listing-grid')).toBeInTheDocument()
      expect(screen.getByTestId('listing-test-1')).toBeInTheDocument()
      expect(screen.getByTestId('listing-test-2')).toBeInTheDocument()
    })

    it('should pass search filters to SearchFiltersForm', async () => {
      const searchParams = {
        q: 'test query',
        category: ['cafe'],
        destination: ['Bangkok'],
      }

      const jsx = await ResultsPage({ searchParams: Promise.resolve(searchParams) })
      render(jsx)

      const form = screen.getByTestId('search-filters-form')
      expect(form).toBeInTheDocument()
      const params = JSON.parse(form.getAttribute('data-params') || '{}')
      expect(params.q).toBe('test query')
      expect(params.category).toEqual(['cafe'])
    })
  })

  describe('Error Handling', () => {
    it('should handle API error responses', async () => {
      mockGetHandler = jest.fn(async () => ({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      }))

      const jsx = await ResultsPage({ searchParams: Promise.resolve({}) })
      render(jsx)

      expect(screen.getByTestId('search-error-state')).toBeInTheDocument()
      expect(screen.getByText(/Failed to load search results/)).toBeInTheDocument()
    })

    it('should handle network errors', async () => {
      mockGetHandler = jest.fn(async () => {
        throw new Error('Network error')
      })

      const jsx = await ResultsPage({ searchParams: Promise.resolve({}) })
      render(jsx)

      expect(screen.getByTestId('search-error-state')).toBeInTheDocument()
    })
  })
})
