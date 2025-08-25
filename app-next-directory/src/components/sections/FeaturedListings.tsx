"use client"

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import { NeoCard, NeoCardHeader, NeoCardTitle } from '@/components/ui/neo-card'
import type { FeaturedListingDTO } from '@/types/dto'

export function FeaturedListings() {
  const [listings, setListings] = useState<FeaturedListingDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const response = await fetch('/api/featured-listings')
        if (!response.ok) {
          throw new Error('Failed to fetch featured listings')
        }
        const data = await response.json()
        setListings(data.listings)
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
        <div className="text-center mb-12">
          <h2 className="heading-lg mb-4">Featured Sustainable Venues</h2>
          <p className="body-lg max-w-2xl mx-auto">
            Handpicked eco-friendly spaces that prioritize sustainability without compromising on quality
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {listings.map((listing, idx) => (
            <NeoCard key={listing.id} variant="elevated" className="group hover:shadow-[16px_16px_0px_0px] transition-all duration-300">
              <div className="relative h-48 mb-4 overflow-hidden rounded-lg">
                {listing.imageUrl && (
                  <Image
                    src={listing.imageUrl}
                    alt={`${listing.name} — sustainable ${(listing.type || 'venue').toLowerCase()} in ${listing.city?.name ?? 'unknown city'}`}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                )}
              </div>

              <NeoCardHeader>
                <NeoCardTitle>{listing.name}</NeoCardTitle>
              </NeoCardHeader>
            </NeoCard>
          ))}
        </div>
      </div>
    </section>
  )
}
