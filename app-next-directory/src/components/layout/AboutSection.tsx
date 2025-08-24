"use client"

import React from 'react'
import { NeoCard, NeoCardContent } from '@/components/ui/neo-card'
import { NeoButton } from '@/components/ui/neo-button'
import { Leaf, Users, Globe, Heart } from 'lucide-react'

const features = [
  {
    icon: Leaf,
    title: 'Sustainability First',
    description: 'Every venue is verified for eco-friendly practices and environmental impact'
  },
  {
    icon: Users,
    title: 'Community Driven',
    description: 'Built by nomads, for nomads. Real reviews from the digital nomad community'
  },
  {
    icon: Globe,
    title: 'Global Network',
    description: 'Discover sustainable spaces in over 150 cities worldwide'
  },
  {
    icon: Heart,
    title: 'Impact Focused',
    description: 'Supporting local communities and sustainable tourism practices'
  }
]

export function AboutSection() {
  return (
    <section className="py-20 bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 relative overflow-hidden">
      {/* Wavy Background Graphics */}
      <div className="absolute inset-0 opacity-10">
        <svg className="absolute top-0 left-0 w-full h-full" viewBox="0 0 1200 800" fill="none">
          <path d="M0,400 Q300,200 600,400 T1200,400 V800 H0 Z" fill="currentColor" className="text-neo-primary" />
          <path d="M0,500 Q400,300 800,500 T1200,500 V800 H0 Z" fill="currentColor" className="text-neo-secondary" />
        </svg>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <h2 className="heading-lg mb-6">Who We Are</h2>
          <p className="body-lg max-w-3xl mx-auto text-neo-text-secondary">
            We're on a mission to make sustainable travel accessible to every digital nomad. 
            Our platform connects conscious travelers with eco-friendly venues that care about 
            their environmental impact and local communities.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <NeoCard key={index} variant="elevated" className="text-center group hover:shadow-[12px_12px_0px_0px] transition-all duration-300">
                <NeoCardContent className="p-8">
                  <div className="w-16 h-16 bg-neo-primary rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-neo-secondary transition-colors duration-300">
                    <Icon size={28} className="text-white" />
                  </div>
                  <h3 className="heading-sm mb-3">{feature.title}</h3>
                  <p className="body-md">{feature.description}</p>
                </NeoCardContent>
              </NeoCard>
            )
          })}
        </div>

        <div className="text-center">
          <NeoCard variant="elevated" className="inline-block p-8 bg-gradient-to-r from-neo-primary to-blue-600 text-white">
            <NeoCardContent>
              <h3 className="heading-md mb-4">Join Our Mission</h3>
              <p className="body-lg mb-6 max-w-2xl">
                Help us build the world's largest directory of sustainable venues. 
                Add your favorite eco-friendly spots and help fellow nomads travel responsibly.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <NeoButton variant="secondary" size="lg">
                  Add a Venue
                </NeoButton>
                <NeoButton variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-neo-primary">
                  Learn More
                </NeoButton>
              </div>
            </NeoCardContent>
          </NeoCard>
        </div>
      </div>
    </section>
  )
}