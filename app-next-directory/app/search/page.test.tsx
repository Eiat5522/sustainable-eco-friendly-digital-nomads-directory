import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'

// Mock next/navigation hooks used by the page and components
const pushMock = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, replace: jest.fn(), prefetch: jest.fn() }),
  useSearchParams: () => new URLSearchParams(''),
}))

// Mock fetch for /api/search with safe restore
const originalFetch = (global as any).fetch
const fetchMock = jest.fn()
;(global as any).fetch = fetchMock as any

// Import after mocks
import Page from './page'

describe('Search Page', () => {
  afterAll(() => {
    // Restore original fetch to avoid leaking into other tests
    ;(global as any).fetch = originalFetch
  })
  beforeEach(() => {
    pushMock.mockReset()
    fetchMock.mockReset()
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [
          { _id: '1', name: 'Alpha Place', slug: 'alpha', primaryImage: { asset: { url: '' } }, location: { name: 'Lisbon' } },
        ],
        pagination: { total: 1, page: 1, totalPages: 1, hasMore: false },
      }),
    })
  })

  it('renders search input, filters sidebar, and listing results', async () => {
    render(<Page />)

    // Search input
    const input = screen.getByPlaceholderText('Search eco-friendly venues...')
    expect(input).toBeInTheDocument()

    // Filters title
    expect(screen.getByText(/Filter Results/i)).toBeInTheDocument()

    // Wait for fetch and one listing
    await waitFor(() => {
      expect(screen.getByText('Alpha Place')).toBeInTheDocument()
    })
  })

  it('updates the URL when submitting a search', async () => {
    render(<Page />)
    const input = screen.getByPlaceholderText('Search eco-friendly venues...') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'eco wifi' } })

    const submitButton = screen.getByRole('button', { name: /search/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalled()
      const pushedUrl = (pushMock.mock.calls[0] || [])[0] as string
      expect(pushedUrl).toMatch(/\/search\?/) // navigates to search
      expect(pushedUrl).toMatch(/q=eco%20wifi/) // contains encoded query
    })
  })
})
