/** @jest-environment jsdom */

import '@testing-library/jest-dom'
import { render, screen, within } from '@testing-library/react'
import type { NextRequest } from 'next/server'
import { extractTagNames, mapResultToDTO } from './helpers'

const listingGridRenderMock = jest.fn(({ listings }: any) => (
  <div data-testid="listing-grid">{JSON.stringify(listings)}</div>
))
const searchFiltersRenderMock = jest.fn(({ initialParams }: any) => (
  <div data-testid="search-filters-form">{JSON.stringify(initialParams)}</div>
))

const mockSearchHandler = jest.fn<Promise<Response>, [NextRequest]>()

jest.mock('@/components/ui/neo-button', () => ({
  NeoButton: ({ children, asChild = false, ...props }: any) =>
    asChild ? <>{children}</> : <button {...props}>{children}</button>,
}))

jest.mock('@/components/listings/ListingGrid', () => ({
  ListingGrid: (props: any) => listingGridRenderMock(props),
}))

jest.mock('@/components/search/SearchFiltersForm', () => ({
  SearchFiltersForm: (props: any) => searchFiltersRenderMock(props),
}))

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, ...props }: any) => (
    <a href={typeof href === 'string' ? href : href?.pathname ?? ''} {...props}>
      {children}
    </a>
  ),
}))

jest.mock('../../api/search/route', () => ({
  GET: (...args: any[]) => mockSearchHandler(...(args as [NextRequest])),
}))

describe('Search results page module', () => {
  let ResultsPage: (typeof import('./page'))['default']
  let dynamic: (typeof import('./page'))['dynamic']

  beforeAll(async () => {
    const mod = await import('./page')
    ResultsPage = mod.default
    dynamic = mod.dynamic
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('exposes the dynamic route setting', () => {
    expect(dynamic).toBe('force-dynamic')
  })

  it('maps successful responses to listing DTOs and renders the grid', async () => {
    const validItem = {
      _id: 'listing-123',
      name: 'Eco Hub',
      slug: { current: 'eco-hub' },
      category: 'cafe',
      city: { _id: 'city-1', name: 'Lisbon', slug: 'lisbon', country: 'Portugal' },
      primaryImage: { asset: { url: 'https://example.com/img.jpg' } },
      shortDescription: 'A green friendly space',
      amenityNames: ['wifi'],
      moderation: { featured: true },
      ecoFocusTags: ['Solar', { name: 'Organic ' }],
      digitalNomadFeatures: [{ name: 'Quiet zones' }],
    }

    const invalidItem = { _id: 'broken', slug: 42 }
    const responsePayload = {
      data: {
        results: [validItem, invalidItem],
        pagination: { page: 2, totalPages: 3, limit: 12, total: 24 },
      },
    }

    mockSearchHandler.mockResolvedValueOnce(
      new Response(JSON.stringify(responsePayload), { status: 200 }),
    )

    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    const ui = await ResultsPage({ searchParams: Promise.resolve({ city: 'lisbon' }) })
    render(ui)

    const listings = JSON.parse(screen.getByTestId('listing-grid').textContent || '[]')
    expect(listings).toHaveLength(1)
    expect(listings[0]).toMatchObject({
      id: 'listing-123',
      name: 'Eco Hub',
      slug: 'eco-hub',
      city: { name: 'Lisbon', slug: 'lisbon', country: 'Portugal' },
      ecoFocusTags: ['Solar', 'Organic'],
      digitalNomadFeatures: ['Quiet zones'],
      featured: true,
    })

    expect(searchFiltersRenderMock).toHaveBeenCalledWith(
      expect.objectContaining({ initialParams: { city: 'lisbon' } }),
    )
    expect(errorSpy).toHaveBeenCalled()
    errorSpy.mockRestore()
  })

  it('renders an error state when the API returns an error response', async () => {
    mockSearchHandler.mockResolvedValueOnce(
      new Response('Internal error', { status: 500, statusText: 'Server Error' }),
    )

    const previousEnv = process.env.NODE_ENV
    // @ts-ignore
    process.env.NODE_ENV = 'development'

    const ui = await ResultsPage({ searchParams: Promise.resolve({ retry: '2' }) })
    render(ui)

    const errorState = await screen.findByTestId('search-error-state')
    expect(within(errorState).getByText(/Failed to load search results/i)).toBeInTheDocument()
    const retryLink = within(errorState).getByRole('link', { name: /retry search/i })
    expect(retryLink).toHaveAttribute('href', '/search/results?retry=3')
    expect(screen.getByText(/Error: 500 Server Error/)).toBeInTheDocument()

    // @ts-ignore
    process.env.NODE_ENV = previousEnv
  })

  it('handles thrown errors from the API handler', async () => {
    mockSearchHandler.mockRejectedValueOnce(new Error('network down'))

    const previousEnv = process.env.NODE_ENV
    // @ts-ignore
    process.env.NODE_ENV = 'development'

    const ui = await ResultsPage({ searchParams: Promise.resolve({}) })
    render(ui)

    const errorState = await screen.findByTestId('search-error-state')
    expect(within(errorState).getByText(/Failed to load search results/i)).toBeInTheDocument()
    expect(screen.getByText(/Unexpected error occurred/i)).toBeInTheDocument()

    // @ts-ignore
    process.env.NODE_ENV = previousEnv
  })

  it('logs and recovers from unexpected payload shapes', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    mockSearchHandler.mockResolvedValueOnce(
      new Response(JSON.stringify({ data: { results: { unexpected: true } } }), {
        status: 200,
      }),
    )

    const ui = await ResultsPage({ searchParams: Promise.resolve({}) })
    render(ui)

    expect(screen.getByText('No results found.')).toBeInTheDocument()
    expect(errorSpy).toHaveBeenCalled()
    expect(
      errorSpy.mock.calls.some(([message]) => message === 'Unexpected search API payload shape:'),
    ).toBe(true)

    errorSpy.mockRestore()
  })

  it('builds pagination links and preserves existing search parameters', async () => {
    const payload = {
      data: {
        results: [
          {
            _id: '1',
            name: 'Nomad Base',
            slug: 'nomad-base',
            category: 'coworking',
          },
        ],
        pagination: { page: 2, totalPages: 4, limit: 24, total: 80 },
      },
    }

    mockSearchHandler.mockResolvedValueOnce(new Response(JSON.stringify(payload), { status: 200 }))

    const searchParams = Promise.resolve({
      city: 'lisbon',
      tags: ['wifi', 'vegan'],
      page: '2',
      limit: '24',
    } as Record<string, any>)

    const ui = await ResultsPage({ searchParams })
    render(ui)

    expect(screen.getByText('Showing page 2 of 4')).toBeInTheDocument()

    const prevLink = screen.getByRole('link', { name: /prev/i })
    expect(prevLink).toHaveAttribute('href', expect.stringContaining('page=1'))
    expect(prevLink).toHaveAttribute('href', expect.stringContaining('city=lisbon'))
    expect(prevLink).toHaveAttribute('href', expect.stringContaining('tags=wifi'))

    const nextLink = screen.getByRole('link', { name: /next/i })
    expect(nextLink).toHaveAttribute('href', expect.stringContaining('page=3'))

    const pageButtons = screen.getAllByRole('link', { name: /^[1-4]$/ })
    expect(pageButtons).toHaveLength(4)
    expect(pageButtons[1]).toHaveAttribute('aria-current', 'page')

    const pageSizeSelect = screen.getByLabelText('Per page') as HTMLSelectElement
    expect(pageSizeSelect.value).toBe('24')
    expect(Array.from(pageSizeSelect.options).map((o) => o.value)).toEqual([
      '12',
      '24',
      '48',
      '96',
    ])
  })

  it('should not render "…", if there are less than 7 pages', async () => {
    const payload = {
      data: {
        results: [
          {
            _id: '1',
            name: 'Nomad Base',
            slug: 'nomad-base',
            category: 'coworking',
          },
        ],
        pagination: { page: 1, totalPages: 4, limit: 24, total: 80 },
      },
    }

    mockSearchHandler.mockResolvedValueOnce(new Response(JSON.stringify(payload), { status: 200 }))

    const searchParams = Promise.resolve({
      city: 'lisbon',
      tags: ['wifi', 'vegan'],
      page: '1',
      limit: '24',
    } as Record<string, any>)

    const ui = await ResultsPage({ searchParams })
    render(ui)

    expect(screen.queryByText('…')).not.toBeInTheDocument()
  })

  it('renders "…" if there are more than 7 pages', async () => {
    const payload = {
      data: {
        results: [
          {
            _id: '1',
            name: 'Nomad Base',
            slug: 'nomad-base',
            category: 'coworking',
          },
        ],
        pagination: { page: 1, totalPages: 10, limit: 24, total: 80 },
      },
    }

    mockSearchHandler.mockResolvedValueOnce(new Response(JSON.stringify(payload), { status: 200 }))

    const searchParams = Promise.resolve({
      city: 'lisbon',
      tags: ['wifi', 'vegan'],
      page: '1',
      limit: '24',
    } as Record<string, any>)

    const ui = await ResultsPage({ searchParams })
    render(ui)

    expect(screen.queryByText('…')).toBeInTheDocument()
  })

  describe('helpers', () => {
    describe('extractTagNames', () => {
      it('should return an empty array if the param is not an array', () => {
        expect(extractTagNames(null)).toEqual([])
      })
    })

    describe('mapResultToDTO', () => {
      it('should throw an error if the item is not valid', () => {
        expect(() => mapResultToDTO({ _id: 'broken', slug: 42 })).toThrow(
          'Invalid search result data',
        )
      })

      it('should return a valid DTO', () => {
        const validItem = {
          _id: 'listing-123',
          name: 'Eco Hub',
          slug: { current: 'eco-hub' },
          category: 'cafe',
          city: { _id: 'city-1', name: 'Lisbon', slug: 'lisbon', country: 'Portugal' },
          primaryImage: { asset: { url: 'https://example.com/img.jpg' } },
          shortDescription: 'A green friendly space',
          amenityNames: ['wifi'],
          moderation: { featured: true },
          ecoFocusTags: ['Solar', { name: 'Organic ' }],
          digitalNomadFeatures: [{ name: 'Quiet zones' }],
        }

        expect(mapResultToDTO(validItem)).toEqual({
          id: 'listing-123',
          name: 'Eco Hub',
          slug: 'eco-hub',
          type: 'cafe',
          city: { id: 'city-1', name: 'Lisbon', slug: 'lisbon', country: 'Portugal' },
          imageUrl: 'https://example.com/img.jpg',
          shortDescription: 'A green friendly space',
          amenityNames: ['wifi'],
          featured: true,
          ecoFocusTags: ['Solar', 'Organic'],
          digitalNomadFeatures: ['Quiet zones'],
        })
      })
    })
  })
})
