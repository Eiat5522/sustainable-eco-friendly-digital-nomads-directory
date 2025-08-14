'use client';

import { Suspense, useEffect, useState } from 'react';
import HeroSection from '@/components/home/HeroSection';
import FeaturedListings from '@/components/home/FeaturedListingsUnified';
import EcoCityCarousel from '@/components/cities/CityCarousel';
import WhyChooseUs from '@/components/home/WhyChooseUs';
import StatisticsSection from '@/components/home/StatisticsSection';
import CTASection from '@/components/home/CTASection';
import SustainableNomadTestimonials from '@/components/ui/sustainable-nomad-testimonials';

import type { EcoCityItem } from '@/components/cities/CityCarousel';
import { mapSanityListingToCard } from '@/lib/listings';
import { getFeaturedListings, getAllCities } from '@/lib/sanity/queries';

type RawListing = Parameters<typeof mapSanityListingToCard>[0];
type ListingCard = ReturnType<typeof mapSanityListingToCard>;

type RawCity = {
  _id: string;
  title: string;
  sustainabilityScore?: number | null;
  highlights?: string[] | null;
  primaryImage?: unknown;
};

export default function HomePage() {
  const [listings, setListings] = useState<ListingCard[]>([]);
  const [cities, setCities] = useState<EcoCityItem[]>([]);

  useEffect(() => {
    async function fetchContent(): Promise<void> {
      try {
        const [featuredListings, cityData] = await Promise.all([
          getFeaturedListings(),
          getAllCities(),
        ]);

        const mappedListings = (featuredListings || [])
          .map((l: RawListing) => {
            try {
              return mapSanityListingToCard(l);
            } catch (e) {
              console.warn('[WARN] Failed to map listing', l, e);
              return null;
            }
          })
          .filter((x: ListingCard | null): x is ListingCard => x !== null);
        setListings(mappedListings);

        const mappedCities: EcoCityItem[] = (cityData || []).map((city: RawCity) => ({
          _id: city._id,
          name: city.title,
          sustainabilityScore: city.sustainabilityScore ?? 0,
          highlights: city.highlights ?? [],
          image: city.primaryImage as EcoCityItem['image'],
        }));
        setCities(mappedCities);
      } catch (error) {
        console.error('[ERROR] HomePage: Failed to load content:', error);
      }
    }

    fetchContent();
  }, []);

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div>
        <HeroSection />
        <FeaturedListings listings={listings} />
        <EcoCityCarousel cities={cities} />
        <StatisticsSection />
        <WhyChooseUs />
        <SustainableNomadTestimonials />
        <CTASection />
      </div>
    </Suspense>
  );
}
