import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { CityDetailView } from '@/components/city/CityDetailView';
import { getCityBySlug, getCityDetailBySlug, getListingsByCityId } from '@/lib/data/city';
import type { CityDTO, CityDetailDTO, ListingSummaryDTO } from '@/types/dto';
import { structuredLogger } from '@/lib/logger';

interface CityPageProps {
  params: Promise<{ slug: string }>;
}

type CityResult = CityDetailDTO | CityDTO;

const NOT_FOUND_METADATA: Metadata = {
  title: 'City Not Found - Sustainable Digital Nomads Directory',
  description: 'The requested city could not be found.',
};

async function resolveCity(slug: string): Promise<CityResult | null> {
  try {
    const detailed = await getCityDetailBySlug(slug);
    if (detailed) {
      return detailed;
    }

    return await getCityBySlug(slug);
  } catch (error) {
    structuredLogger.error('city-page:resolveCity_failed', error, {
      component: 'city-page',
      operation: 'resolve_city',
      slug,
    });
    return null;
  }
}

function buildCityMetadata(city: CityResult): Metadata {
  const baseTitle = `${city.name} - Sustainable Digital Nomads Directory`;
  const description =
    city.description?.trim() ??
    `Discover sustainable co-working spaces, accommodations, and eco-friendly venues in ${city.name}.`;

  const keywordSet = new Set<string>();
  keywordSet.add(city.name);
  if (city.country) keywordSet.add(city.country);
  (city.highlights ?? []).forEach((item) => {
    if (typeof item === 'string' && item.trim().length > 0) {
      keywordSet.add(item.trim());
    }
  });
  keywordSet.add('sustainable travel');
  keywordSet.add('digital nomad');

  const keywords = Array.from(keywordSet);
  const ogImages = city.imageUrl ? [{ url: city.imageUrl }] : undefined;
  const twitterImages = city.imageUrl ? [city.imageUrl] : undefined;

  return {
    title: baseTitle,
    description,
    keywords,
    openGraph: {
      title: baseTitle,
      description,
      images: ogImages,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: baseTitle,
      description,
      images: twitterImages,
    },
  };
}

export async function generateMetadata({ params }: CityPageProps): Promise<Metadata> {
  const { slug } = await params;
  const city = await resolveCity(slug);
  if (!city) {
    return NOT_FOUND_METADATA;
  }
  return buildCityMetadata(city);
}

export default async function CityPage({ params }: CityPageProps) {
  const { slug } = await params;
  const city = await resolveCity(slug);

  if (!city) {
    notFound();
  }

  let listings: ListingSummaryDTO[] = [];
  try {
    listings = await getListingsByCityId(city.id);
  } catch (error) {
    structuredLogger.error('city-page:listings_fetch_failed', error, {
      component: 'city-page',
      operation: 'fetch_city_listings',
      cityId: city.id,
      slug,
    });
  }

  return <CityDetailView city={city} listings={listings} />;
}

export const revalidate = 3600;
