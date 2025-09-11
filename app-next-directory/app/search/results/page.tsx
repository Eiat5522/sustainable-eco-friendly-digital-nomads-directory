import { NeoButton } from '@/components/ui/neo-button'
import { ListingGrid } from '@/components/listings/ListingGrid'
import type { ListingSummaryDTO } from '@/types/dto'
import Link from 'next/link'
import { getBaseUrl } from '@/lib/absolute-url'

function mapResultToDTO(item: any): ListingSummaryDTO {
  const city = item.city ?? item.location ?? null
  const imageUrl: string | undefined = item?.primaryImage?.asset?.url ?? undefined
  const slug: string = typeof item.slug === 'string' ? item.slug : (item.slug?.current ?? '')
  return {
    id: String(item._id ?? slug ?? 'unknown'),
    name: String(item.name ?? ''),
    slug,
    type: (item.category ?? 'coworking') as ListingSummaryDTO['type'],
    city: city
      ? {
          id: String(city._id ?? ''),
          name: String(city.name ?? ''),
          slug: String(city.slug ?? ''),
          country: String(city.country ?? ''),
        }
      : null,
    imageUrl,
    shortDescription: item.shortDescription ?? undefined,
    amenityNames: Array.isArray(item.amenityNames)
      ? item.amenityNames.filter((v: any) => typeof v === 'string')
      : undefined,
  }
}

function buildLink(searchParams: Record<string, string | string[] | undefined>, overrides: Record<string, string>) {
  const params = new URLSearchParams()
  for (const [k, v] of Object.entries(searchParams)) {
    if (v === undefined) continue
    if (Array.isArray(v)) v.forEach((x) => params.append(k, x))
    else params.set(k, v)
  }
  for (const [k, v] of Object.entries(overrides)) params.set(k, v)
  return `/search/results?${params.toString()}`
}

export default async function ResultsPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const base = await getBaseUrl()
  const url = new URL('/api/search', base)
  const params = new URLSearchParams()
  for (const [k, v] of Object.entries(searchParams)) {
    if (v === undefined) continue
    if (Array.isArray(v)) v.forEach((x) => params.append(k, x))
    else params.set(k, v)
  }
  if (!params.has('page')) params.set('page', '1')
  if (!params.has('limit')) params.set('limit', '12')
  params.set('facets', '1')
  url.search = params.toString()

  const res = await fetch(url.toString(), { cache: 'no-store' })
  if (!res.ok) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-red-500">Failed to load search results.</p>
      </div>
    )
  }
  const data = await res.json()
  const raw = Array.isArray(data?.data?.results) ? data.data.results : []
  const mapped: ListingSummaryDTO[] = raw.map(mapResultToDTO)
  const pagination = data?.data?.pagination ?? { page: 1, totalPages: 1, hasMore: false, limit: Number(params.get('limit') || 12), total: 0 }
  const page = Math.max(1, Number(pagination.page ?? 1))
  const totalPages = Math.max(1, Number(pagination.totalPages ?? 1))
  const limit = Math.max(1, Number(pagination.limit ?? Number(params.get('limit') || 12)))

  const prevLink = page > 1 ? buildLink(searchParams, { page: String(page - 1) }) : null
  const nextLink = page < totalPages ? buildLink(searchParams, { page: String(page + 1) }) : null

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

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="heading-lg mb-4">Search Results</h2>
      {/* Page-size selector */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="body-sm text-neo-text-secondary">
          Showing page {page} of {totalPages}
        </div>
        <form action="/search/results" method="get" className="flex items-center gap-2">
          {/* preserve existing filters */}
          {Object.entries(searchParams).map(([k, v]) => {
            // Sanitize parameter names to prevent injection
            if (!/^[a-zA-Z0-9_-]+$/.test(k)) return null
            return Array.isArray(v)
              ? v.map((x, idx) => <input key={`${k}-${idx}`} type="hidden" name={k} value={String(x).slice(0, 1000)} />)
              : <input key={k} type="hidden" name={k} value={String(v).slice(0, 1000)} />
          })}
          <label htmlFor="page-size" className="body-sm">Per page</label>
          <select id="page-size" name="limit" defaultValue={String(limit)} className="neo-input border-2 border-neo-border rounded px-2 py-1">
            {[12, 24, 48, 96].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          <input type="hidden" name="page" value="1" />
          <NeoButton type="submit" variant="outline" size="sm">Apply</NeoButton>
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
          <Link href={prevLink || '#'} aria-disabled={!prevLink}>Prev</Link>
        </NeoButton>
        {pages.map((p, i) => (
          p === '…' ? (
            <span key={`ellipsis-${i}`} className="px-2">…</span>
          ) : (
            <NeoButton
              key={`page-${p}`}
              asChild
              variant={p === page ? 'primary' : 'outline'}
              size="sm"
            >
              <Link href={buildLink(searchParams, { page: String(p) })} aria-current={p === page ? 'page' : undefined}>
                {p}
              </Link>
            </NeoButton>
          )
        ))}
      </div>
    </div>
  )
}
