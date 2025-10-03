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
  const activeRequest = useRef<number>(0)
  const abortRef = useRef<AbortController | null>(null)

  const DEFAULT_ERROR_MESSAGE = 'Failed to load featured listings. Please try again.'

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

  const loadListings = useCallback(async () => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    const requestId = activeRequest.current + 1
    activeRequest.current = requestId

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/featured-listings', { signal: controller.signal })
      if (!res.ok) throw new Error(DEFAULT_ERROR_MESSAGE)
      const data = await res.json()
      const list: FeaturedListingDTO[] = Array.isArray(data?.listings)
        ? data.listings
        : Array.isArray(data?.data?.listings)
          ? data.data.listings
          : []
      const normalized = list.map((l: any) => ({
        ...l,
        city: typeof l?.city === 'object' ? (l?.city?.name ?? '') : (l?.city ?? ''),
      })) as FeaturedListingDTO[]

      if (controller.signal.aborted || activeRequest.current !== requestId) return
      setListings(normalized)
      setError(null)
    } catch (err) {
      if (controller.signal.aborted || activeRequest.current !== requestId) return

      const message = err instanceof Error && err.message && !/fetch failed/i.test(err.message)
        ? err.message
        : DEFAULT_ERROR_MESSAGE
      console.error('[FeaturedListings] failed to load listings', err)
      setError(message)
    } finally {
      if (controller.signal.aborted || activeRequest.current !== requestId) return
      setLoading(false)
      if (abortRef.current === controller) {
        abortRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    void loadListings()
    return () => {
      abortRef.current?.abort()
      abortRef.current = null
    }
  }, [loadListings])

  const handleRetry = useCallback(() => {
    void loadListings()
  }, [loadListings])

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
          <div className="text-center space-y-4">
            <p className="body-lg text-red-500" role="alert">{error}</p>
            <NeoButton variant="primary" onClick={handleRetry} disabled={loading}>
              Retry
            </NeoButton>
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
                                        <VenueCard venue={listing} priority={index < 3} className="h-full w-full" />
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
