'use client';

import { useEffect, useState } from 'react';
import HeroSection from '@/components/home/HeroSection';
import FeaturedListings from '@/components/home/FeaturedListings';
import EcoCityCarousel from '@/components/cities/CityCarousel';
import WhyChooseUs from '@/components/home/WhyChooseUs';
import StatisticsSection from '@/components/home/StatisticsSection';
import CTASection from '@/components/home/CTASection';
import SustainableNomadTestimonials from '@/components/ui/sustainable-nomad-testimonials';

export default function HomePage() {
  const [listings, setListings] = useState([]);
  const [cities, setCities] = useState([]);

  useEffect(() => {
    async function fetchData() {
      console.log('[DEBUG] HomePage: Starting data fetch at', new Date().toISOString());
      const startTime = performance.now();
      
      try {
        const featuredListingsResponse = await fetch('/api/featured-listings').then(res => {
          console.log('[DEBUG] Featured listings API response status:', res.status);
          return res.json();
        });

        const endTime = performance.now();
        console.log('[DEBUG] HomePage: API calls completed in', (endTime - startTime).toFixed(2), 'ms');
        
        console.log('[DEBUG] Featured listings response structure:', {
          hasListings: !!featuredListingsResponse.listings,
          listingsCount: featuredListingsResponse.listings?.length || 0,
          success: featuredListingsResponse.success,
          hasError: !!featuredListingsResponse.error
        });
        
        const featuredListings = featuredListingsResponse.listings || [];
        
        console.log('[DEBUG] HomePage: Setting state with', featuredListings.length, 'listings');
        
        setListings(featuredListings);
      } catch (error) {
        console.error('[ERROR] HomePage: Failed to fetch data:', error);
      }
    }
    async function fetchCities() {
      try {
        const citiesResponse = await fetch('/api/cities').then(res => res.json());
        console.log('[DEBUG] City API response:', citiesResponse);
        setCities(citiesResponse.cities || []);
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
