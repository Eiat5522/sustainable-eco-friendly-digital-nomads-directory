import '@testing-library/jest-dom';
import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'

// Mock next/navigation hooks used by the page and components
const pushMock = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, replace: jest.fn(), prefetch: jest.fn() }),
  useSearchParams: () => new URLSearchParams(''),
}))

// Create a test version of the page that doesn't use async searchParams
function TestSearchPage() {
  const { Header } = require('@/components/layout/Header')
  const { Footer } = require('@/components/layout/Footer') 
  const { SearchFiltersForm } = require('@/components/search/SearchFiltersForm')
  
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="heading-xl mb-8 text-center">Search for Sustainable Venues</h1>
        <SearchFiltersForm initialParams={{}} />
      </main>
      <Footer />
    </div>
  )
}

// Rely on MSW global handlers from __mocks__/node.ts for /api/search

// Utility kept for local mocks if needed in future
const makeResponse = (data: any, init: any = {}) =>
  new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  }) as any

describe('Search Page', () => {
  // No explicit fetch restore needed; MSW handlers are global from setup
  afterAll(() => {})
  beforeEach(() => {
    pushMock.mockReset()
  })

  it('renders search input and navigates to results', async () => {
    render(<TestSearchPage />)

    // Search input present  
    const input = await screen.findByPlaceholderText('Search by name, city, or amenities')
    expect(input).toBeInTheDocument()

    // Submit empty search to navigate
    const submitButton = screen.getByRole('button', { name: /search/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalled()
      expect(pushMock.mock.calls[0][0]).toMatch(/^\/search\/results(?:$|\?)/)
      expect(pushMock).toHaveBeenCalledTimes(1)
    })
  })

  it('navigates to results route on submit', async () => {
    render(<TestSearchPage />)
    const input = await screen.findByPlaceholderText('Search by name, city, or amenities') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'eco wifi' } })

    const submitButton = screen.getByRole('button', { name: /search/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalled()
      const arg = String(pushMock.mock.calls[0]?.[0] || '')
      expect(arg.startsWith('/search/results')).toBe(true)
    })
  })
})
