import { NeoButton } from '@/components/ui/neo-button'
import { ListingGrid } from '@/components/listings/ListingGrid'
import { SearchFiltersForm } from '@/components/search/SearchFiltersForm'
import type { ListingSummaryDTO } from '@/types/dto'
import Link from 'next/link'
import { z } from 'zod'
import type { SearchParamRecord } from '@/types/search'
import { NextRequest } from 'next/server'
import { GET as searchGetHandler } from '../../api/search/route'
import { mapResultToDTO } from './helpers'

const searchResponseSchema = z
  .object({
    data: z
      .object({
        results: z.array(z.unknown()).optional(),
        pagination: z
          .object({
            page: z.number().optional(),
            totalPages: z.number().optional(),
            hasMore: z.boolean().optional(),
            limit: z.number().optional(),
            total: z.number().optional(),
          })
          .optional(),
      })
      .optional(),
  })
  .passthrough()

function buildLink(searchParams: SearchParamRecord, overrides: Record<string, string>) {
  const params = new URLSearchParams()
  for (const [k, v] of Object.entries(searchParams)) {
    if (v === undefined) continue
    if (Array.isArray(v)) v.forEach((x) => params.append(k, x))
    else params.set(k, v)
  }
  for (const [k, v] of Object.entries(overrides)) params.set(k, v)
  return `/search/results?${params.toString()}`
}

type ResultsPageProps = { searchParams: SearchParamRecord | Promise<SearchParamRecord> }

export const dynamic = 'force-dynamic'

export default async function ResultsPage({ searchParams }: ResultsPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {}
  const retryRaw = resolvedSearchParams.retry
  const retryValue = Array.isArray(retryRaw) ? retryRaw[retryRaw.length - 1] : retryRaw
  const parsedRetry = Number.parseInt(String(retryValue ?? '0'), 10)
  const nextRetryCount = Number.isFinite(parsedRetry) ? parsedRetry + 1 : 1
  const retryLink = buildLink(resolvedSearchParams, { retry: String(nextRetryCount) })
  const url = new URL('/api/search', 'http://localhost')
  const params = new URLSearchParams()
  for (const [k, v] of Object.entries(resolvedSearchParams)) {
    if (v === undefined) continue
    if (Array.isArray(v)) v.forEach((x) => params.append(k, x))
    else params.set(k, v)
  }
  if (!params.has('page')) params.set('page', '1')
  if (!params.has('limit')) params.set('limit', '12')
  params.set('facets', '1')
  url.search = params.toString()
  let payload: unknown = null
  try {
    const request = new NextRequest(url.toString())
    const res = await searchGetHandler(request)

    if (!res.ok) {
      console.error(`Search API failed: ${res.status} ${res.statusText}`)
      return (
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col gap-4" data-testid="search-error-state">
            <p className="text-red-500">Failed to load search results. Please try again later.</p>
            <NeoButton asChild variant="outline" size="sm" data-testid="search-retry-button">
              <Link href={retryLink}>Retry search</Link>
            </NeoButton>
          </div>
          {process.env.NODE_ENV === 'development' && (
            <p className="text-sm text-gray-500 mt-2">
              Error: {res.status} {res.statusText}
            </p>
          )}
        </div>
      )
    }

    payload = await res.json()
  } catch (error) {
    console.error('Search API request failed', error)
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-4" data-testid="search-error-state">
          <p className="text-red-500">
            {'Failed to load search results. Please try again later.'}
          </p>
          <NeoButton asChild variant="outline" size="sm" data-testid="search-retry-button">
            <Link href={retryLink}>Retry search</Link>
          </NeoButton>
        </div>
        {process.env.NODE_ENV === 'development' && (
          <p className="text-sm text-gray-500 mt-2">
            Unexpected error occurred. Check server logs for details.
          </p>
        )}
      </div>
    )
  }

  const parsedResponse = searchResponseSchema.safeParse(payload)
  if (!parsedResponse.success) {
    console.error('Unexpected search API payload shape:', parsedResponse.error)
  }
  const rawResults =
    parsedResponse.success && Array.isArray(parsedResponse.data.data?.results)
      ? parsedResponse.data.data?.results ?? []
      : []
  let skippedCount = 0
  const mapped: ListingSummaryDTO[] = rawResults.reduce<ListingSummaryDTO[]>((acc, item) => {
    try {
      acc.push(mapResultToDTO(item))
    } catch (error) {
      skippedCount++
      console.error('Failed to map search result item:', {
        error,
        itemId: typeof item === 'object' && item && '_id' in item ? item._id : undefined,
        itemSlug: typeof item === 'object' && item && 'slug' in item ? item.slug : undefined,
      })
      // Skip invalid items instead of crashing the page
    }
    return acc
  }, [])
  const paginationData = parsedResponse.success ? parsedResponse.data.data?.pagination ?? {} : {}
  const pagination = {
    page: paginationData?.page ?? 1,
    totalPages: paginationData?.totalPages ?? 1,
    hasMore: Boolean(paginationData?.hasMore),
    limit: paginationData?.limit ?? Number(params.get('limit') || 12),
    total: paginationData?.total ?? 0,
  }
  const page = Math.max(1, Number(pagination.page ?? 1))
  const totalPages = Math.max(1, Number(pagination.totalPages ?? 1))
  const limit = Math.max(1, Number(pagination.limit ?? Number(params.get('limit') || 12)))
  const DEFAULT_PAGE_SIZES = [12, 24, 48, 96]
  const pageSizeOptions = DEFAULT_PAGE_SIZES.includes(limit)
    ? DEFAULT_PAGE_SIZES
    : [limit, ...DEFAULT_PAGE_SIZES].sort((a, b) => a - b)

  const prevLink = page > 1 ? buildLink(resolvedSearchParams, { page: String(page - 1) }) : null
  const nextLink =
    page < totalPages ? buildLink(resolvedSearchParams, { page: String(page + 1) }) : null

  // Build a compact page number list with ellipses
  function getPages(current: number, total: number): (number | '…')[] {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
    const pages: (number | '…')[] = []
    const add = (p: number | '…') => pages.push(p)
    add(1)
    if (current > 3) add('…')
    const start = Math.max(2, current - 1)
    const end = Math.min(total - 1, current + 1)
    for (let p = start; p <= end; p++) add(p)
    if (current < total - 2) add('…')
    add(total)
    return pages
  }
  const pages = getPages(page, totalPages)
  const MAX_PARAM_VALUE_LENGTH = 1000 // Prevent excessive URL length

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-10">
        <h1 className="heading-xl mb-8 text-center">Search for Sustainable Venues</h1>
        <SearchFiltersForm initialParams={resolvedSearchParams} />
      </div>
      <h2 className="heading-lg mb-4">Search Results</h2>
      {/* Page-size selector */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="body-sm text-neo-text-secondary">
          Showing page {page} of {totalPages}
        </div>
        <form action="/search/results" method="get" className="flex items-center gap-2">
          {/* preserve existing filters */}
          {Object.entries(resolvedSearchParams).map(([k, v]) => {
            // Sanitize parameter names to prevent injection
            if (!/^[a-zA-Z0-9_-]+$/.test(k)) return null
            return Array.isArray(v)
              ? v.map((x, idx) => (
                  <input
                    key={`${k}-${idx}`}
                    type="hidden"
                    name={k}
                    value={String(x).slice(0, MAX_PARAM_VALUE_LENGTH)}
                  />
                ))
              : (
                  <input
                    key={k}
                    type="hidden"
                    name={k}
                    value={String(v).slice(0, MAX_PARAM_VALUE_LENGTH)}
                  />
                )
          })}
          <label htmlFor="page-size" className="body-sm">
            Per page
          </label>
          <select
            id="page-size"
            name="limit"
            defaultValue={String(limit)}
            className="neo-input border-2 border-neo-border rounded px-2 py-1"
          >
            {pageSizeOptions.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <input type="hidden" name="page" value="1" />
          <NeoButton type="submit" variant="outline" size="sm">
            Apply
          </NeoButton>
        </form>
      </div>

      {mapped.length === 0 ? (
        <p className="text-neo-text-secondary">No results found.</p>
      ) : (
        <ListingGrid listings={mapped} />
      )}

      {/* Pagination controls */}
      <div className="flex items-center justify-center gap-2 mt-8">
        <NeoButton asChild variant="outline" size="sm" disabled={!prevLink}>
          <Link href={prevLink || '#'} aria-disabled={!prevLink}>
            Prev
          </Link>
        </NeoButton>
        {pages.map((p, i) =>
          p === '…' ? (
            <span key={`ellipsis-${i}`} className="px-2">
              …
            </span>
          ) : (
            <NeoButton
              key={`page-${p}`}
              asChild
              variant={p === page ? 'primary' : 'outline'}
              size="sm"
            >
              <Link
                href={buildLink(resolvedSearchParams, { page: String(p) })}
                aria-current={p === page ? 'page' : undefined}
              >
                {p}
              </Link>
            </NeoButton>
          ),
        )}
        <NeoButton asChild variant="outline" size="sm" disabled={!nextLink}>
.
          <Link href={nextLink || '#'} aria-disabled={!nextLink}>
            Next
          </Link>
        </NeoButton>
      </div>
    </div>
  )
}
