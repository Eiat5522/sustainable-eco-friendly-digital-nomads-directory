'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { SearchBox } from '@/components/search/SearchBox'
import { FiltersSidebar } from '@/components/search/FiltersSidebar'
import { ListingGrid } from '@/components/listings/ListingGrid'
import { NeoCard, NeoCardContent } from '@/components/ui/neo-card'
import type { ListingSummaryDTO } from '@/types/dto'

type ApiSearchResult = {
  id?: string
  _id?: string
  slug?: string | { current?: string }
  name?: string
  type?: string
  category?: string
  city?: { name?: string } | string
  location?: { name?: string } | { lat?: number; lng?: number } | { coordinates?: [number, number] } | null
  primaryImage?: { asset?: { url?: string }; url?: string }
  ecoTags?: Array<string | { name?: string }>
  ecoFeatures?: Array<string | { name?: string }>
  nomadFeatures?: string[]
  digitalNomadFeatures?: string[]
  website?: string
  address?: string
  coordinates?: { lat?: number; lng?: number } | [number, number]
  shortDescription?: string
  descriptionShort?: string
  amenities?: Array<string | { name?: string }>
}

type SearchApiResponse = {
  results: ApiSearchResult[]
  pagination?: { total?: number }
}

function mapToListingSummary(results: ApiSearchResult[]): ListingSummaryDTO[] {
  return (results || []).map((r: any) => {
    const slug = typeof r.slug === 'string' ? r.slug : r?.slug?.current || ''
    const cityName = r?.city?.name || r?.location?.name || r?.city || ''
    const imageUrl = r?.primaryImage?.asset?.url || r?.primaryImage?.url || undefined
    return {
      id: r.id || r._id,
      slug,
      name: r.name,
      type: r.type,
      category: r.category,
      city: cityName,
      imageUrl,
      ecoTags: r.ecoTags?.map((t: any) => (typeof t === 'string' ? t : t.name)) || [],
      shortDescription: r.shortDescription || r.descriptionShort,
      amenities: r.amenities?.map((a: any) => (typeof a === 'string' ? a : a.name)) || [],
    }
  })
}

export default function SearchPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const query = searchParams.get('q') || ''
  const page = Number(searchParams.get('page') || '1') || 1
  const rawLimit = Number(searchParams.get('limit') || '12') || 12
  const limit = Math.min(100, Math.max(1, rawLimit))
  const body = useMemo(() => {
    // Build POST body for /api/search
    const category = searchParams.getAll('category')
    const destination = searchParams.getAll('destination')
    const amenities = searchParams.getAll('amenities')
    const nomadFeatures = searchParams.getAll('nomadFeatures')
    return {
      query,
      page,
      limit,
      category,
      destination,
      amenities,
      nomadFeatures,
    }
  }, [query, page, limit, searchParams.toString()])
  const [listings, setListings] = useState<ListingSummaryDTO[]>([])
  const [total, setTotal] = useState<number>(0)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  useEffect(() => {
    const controller = new AbortController()
    let canceled = false

    async function run() {
      setIsLoading(true)
      try {
        const res = await fetch('/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: controller.signal,
        })
        if (!res.ok) throw new Error('Failed to fetch search results')
        const data = await res.json()
        if (!canceled) {
          setListings(mapToListingSummary(data.results || []))
          setTotal(data.pagination?.total || 0)
        }
      } catch (err: any) {
        if (err?.name === 'AbortError') {
          // Ignore abort errors to avoid clearing state on unmount/body change
        } else if (!canceled) {
          setListings([])
          setTotal(0)
        }
      } finally {
        if (!canceled) setIsLoading(false)
      }
    }

    run()

    return () => {
      canceled = true
      controller.abort()
    }
  }, [body])

  // Simple pagination controls (optional)
  const goToPage = (p: number) => {
    const params = new URLSearchParams(Array.from(searchParams.entries()))
    params.set('page', String(Math.max(1, p)))
    router.push(`/search?${params.toString()}`)
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-10">
        <SearchBox placeholder="Search eco-friendly venues..." />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <aside className="lg:col-span-4 xl:col-span-3">
            <FiltersSidebar />
          </aside>
          <section className="lg:col-span-8 xl:col-span-9 space-y-4">
            <NeoCard variant="flat">
              <NeoCardContent className="p-4 flex items-center justify-between">
                <div className="body-md">
                  {isLoading ? 'Loading results…' : `${total} result${total === 1 ? '' : 's'}`}
                </div>
              </NeoCardContent>
            </NeoCard>
            {listings.length > 0 ? (
              <ListingGrid listings={listings} />
            ) : (
              <NeoCard variant="flat">
                <NeoCardContent className="p-6 body-md text-neo-text-secondary">
                  {isLoading ? 'Searching…' : 'No results found. Try adjusting your search or filters.'}
                </NeoCardContent>
              </NeoCard>
            )}
            {/* Basic pagination controls */}
            <div className="flex gap-2">
              <button className="neo-button neo-button-hover bg-neo-surface px-4 py-2 rounded-lg" onClick={() => goToPage(Math.max(1, page - 1))} disabled={page <= 1}>
                Previous
              </button>
              <button className="neo-button neo-button-hover bg-neo-surface px-4 py-2 rounded-lg" onClick={() => goToPage(page + 1)}>
                Next
              </button>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}
