'use client';

import { useEffect, useState } from 'react';
import HeroSection from '@/components/home/HeroSection';
import FeaturedListings from '@/components/home/FeaturedListingsUnified';
import EcoCityCarousel from '@/components/cities/CityCarousel';
import WhyChooseUs from '@/components/home/WhyChooseUs';
import StatisticsSection from '@/components/home/StatisticsSection';
import CTASection from '@/components/home/CTASection';
import SustainableNomadTestimonials from '@/components/ui/sustainable-nomad-testimonials';

import type { AppListingCard, AppCity, SanityImage } from '@/types/appView';
import type { EcoCityItem } from '@/components/cities/CityCarousel';
import { mapSanityListingToCard } from '@/lib/listings';

type RawListing = Parameters<typeof mapSanityListingToCard>[0];
type ListingCard = ReturnType<typeof mapSanityListingToCard>;

// Add response interfaces for typed JSON parsing
interface FeaturedListingsResponse {
  listings?: RawListing[];
}

interface CityAPIItem {
  _id: string;
  name: string;
  sustainabilityScore: number;
  highlights?: string[];
  image: SanityImage;
}

interface CitiesResponse {
  cities?: CityAPIItem[];
}

export default function HomePage() {
  const [listings, setListings] = useState<ListingCard[]>([]);
  const [cities, setCities] = useState<EcoCityItem[]>([]);

  useEffect(() => {
    async function fetchData(): Promise<void> {
      try {
        const featuredListingsResponse: FeaturedListingsResponse =
          await fetch('/api/featured-listings').then(res => res.json());
        const featuredListings = featuredListingsResponse.listings || [];
        console.log('[DEBUG] HomePage: Raw featured listings:', featuredListings);
                if (process.env.NODE_ENV !== 'production') {
          console.log('[DEBUG] HomePage: Mapping', featuredListings.length, 'raw listings to AppListingCard DTO');
        }
        const mapped = featuredListings
          .map((l: RawListing) => {
            try {
              return mapSanityListingToCard(l);
            } catch (e) {
              console.warn('[WARN] Failed to map listing', l, e);
              return null;
            }
          })
          .filter((x): x is ListingCard => x !== null);
        if (process.env.NODE_ENV !== 'production') {
          console.log('[DEBUG] HomePage: Setting state with', mapped.length, 'mapped listings');
        }
        setListings(mapped);
      } catch (error) {
        console.error('[ERROR] HomePage: Failed to fetch listings:', error);
      }
    }

    async function fetchCities(): Promise<void> {
      try {
        const citiesResponse: CitiesResponse =
          await fetch('/api/cities').then(res => res.json());
        console.log('[DEBUG] City API response:', citiesResponse);
        const mappedCities: EcoCityItem[] = (citiesResponse.cities || []).map((city: CityAPIItem) => ({
          _id: city._id,
          name: city.name,
          sustainabilityScore: city.sustainabilityScore,
          highlights: city.highlights || [],
          image: city.image,
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
