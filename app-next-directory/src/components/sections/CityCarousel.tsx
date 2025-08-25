"use client"

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import { NeoCard, NeoCardContent, NeoCardHeader, NeoCardTitle } from '@/components/ui/neo-card'
import { NeoButton } from '@/components/ui/neo-button'
import { NeoBadge } from '@/components/ui/neo-badge'
import { ChevronLeft, ChevronRight, Leaf, MapPin } from 'lucide-react'
import type { CityDTO } from '@/types/dto'

export function CityCarousel() {
  const [cities, setCities] = useState<CityDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentIndex, setCurrentIndex] = React.useState(0)

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const response = await fetch('/api/cities')
        if (!response.ok) {
          throw new Error('Failed to fetch cities')
        }
        const data = await response.json()
        setCities(data.cities)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchCities()
  }, [])

  const handleExploreCity = (cityId: string) => {
    // TODO: Implement navigation to city details page
    console.log(`Exploring city with id: ${cityId}`)
  }

  if (loading) {
    return (
      <section className="py-16 bg-gradient-to-r from-green-50 to-blue-50">
        <div className="container mx-auto px-4 text-center">
          <p className="body-lg">Loading cities...</p>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="py-16 bg-gradient-to-r from-green-50 to-blue-50">
        <div className="container mx-auto px-4 text-center">
          <p className="body-lg text-red-500">Error: {error}</p>
        </div>
      </section>
    )
  }

  return (
    <section className="py-16 bg-gradient-to-r from-green-50 to-blue-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="heading-lg mb-4">Top Sustainable Cities</h2>
            <p className="body-lg text-neo-text-secondary">
              Explore cities leading the way in sustainable living and digital nomad infrastructure
            </p>
          </div>
          
          <div className="hidden md:flex space-x-2">
            <NeoButton 
              variant="outline" 
              size="sm"
              onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
              disabled={currentIndex === 0}
            >
              <ChevronLeft size={20} />
            </NeoButton>
            <NeoButton 
              variant="outline" 
              size="sm"
              onClick={() => setCurrentIndex(Math.min(cities.length - 1, currentIndex + 1))}
              disabled={currentIndex === cities.length - 1}
            >
              <ChevronRight size={20} />
            </NeoButton>
          </div>
        </div>

        <div className="flex transition-transform duration-300 gap-8" style={{ transform: `translateX(-${currentIndex * 320}px)` }}>
          {cities.map((city) => (
            <NeoCard
              key={city.id}
              variant="elevated"
             role="listitem"
              className="w-80 flex-none group hover:shadow-[16px_16px_0px_0px] transition-all duration-300 overflow-hidden"
            >
              <div className="relative h-56 -m-6 mb-4">
                {city.imageUrl ? (
                  <Image
                    src={city.imageUrl}
                    alt={`${city.name}, ${city.country}`}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    // keep Next/Image layout responsive; dimensions are advisory for consumers
                    // when we have explicit dimensions we leave them available in DTO for other components
                  />
                ) : (
                  <div className="absolute inset-0 bg-gray-200 flex items-center justify-center"> 
                    <span className="text-neo-text-secondary">No image</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                
                <div className="absolute top-4 left-4 flex space-x-2">
                  {city.sustainabilityScore && (
                    <NeoBadge variant="success" className="flex items-center space-x-1">
                      <Leaf size={12} />
                      <span>{city.sustainabilityScore}%</span>
                    </NeoBadge>
                  )}
                </div>

                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="heading-md text-white mb-1">{city.name}</h3>
                  <p className="body-sm text-white/80">{city.country}</p>
                </div>
              </div>

              <NeoCardContent className="px-6 pb-6">
                <div className="flex flex-wrap gap-2 mb-4">
                  {city.highlights?.map((highlight) => (
                    <NeoBadge key={highlight} variant="outline" size="sm">
                      {highlight}
                    </NeoBadge>
                  ))}
                </div>
                
                <div className="flex items-center justify-between">
                  <NeoButton variant="primary" size="sm" onClick={() => handleExploreCity(city.id)}>
                    Explore City
                  </NeoButton>
                </div>
              </NeoCardContent>
            </NeoCard>
          ))}
        </div>
      </div>
    </section>
  )
}
