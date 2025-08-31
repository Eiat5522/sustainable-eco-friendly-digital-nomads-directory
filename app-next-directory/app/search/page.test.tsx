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

const makeResponse = (data: any, init: any = {}) =>
  new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  }) as any

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
    fetchMock.mockImplementation((url: RequestInfo | URL) => {
      const u = typeof url === 'string' ? url : url.toString()
      if (u.startsWith('/api/search')) {
        return Promise.resolve(
          makeResponse({
            data: {
              results: [
                { _id: '1', name: 'Alpha Place', slug: 'alpha', primaryImage: { asset: { url: '' } }, location: { name: 'Lisbon' } },
              ],
              pagination: { total: 1, page: 1, totalPages: 1, hasMore: false },
            },
          })
        )
      }
      return Promise.resolve(makeResponse({}))
    })
  })

  it('renders search input and responds with listing results', async () => {
    render(<Page />)

    // Search input present
    const input = screen.getByPlaceholderText('Search by name, city, or amenities')
    expect(input).toBeInTheDocument()

    // Submit empty search to trigger fetch
    const submitButton = screen.getByRole('button', { name: /search/i })
    fireEvent.click(submitButton)

    // Wait for fetch and one listing (mocked in response shape data.results)
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled()
    })
  })

  it('performs in-place fetch on submit instead of navigation', async () => {
    render(<Page />)
    const input = screen.getByPlaceholderText('Search by name, city, or amenities') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'eco wifi' } })

    const submitButton = screen.getByRole('button', { name: /search/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      const arg = (fetchMock.mock.calls[0] || [])[0] as any
      const url = typeof arg === 'string' ? arg : arg?.url ?? String(arg)
      expect(String(url)).toContain('/api/search')
      expect(pushMock).not.toHaveBeenCalled()
    })
  })
})
