'use client';

import React from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { HeroSection } from '@/components/sections/HeroSection';
import { FeaturedListings } from '@/components/sections/FeaturedListings';
import { CityCarousel } from '@/components/sections/CityCarousel';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <FeaturedListings />
        <React.Suspense
          fallback={
            <div
              className="h-48 rounded-lg bg-muted animate-pulse"
              role="status"
              aria-label="Loading city carousel"
              aria-busy="true"
            />
          }
        >
          <CityCarousel />
        </React.Suspense>
      </main>
      <Footer />
    </div>
  );
}
