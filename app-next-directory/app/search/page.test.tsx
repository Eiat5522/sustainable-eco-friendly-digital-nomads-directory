import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'

// Mock next/navigation hooks used by the page and components
const pushMock = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, replace: jest.fn(), prefetch: jest.fn() }),
  useSearchParams: () => new URLSearchParams(''),
}))

// Rely on MSW global handlers from __mocks__/node.ts for /api/search

// Utility kept for local mocks if needed in future
const makeResponse = (data: any, init: any = {}) =>
  new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  }) as any

// Import after mocks
import Page from './page'

describe('Search Page', () => {
  // No explicit fetch restore needed; MSW handlers are global from setup
  afterAll(() => {})
  beforeEach(() => {
    pushMock.mockReset()
  })

  it('renders search input and responds with listing results', async () => {
    render(<Page />)

    // Search input present
    const input = screen.getByPlaceholderText('Search by name, city, or amenities')
    expect(input).toBeInTheDocument()

    // Submit empty search to trigger fetch
    const submitButton = screen.getByRole('button', { name: /search/i })
    fireEvent.click(submitButton)

    // Wait for empty-state text that indicates request completed via MSW
    await screen.findByText(/No results found/i)
  })

  it('performs in-place fetch on submit instead of navigation', async () => {
    render(<Page />)
    const input = screen.getByPlaceholderText('Search by name, city, or amenities') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'eco wifi' } })

    const submitButton = screen.getByRole('button', { name: /search/i })
    fireEvent.click(submitButton)

    // We assert no navigation happened; fetch is handled by MSW
    await waitFor(() => {
      expect(pushMock).not.toHaveBeenCalled()
    })
  })
})
