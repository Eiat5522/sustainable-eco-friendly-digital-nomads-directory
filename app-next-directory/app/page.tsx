'use client';

import { useEffect, useState } from 'react';
import HeroSection from '@/components/home/HeroSection';
import FeaturedListings from '@/components/home/FeaturedListingsUnified';
import EcoCityCarousel from '@/components/cities/CityCarousel';
import WhyChooseUs from '@/components/home/WhyChooseUs';
import StatisticsSection from '@/components/home/StatisticsSection';
import CTASection from '@/components/home/CTASection';
import SustainableNomadTestimonials from '@/components/ui/sustainable-nomad-testimonials';

import type { AppListingCard, AppCity } from '@/types/appView';
import type { EcoCityItem } from '@/components/cities/CityCarousel';

export default function HomePage() {
  const [listings, setListings] = useState<AppListingCard[]>([]);
  const [cities, setCities] = useState<EcoCityItem[]>([]);
  useEffect(() => {
    async function fetchData() {
      try {
        const featuredListingsResponse = await fetch('/api/featured-listings').then(res => res.json());
        const featuredListings = featuredListingsResponse.listings || [];
        console.log('[DEBUG] HomePage: Mapping', featuredListings.length, 'raw listings to AppListingCard DTO');
        const mapped = featuredListings.map((l: any) => {
          try {
            return mapSanityListingToCard(l);
          } catch (e) {
            console.warn('[WARN] Failed to map listing', l?._id || l?.id, e);
            return null;
          }
        }).filter(Boolean);
        console.log('[DEBUG] HomePage: Setting state with', mapped.length, 'mapped listings');
        setListings(mapped);
      } catch (error) {
        console.error('[ERROR] HomePage: Failed to fetch listings:', error);
      }
    }

    async function fetchCities() {
      try {
        const citiesResponse = await fetch('/api/cities').then(res => res.json());
        console.log('[DEBUG] City API response:', citiesResponse);
        const mappedCities: EcoCityItem[] = (citiesResponse.cities || []).map((city: any) => ({
          _id: city._id,
          name: city.name,
          sustainabilityScore: city.sustainabilityScore,
          highlights: city.highlights || [],
          image: city.image, // Using normalized SanityImage object from API
        }));
        setCities(mappedCities);
      } catch (error) {
        console.error('[ERROR] HomePage: Failed to fetch cities:', error);
      }
    }

    fetchData();
    fetchCities();
  }, []);

  return (
    <div>
      <HeroSection />
      <FeaturedListings listings={listings} />
      <EcoCityCarousel cities={cities} />
      <StatisticsSection />
      <WhyChooseUs />
      <SustainableNomadTestimonials />
      <CTASection />
    </div>
  );
}