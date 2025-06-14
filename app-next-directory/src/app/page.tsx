'use client';

import { useEffect, useState } from 'react';
import HeroSection from '@/components/home/HeroSection';
import FeaturedListings from '@/components/listings/FeaturedListings';
import CitiesCarousel from '@/components/home/CitiesCarousel';
import InfographicSection from '@/components/home/InfographicSection';
import WhyChooseUs from '@/components/home/WhyChooseUs';
import CTASection from '@/components/home/CTASection';

export default function HomePage() {
  const [listings, setListings] = useState([]);
  const [cities, setCities] = useState([]);

  useEffect(() => {
    async function fetchData() {
      const [featuredListingsResponse, citiesResponse] = await Promise.all([
        fetch('/api/featured-listings').then(res => res.json()),
        fetch('/api/cities').then(res => res.json()),
      ]);

      // console.log('Server-side log: Fetched featured listings data in page.tsx:', JSON.stringify(featuredListingsResponse, null, 2)); // Removed debugging log
      // console.log('Server-side log: Fetched cities data in page.tsx:', JSON.stringify(citiesResponse, null, 2)); // Removed debugging log
      
      const featuredListings = featuredListingsResponse.listings || [];
      const allCities = citiesResponse.success ? citiesResponse.cities : [];
      
      // console.log('Fetched featured listings data in page.tsx (client-side):', featuredListingsResponse);  // Removed debugging log
      // console.log('Fetched cities data in page.tsx (client-side):', citiesResponse); // Removed debugging log

      setListings(featuredListings);
      setCities(allCities);
    }
    fetchData();
  }, []);

  return (
    <div>
      <HeroSection />
      <FeaturedListings listings={listings} />
      <CitiesCarousel cities={cities} />
      <InfographicSection />
      <WhyChooseUs />
      <CTASection />
    </div>
  );
}
