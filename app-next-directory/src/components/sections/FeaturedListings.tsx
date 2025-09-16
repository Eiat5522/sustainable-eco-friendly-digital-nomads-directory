"use client"

import React, { useEffect, useState, useCallback, useRef } from 'react'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { VenueCard } from '@/components/ui/VenueCard'
import type { FeaturedListingDTO } from '@/types/dto'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { NeoButton } from '@/components/ui/neo-button'
import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'

export function FeaturedListings() {
  const [listings, setListings] = useState<FeaturedListingDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // NOTE: All hooks must be declared unconditionally and before any early returns
  // to preserve hook order across renders.
  // Embla carousel setup
  const autoplay = useRef(
    Autoplay({ delay: 4000, stopOnInteraction: false })
  )
  const [viewportRef, emblaApi] = useEmblaCarousel(
    {
      align: 'start',
      containScroll: 'trimSnaps',
      loop: true,
      skipSnaps: false,
    },
    [autoplay.current]
  )
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setCanPrev(emblaApi.canScrollPrev())
    setCanNext(emblaApi.canScrollNext())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    onSelect()
    emblaApi.on('select', onSelect)
    emblaApi.on('reInit', onSelect)
    return () => {
      emblaApi.off('select', onSelect)
      emblaApi.off('reInit', onSelect)
    }
  }, [emblaApi, onSelect])

  useEffect(() => {
    const controller = new AbortController()
    const fetchListings = async () => {
      try {
        const res = await fetch('/api/featured-listings', { signal: controller.signal })
        if (!res.ok) throw new Error('Failed to fetch featured listings')
        const data = await res.json()
        // Accept shapes: { success: true, listings }, { listings }, { data: { listings } }
        const list: FeaturedListingDTO[] = Array.isArray(data?.listings)
          ? data.listings
          : Array.isArray(data?.data?.listings)
            ? data.data.listings
            : []
        // Normalize any unexpected shapes from API (e.g., city as object)
        const normalized = list.map((l: any) => ({
          ...l,
          city: typeof l?.city === 'object' ? (l?.city?.name ?? '') : (l?.city ?? ''),
        })) as FeaturedListingDTO[]
        setListings(normalized)
      } catch (err) {
        if ((err as any)?.name === 'AbortError') return
        setError(err instanceof Error ? err.message : 'An unknown error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchListings()
    return () => controller.abort()
  }, [])

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi])

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <SectionHeader 
          title="Featured Sustainable Venues"
          description="Handpicked eco-friendly spaces that prioritize sustainability without compromising on quality"
        />

        {loading ? (
          <div className="text-center">
            <p className="body-lg">Loading featured listings...</p>
          </div>
        ) : error ? (
          <div className="text-center">
            <p className="body-lg text-red-500">Error: {error}</p>
          </div>
        ) : (
          <div className="relative">
            {/* Nav buttons */}
            <NeoButton
              variant="secondary"
              size="sm"
              className="hidden md:flex absolute -left-3 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white"
              aria-label="Scroll featured left"
              onClick={scrollPrev}
              disabled={!canPrev}
              onMouseEnter={() => autoplay.current?.stop()}
              onMouseLeave={() => autoplay.current?.play()}
            >
              <ChevronLeft size={18} />
            </NeoButton>
            <NeoButton
              variant="secondary"
              size="sm"
              className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white"
              aria-label="Scroll featured right"
              onClick={scrollNext}
              disabled={!canNext}
              onMouseEnter={() => autoplay.current?.stop()}
              onMouseLeave={() => autoplay.current?.play()}
            >
              <ChevronRight size={18} />
            </NeoButton>

            {/* Embla viewport & container */}
            <div
              ref={viewportRef}
              className="overflow-hidden"
              role="region"
              aria-label="Featured venues carousel"
            >
              <div className="flex gap-6">
                {listings.map((listing, index) => (
                  <div
                    key={listing.id}
                    className="shrink-0 basis-[85%] sm:basis-[60%] lg:basis-1/3"
                  >
                    <VenueCard venue={listing} priority={index < 3} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
