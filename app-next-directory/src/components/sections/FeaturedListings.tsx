"use client"

import React, { useEffect, useState } from 'react'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { VenueCard } from '@/components/ui/VenueCard'
import type { FeaturedListingDTO } from '@/types/dto'

export function FeaturedListings() {
  const [listings, setListings] = useState<FeaturedListingDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const res = await fetch('/api/featured-listings', { next: { revalidate: 300 } })
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
        setError(err instanceof Error ? err.message : 'An unknown error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchListings()
  }, [])

  if (loading) {
    return (
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 text-center">
          <p className="body-lg">Loading featured listings...</p>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 text-center">
          <p className="body-lg text-red-500">Error: {error}</p>
        </div>
      </section>
    )
  }

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <SectionHeader 
          title="Featured Sustainable Venues"
          description="Handpicked eco-friendly spaces that prioritize sustainability without compromising on quality"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {listings.map((listing, index) => (
            <VenueCard 
              key={listing.id} 
              venue={listing}
              priority={index < 3}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
