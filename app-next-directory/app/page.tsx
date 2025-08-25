import React from 'react'
import { Header } from '@/components/layout/Header'
import { HeroSection } from '@/components/sections/HeroSection'
import { CategoryFilters } from '@/components/sections/CategoryFilters'
import { FeaturedListings } from '@/components/sections/FeaturedListings'
import { CityCarousel } from '@/components/sections/CityCarousel'
import { AboutSection } from '@/components/sections/AboutSection'
import { TestimonialsSection } from '@/components/sections/TestimonialsSection'
import { Footer } from '@/components/layout/Footer'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <CategoryFilters />
        <FeaturedListings />
        <CityCarousel />
        <AboutSection />
        <TestimonialsSection />
      </main>
      <Footer />
    </div>
  )
}