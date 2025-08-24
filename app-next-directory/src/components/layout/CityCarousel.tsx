"use client"

import React from 'react'
import Image from 'next/image'
import { NeoCard, NeoCardContent, NeoCardHeader, NeoCardTitle } from '@/components/ui/neo-card'
import { NeoButton } from '@/components/ui/neo-button'
import { NeoBadge } from '@/components/ui/neo-badge'
import { ChevronLeft, ChevronRight, Leaf, MapPin } from 'lucide-react'

const cities = [
  {
    id: 1,
    name: 'Bali',
    country: 'Indonesia',
    sustainabilityScore: 94,
    nomadFriendly: 98,
    imageUrl: 'https://images.unsplash.com/photo-1555400038-a088c772c8cd?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTAwNDR8MHwxfHNlYXJjaHwyfHxiYWxpJTIwcmljZSUyMHRlcnJhY2VzJTIwdHJvcGljYWwlMjBzdXN0YWluYWJsZSUyMG5hdHVyZXxlbnwwfDB8fGdyZWVufDE3NTYwMjAzOTh8MA&ixlib=rb-4.1.0&q=85',
    attribution: 'Niklas Weiss on Unsplash',
    highlights: ['Rice Terraces', 'Eco Resorts', 'Yoga Retreats'],
    venueCount: 234
  },
  {
    id: 2,
    name: 'Lisbon',
    country: 'Portugal',
    sustainabilityScore: 87,
    nomadFriendly: 95,
    imageUrl: 'https://images.unsplash.com/photo-1562561568-e1ab23be103e?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTAwNDR8MHwxfHNlYXJjaHwzfHxsaXNib24lMjBjb2xvcmZ1bCUyMGJ1aWxkaW5ncyUyMHRyYW0lMjB1cmJhbiUyMHBvcnR1Z2FsfGVufDB8MHx8b3JhbmdlfDE3NTYwMjAzOTh8MA&ixlib=rb-4.1.0&q=85',
    attribution: 'Luis Soto on Unsplash',
    highlights: ['Historic Trams', 'Green Initiatives', 'Tech Hub'],
    venueCount: 189
  },
  {
    id: 3,
    name: 'Costa Rica',
    country: 'Central America',
    sustainabilityScore: 96,
    nomadFriendly: 89,
    imageUrl: 'https://images.unsplash.com/photo-1648999496322-da07fa6a7d27?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTAwNDR8MHwxfHNlYXJjaHwzfHxiYWxpJTIwcmljZSUyMHRlcnJhY2VzJTIwdHJvcGljYWwlMjBzdXN0YWluYWJsZSUyMG5hdHVyZXxlbnwwfDB8fGdyZWVufDE3NTYwMjAzOTh8MA&ixlib=rb-4.1.0&q=85',
    attribution: 'Sofianna p on Unsplash',
    highlights: ['Biodiversity', 'Renewable Energy', 'Eco Tourism'],
    venueCount: 156
  }
]

export function CityCarousel() {
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
            <NeoButton variant="outline" size="sm">
              <ChevronLeft size={20} />
            </NeoButton>
            <NeoButton variant="outline" size="sm">
              <ChevronRight size={20} />
            </NeoButton>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {cities.map((city) => (
            <NeoCard key={city.id} variant="elevated" className="group hover:shadow-[16px_16px_0px_0px] transition-all duration-300 overflow-hidden">
              <div className="relative h-56 mb-4 -m-6 mb-2">
                <Image
                  src={city.imageUrl}
                  alt={`${city.name}, ${city.country} - ${city.attribution}`}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                
                <div className="absolute top-4 left-4 flex space-x-2">
                  <NeoBadge variant="success" className="flex items-center space-x-1">
                    <Leaf size={12} />
                    <span>{city.sustainabilityScore}%</span>
                  </NeoBadge>
                  <NeoBadge variant="secondary" className="flex items-center space-x-1">
                    <MapPin size={12} />
                    <span>{city.nomadFriendly}%</span>
                  </NeoBadge>
                </div>

                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="heading-md text-white mb-1">{city.name}</h3>
                  <p className="body-sm text-white/80">{city.country}</p>
                </div>
              </div>

              <NeoCardContent className="px-6 pb-6">
                <div className="flex flex-wrap gap-2 mb-4">
                  {city.highlights.map((highlight) => (
                    <NeoBadge key={highlight} variant="outline" size="sm">
                      {highlight}
                    </NeoBadge>
                  ))}
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="body-sm text-neo-text-secondary">
                    {city.venueCount} sustainable venues
                  </span>
                  <NeoButton variant="primary" size="sm">
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