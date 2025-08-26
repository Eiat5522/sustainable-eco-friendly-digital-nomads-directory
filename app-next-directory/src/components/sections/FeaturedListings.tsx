"use client"

import React, { useEffect, useState } from 'react'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { VenueCard } from '@/components/ui/VenueCard'
import { mockFeaturedVenues } from './featuredVenuesMockData'
import type { FeaturedListingDTO } from '@/types/dto'

export function FeaturedListings() {
  const [listings, setListings] = useState<FeaturedListingDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchListings = async () => {
      try {
        // Simulate API call - in production this would fetch from /api/featured-listings
        await new Promise(resolve => setTimeout(resolve, 500))
        setListings(mockFeaturedVenues)
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
          {listings.map((listing) => (
            <VenueCard 
              key={listing.id} 
              venue={listing}
            />
          ))}
        </div>
      </div>
    </section>
  )
}