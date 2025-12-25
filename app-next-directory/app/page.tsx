use server';

import { cache } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { CityCarousel } from '@/components/sections/CityCarousel';
import { FeaturedListings } from '@/components/sections/FeaturedListings';
import { HeroSection } from '@/components/sections/HeroSection';
import { getFeaturedListings } from '@/lib/sanity/queries';

const cachedGetFeaturedListings = cache((limit: number) => getFeaturedListings(limit));

export default async function HomePage() {
  let listings = [];

  try {
    listings = (await cachedGetFeaturedListings(10)) ?? [];
  } catch (error) {
    console.error('Failed to load featured listings for Home page', error);
  }

  return (
    <PageLayout>
      <HeroSection />
      <FeaturedListings initialListings={listings ?? []} />
      <CityCarousel />
    </PageLayout>
  );
}
