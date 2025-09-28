'use client'

import { useCallback, useRef, useState } from 'react'

type SearchFilters = Record<string, unknown>

export interface SearchListing {
  id: string
  title: string
  category?: string | null
  city?: string | null
  sustainabilityScore?: number | null
  [key: string]: unknown
}

export interface SearchRequest {
  query?: string
  category?: string
  filters?: SearchFilters
  page?: number
  limit?: number
}

export interface UseSearchListingsResult {
  listings: SearchListing[]
  loading: boolean
  error: string | null
  totalCount: number
  hasMore: boolean
  searchListings: (params?: SearchRequest) => Promise<void>
}

interface SearchResponseShape {
  results?: unknown
  total?: unknown
  count?: unknown
  pagination?: {
    total?: unknown
    page?: unknown
    totalPages?: unknown
    hasMore?: unknown
  }
}

function coerceNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10)
    if (Number.isFinite(parsed)) return parsed
  }
  return fallback
}

function ensureArray(value: unknown): SearchListing[] {
  if (Array.isArray(value)) {
    return value.filter((entry): entry is SearchListing => typeof entry === 'object' && entry !== null)
  }
  return []
}

export function useSearchListings(initialRequest: SearchRequest = {}): UseSearchListingsResult {
  const [listings, setListings] = useState<SearchListing[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [hasMore, setHasMore] = useState(false)

  const initialRequestRef = useRef<SearchRequest>({ ...initialRequest })
  const lastRequestRef = useRef<SearchRequest>({ ...initialRequest })

  const searchListings = useCallback(async (params: SearchRequest = {}) => {
    const merged: SearchRequest = {
      ...initialRequestRef.current,
      ...params,
    }

    lastRequestRef.current = merged

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: merged.query ?? '',
          category: merged.category ?? '',
          filters: merged.filters ?? {},
          page: merged.page ?? 1,
          limit: merged.limit ?? 12,
        }),
      })

      if (!response.ok) {
        throw new Error(`Search request failed with status ${response.status}`)
      }

      const payload: SearchResponseShape = await response.json()
      const nextListings = ensureArray(payload.results)
      setListings(nextListings)

      const totalFromResponse = coerceNumber(
        payload.total ?? payload.count ?? payload.pagination?.total,
        nextListings.length
      )
      setTotalCount(totalFromResponse)

      const currentPage = coerceNumber(merged.page, 1)
      const currentLimit = coerceNumber(merged.limit, nextListings.length || 1)
      const derivedHasMore = Boolean(
        payload.pagination?.hasMore ?? currentPage * currentLimit < totalFromResponse
      )
      setHasMore(derivedHasMore)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      setListings([])
      setTotalCount(0)
      setHasMore(false)
    } finally {
      setLoading(false)
    }
  }, [])

  const resetAndSearch = useCallback(async () => {
    if (Object.keys(initialRequestRef.current).length === 0) return
    await searchListings(initialRequestRef.current)
  }, [searchListings])

  // Provide a stable reference for future enhancements while avoiding unused warnings
  void resetAndSearch
  void lastRequestRef

  return {
    listings,
    loading,
    error,
    totalCount,
    hasMore,
    searchListings,
  }
}
