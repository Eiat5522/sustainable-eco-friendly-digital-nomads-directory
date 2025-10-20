import { act, renderHook } from '@testing-library/react'
import type { SearchListing } from './useSearchListings'
import { useSearchListings } from './useSearchListings'

describe('useSearchListings', () => {
  const originalFetch = global.fetch
  const mockFetch = jest.fn<Promise<Response>, Parameters<typeof fetch>>()

  beforeEach(() => {
    mockFetch.mockReset()
    global.fetch = mockFetch as unknown as typeof fetch
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  const createJsonResponse = (payload: unknown, overrides: Partial<Response> = {}) =>
    ({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue(payload),
      ...overrides,
    }) as unknown as Response

  it('merges requests, normalises payloads and derives pagination state', async () => {
    const listings: SearchListing[] = [
      { id: '1', title: 'Eco Stay', city: 'Lisbon' },
      { id: '2', title: 'Green Hub', city: 'Porto' },
      // non-object entry should be dropped by ensureArray
      // @ts-expect-error – intentionally wrong type for runtime guard coverage
      'skip-me',
    ]

    mockFetch.mockResolvedValue(
      createJsonResponse({
        results: listings,
        total: '9',
        pagination: { hasMore: undefined, total: 9 },
      })
    )

    const { result } = renderHook(() =>
      useSearchListings({
        query: 'sustainable',
        limit: 6,
        filters: { region: 'pt' },
      })
    )

    await act(async () => {
      await result.current.searchListings({ page: 1 })
    })

    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/search',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
    )

    const body = JSON.parse((mockFetch.mock.calls[0]?.[1] as RequestInit).body as string)
    expect(body).toEqual({
      query: 'sustainable',
      category: '',
      filters: { region: 'pt' },
      page: 1,
      limit: 6,
    })

    expect(result.current.listings).toEqual(listings.slice(0, 2))
    expect(result.current.totalCount).toBe(9)
    // hasMore should be derived from total rather than explicit boolean
    expect(result.current.hasMore).toBe(true)
    expect(result.current.error).toBeNull()
    expect(result.current.loading).toBe(false)
  })

  it('respects explicit pagination flags when provided', async () => {
    mockFetch.mockResolvedValue(
      createJsonResponse({
        results: [{ id: '1', title: 'Only Result' }],
        count: '1',
        pagination: { hasMore: false, total: 1 },
      })
    )

    const { result } = renderHook(() => useSearchListings())

    await act(async () => {
      await result.current.searchListings({ page: 1, limit: 1 })
    })

    expect(result.current.listings).toEqual([{ id: '1', title: 'Only Result' }])
    expect(result.current.totalCount).toBe(1)
    expect(result.current.hasMore).toBe(false)
  })

  it('clears state when the network request fails', async () => {
    mockFetch.mockResolvedValue(
      createJsonResponse(
        {},
        {
          ok: false,
          status: 503,
        }
      )
    )

    const { result } = renderHook(() => useSearchListings())

    await act(async () => {
      await result.current.searchListings({ query: 'fails' })
    })

    expect(result.current.error).toBe('Search request failed with status 503')
    expect(result.current.listings).toEqual([])
    expect(result.current.totalCount).toBe(0)
    expect(result.current.hasMore).toBe(false)
  })

  it('surfaces unexpected failures and resets derived state', async () => {
    mockFetch.mockRejectedValue(new Error('network down'))

    const { result } = renderHook(() => useSearchListings())

    await act(async () => {
      await result.current.searchListings({ query: 'anything' })
    })

    expect(result.current.error).toBe('network down')
    expect(result.current.listings).toEqual([])
    expect(result.current.totalCount).toBe(0)
    expect(result.current.hasMore).toBe(false)
  })
})
