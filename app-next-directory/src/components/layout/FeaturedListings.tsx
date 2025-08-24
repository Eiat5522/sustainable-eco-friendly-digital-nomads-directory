"use client"

import React from 'react'
import Image from 'next/image'
import { NeoCard, NeoCardContent, NeoCardDescription, NeoCardHeader, NeoCardTitle } from '@/components/ui/neo-card'
import { NeoButton } from '@/components/ui/neo-button'
import { NeoBadge } from '@/components/ui/neo-badge'
import { ExternalLink, Leaf } from 'lucide-react'

const featuredListings = [
  {
    id: 1,
    name: 'EcoWork Bali',
    description: 'Discover sustainable coworking spaces with solar power and zero-waste initiatives',
    type: 'Coworking',
    location: 'Canggu, Bali',
    sustainabilityScore: 95,
    imageUrl: 'https://images.unsplash.com/photo-1611651625032-153048f0da00?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTAwNDR8MHwxfHNlYXJjaHwxfHxjb3dvcmtpbmclMjBvZmZpY2UlMjB3b3Jrc3BhY2UlMjBwbGFudHMlMjBzdXN0YWluYWJsZXxlbnwwfDB8fGdyZWVufDE3NTYwMjAzOTh8MA&ixlib=rb-4.1.0&q=85',
    attribution: 'Joran Quinten on Unsplash',
    features: ['Solar Power', 'Zero Waste', 'Local Materials']
  },
  {
    id: 2,
    name: 'Green Bean Cafe',
    description: 'Organic coffee with locally sourced ingredients and compostable packaging',
    type: 'Cafe',
    location: 'Lisbon, Portugal',
    sustainabilityScore: 88,
    imageUrl: 'https://images.unsplash.com/photo-1658124927533-991e4fbc26b5?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTAwNDR8MHwxfHNlYXJjaHwyfHxjYWZlJTIwY29mZmVlJTIwd29vZGVuJTIwc3VzdGFpbmFibGUlMjBpbnRlcmlvcnxlbnwwfDB8fHwxNzU2MDIwMzk4fDA&ixlib=rb-4.1.0&q=85',
    attribution: 'Kouji Tsuru on Unsplash',
    features: ['Organic Coffee', 'Local Sourcing', 'Compostable']
  },
  {
    id: 3,
    name: 'Bamboo Lodge',
    description: 'Eco-friendly accommodation built with sustainable bamboo and renewable energy',
    type: 'Accommodation',
    location: 'Tulum, Mexico',
    sustainabilityScore: 92,
    imageUrl: 'https://images.unsplash.com/photo-1651804279590-8b0e12c520b5?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTAwNDR8MHwxfHNlYXJjaHw1fHxob3RlbCUyMGFjY29tbW9kYXRpb24lMjBzdXN0YWluYWJsZSUyMGVjbyUyMGJlZHJvb218ZW58MHwwfHx8MTc1NjAyMDM5OHww&ixlib=rb-4.1.0&q=85',
    attribution: 'CHUTTERSNAP on Unsplash',
    features: ['Bamboo Construction', 'Solar Energy', 'Water Conservation']
  }
]

export function FeaturedListings() {
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
          {featuredListings.map((listing) => (
            <NeoCard key={listing.id} variant="elevated" className="group hover:shadow-[16px_16px_0px_0px] transition-all duration-300">
              <div className="relative h-48 mb-4 overflow-hidden rounded-lg">
                <Image
                  src={listing.imageUrl}
                  alt={`${listing.name} - ${listing.attribution}`}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-4 left-4">
                  <NeoBadge variant="success" className="flex items-center space-x-1">
                    <Leaf size={12} />
                    <span>{listing.sustainabilityScore}%</span>
                  </NeoBadge>
                </div>
                <div className="absolute top-4 right-4">
                  <NeoBadge variant="outline" className="bg-white/90 text-neo-text-primary">
                    {listing.type}
                  </NeoBadge>
                </div>
              </div>

              <NeoCardHeader>
                <NeoCardTitle>{listing.name}</NeoCardTitle>
                <p className="body-sm text-neo-text-secondary">{listing.location}</p>
              </NeoCardHeader>

              <NeoCardContent>
                <NeoCardDescription className="mb-4">
                  {listing.description}
                </NeoCardDescription>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {listing.features.map((feature) => (
                    <NeoBadge key={feature} variant="secondary" size="sm">
                      {feature}
                    </NeoBadge>
                  ))}
                </div>

                <div className="flex space-x-2">
                  <NeoButton variant="primary" size="sm" className="flex-1">
                    View Details
                  </NeoButton>
                  <NeoButton variant="outline" size="sm">
                    <ExternalLink size={16} />
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