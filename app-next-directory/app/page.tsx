'use client';

import { useEffect, useState } from 'react';
import HeroSection from '@/components/home/HeroSection';
import FeaturedListings from '@/components/listings/FeaturedListings';
import CitiesCarousel from '@/components/home/CitiesCarousel';
import WhyChooseUs from '@/components/home/WhyChooseUs';
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
        const [featuredListingsResponse, citiesResponse] = await Promise.all([
          fetch('/api/featured-listings').then(res => {
            console.log('[DEBUG] Featured listings API response status:', res.status);
            return res.json();
          }),
          fetch('/api/cities').then(res => {
            console.log('[DEBUG] Cities API response status:', res.status);
            return res.json();
          }),
        ]);

        const endTime = performance.now();
        console.log('[DEBUG] HomePage: API calls completed in', (endTime - startTime).toFixed(2), 'ms');
        
        console.log('[DEBUG] Featured listings response structure:', {
          hasListings: !!featuredListingsResponse.listings,
          listingsCount: featuredListingsResponse.listings?.length || 0,
          success: featuredListingsResponse.success,
          hasError: !!featuredListingsResponse.error
        });
        
        console.log('[DEBUG] Cities response structure:', {
          hasCities: !!citiesResponse.cities,
          citiesCount: citiesResponse.cities?.length || 0,
          success: citiesResponse.success,
          hasError: !!citiesResponse.error
        });
        
        const featuredListings = featuredListingsResponse.listings || [];
        const allCities = citiesResponse.success ? citiesResponse.cities : [];
        
        console.log('[DEBUG] HomePage: Setting state with', featuredListings.length, 'listings and', allCities.length, 'cities');
        
        setListings(featuredListings);
        setCities(allCities);
      } catch (error) {
        console.error('[ERROR] HomePage: Failed to fetch data:', error);
      }
    }
    fetchData();
  }, []);

  return (
    <div>
      <HeroSection />
      <FeaturedListings listings={listings} />
      <CitiesCarousel cities={cities} />
      <WhyChooseUs />
      <SustainableNomadTestimonials />
      <CTASection />
    </div>
  );
}
