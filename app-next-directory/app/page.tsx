import { Suspense, cache } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { CityCarousel } from '@/components/sections/CityCarousel';
import { FeaturedListings } from '@/components/sections/FeaturedListings';
import { HeroSection } from '@/components/sections/HeroSection';
import type { CityDTO, Percentage0To100 } from '@/types/dto';
import { getAllCities, getFeaturedListings } from '@/lib/sanity/queries';

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

async function FeaturedListingsSection() {
  let listings = [];

  try {
    listings = (await cachedGetFeaturedListings(10)) ?? [];
  } catch (error) {
    console.error('Failed to load featured listings for Home page', error);
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
    console.error('Failed to load cities for Home page', error);
  }

  return <CityCarousel initialCities={cities} />;
}

export default function HomePage() {
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
        {/* eslint-disable-next-line react/no-unknown-property */}
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
