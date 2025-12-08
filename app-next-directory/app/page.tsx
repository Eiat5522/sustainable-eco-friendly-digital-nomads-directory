'use client';

import React from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { CityCarousel } from '@/components/sections/CityCarousel';
import { FeaturedListings } from '@/components/sections/FeaturedListings';
import { HeroSection } from '@/components/sections/HeroSection';

export default function HomePage() {
  return (
    <PageLayout>
      <HeroSection />
      <CityCarousel />
      <FeaturedListings />
    </PageLayout>
  );
}
