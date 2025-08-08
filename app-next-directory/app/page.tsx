'use client';

import { useEffect, useState } from 'react';
import HeroSection from '@/components/home/HeroSection';
import { mapSanityListingToCard } from '@/lib/listings';
import FeaturedListings from '@/components/home/FeaturedListingsUnified';
import EcoCityCarousel from '@/components/cities/CityCarousel';
import WhyChooseUs from '@/components/home/WhyChooseUs';
import StatisticsSection from '@/components/home/StatisticsSection';
import CTASection from '@/components/home/CTASection';
import SustainableNomadTestimonials from '@/components/ui/sustainable-nomad-testimonials';

import type { EcoCityItem } from '@/components/cities/CityCarousel';
import type { SanityImage as SanityImageType } from '@/types/appView';

export default function HomePage() {
  const [listings, setListings] = useState<any[]>([]);
  const [cities, setCities] = useState<EcoCityItem[]>([]);

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
        setListings(mapped as any[]);
      } catch (error) {
        console.error('[ERROR] HomePage: Failed to fetch data:', error);
      }
    }
    async function fetchCities() {
      try {
        const citiesResponse: CitiesApiResponse = await fetch('/api/cities').then(res => res.json());
        console.log('[DEBUG] City API response:', citiesResponse);
        const mappedCities: EcoCityItem[] = (citiesResponse.cities || []).map((city: RawCity) => ({
          _id: city._id,
          name: city.name,
          sustainabilityScore: city.sustainabilityScore,
          highlights: city.highlights || [],
          image: city.image, // This should now be a SanityImage object from the API
        }));
        setCities(mappedCities);
      } catch (error) {
        console.error('[ERROR] HomePage: Failed to fetch cities:', error);
      }
    }

interface CitiesApiResponse {
  cities: RawCity[];
  success: boolean;
  metadata: any;
}

interface RawCity {
  _id: string;
  name: string;
  slug: string;
  country: string;
  sustainabilityScore: number;
  highlights: string[];
  image: {
    alt?: string;
    _type: 'image';
    asset?: {
      _id?: string;
      _ref?: string;
      url?: string;
      metadata?: {
        dimensions?: any;
        lqip?: string;
      };
    };
  };
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