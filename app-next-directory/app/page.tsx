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

export default function HomePage() {
  const [listings, setListings] = useState<AppListingCard[]>([]);
  const [cities, setCities] = useState<AppCity[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const featuredListingsResponse = await fetch('/api/featured-listings').then(res => res.json());
        const featuredListings = featuredListingsResponse.listings || [];
        setListings(featuredListings);
      } catch (error) {
        console.error('[ERROR] HomePage: Failed to fetch listings:', error);
      }
    }

    async function fetchCities() {
      try {
        const citiesResponse = await fetch('/api/cities').then(res => res.json());
        const cityData = citiesResponse.cities || [];
        setCities(cityData);
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