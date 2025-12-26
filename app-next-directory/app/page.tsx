'use cache';

import { Suspense, cache } from 'react';
import { cacheLife, cacheTag } from 'next/cache';
import { PageLayout } from '@/components/layout/PageLayout';
import { CityCarousel } from '@/components/sections/CityCarousel';
import { FeaturedListings } from '@/components/sections/FeaturedListings';
import { HeroSection } from '@/components/sections/HeroSection';
import type { CityDTO, FeaturedListingDTO, Percentage0To100 } from '@/types/dto';
import { getAllCities, getFeaturedListings } from '@/lib/sanity/queries';
import { structuredLogger } from '@/lib/logger';

const cachedGetFeaturedListings = cache((limit: number) => getFeaturedListings(limit));
const cachedGetAllCities = cache(() => getAllCities());
const CITY_CAROUSEL_LIMIT = 8;

interface SanityCityRecord {
  _id?: string;
  title?: string;
  slug?: string | { current?: string };
  country?: string;
  description?: string;
  sustainabilityScore?: number;
  highlights?: string[];
  primaryImage?: {
    asset?: {
      url?: string;
    };
  };
}

interface SanityFeaturedListingRecord {
  _id?: string;
  name?: string;
  slug?: string;
  primaryImage?: {
    asset?: {
      url?: string;
    };
  };
  city?: {
    name?: string;
  } | string;
}

const mapCityRecordToDTO = (city: SanityCityRecord): CityDTO | null => {
  const slugValue =
    typeof city.slug === 'string'
      ? city.slug
      : city.slug && typeof city.slug === 'object'
        ? city.slug.current
        : undefined;

  if (!city?._id || !city.title || !slugValue) {
    return null;
  }

  const imageUrl = city.primaryImage?.asset?.url ?? null;
  const highlights = Array.isArray(city.highlights)
    ? city.highlights.filter((item): item is string => typeof item === 'string' && item.length > 0)
    : undefined;

  const sustainabilityScore =
    typeof city.sustainabilityScore === 'number'
      ? (city.sustainabilityScore as Percentage0To100)
      : undefined;

  return {
    id: city._id,
    name: city.title,
    slug: slugValue,
    country: city.country ?? '',
    description: city.description,
    sustainabilityScore,
    highlights,
    imageUrl,
  };
};

const mapFeaturedListingRecordToDTO = (
  listing: SanityFeaturedListingRecord
): FeaturedListingDTO | null => {
  if (!listing?._id || !listing.name || !listing.slug) {
    return null;
  }

  const city =
    typeof listing.city === 'string'
      ? listing.city
      : listing.city?.name ?? '';

  return {
    id: listing._id,
    name: listing.name,
    slug: listing.slug,
    imageUrl: listing.primaryImage?.asset?.url,
    city,
    amenityNames: [],
  };
};

async function FeaturedListingsSection() {
  let listings: FeaturedListingDTO[] = [];

  try {
    const rawListings = (await cachedGetFeaturedListings(10)) ?? [];
    listings = rawListings
      .map(mapFeaturedListingRecordToDTO)
      .filter((listing): listing is FeaturedListingDTO => listing !== null);
  } catch (error) {
    structuredLogger.error('Failed to load featured listings for Home page', error, { component: 'home-page' });
  }

  return <FeaturedListings initialListings={listings} />;
}

async function CityCarouselSection() {
  let cities: CityDTO[] = [];

  try {
    const rawCities = (await cachedGetAllCities()) ?? [];
    const mappedCities = rawCities
      .map(mapCityRecordToDTO)
      .filter((city): city is CityDTO => city !== null)
      .slice(0, CITY_CAROUSEL_LIMIT);
    cities = mappedCities;
  } catch (error) {
    structuredLogger.error('Failed to load cities for Home page', error, { component: 'home-page' });
  }

  return <CityCarousel initialCities={cities} />;
}

export default async function HomePage() {
  cacheLife('days');
  cacheTag('home');

  return (
    <PageLayout>
      <HeroSection />
      <Suspense
        fallback={
          <div className="text-center py-12">
            <p className="body-lg">Loading featured venues...</p>
          </div>
        }
      >
        { }
        <FeaturedListingsSection />
      </Suspense>
      <Suspense
        fallback={
          <div className="text-center py-12">
            <p className="body-lg">Loading cities…</p>
          </div>
        }
      >
        <CityCarouselSection />
      </Suspense>
    </PageLayout>
  );
}
