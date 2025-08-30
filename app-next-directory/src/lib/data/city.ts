import { client } from '@/lib/sanity/client';
import { groq } from 'next-sanity';
import { transformToSummaryDTO } from '@/lib/dto-transformer';
import type { CityDTO, ListingSummaryDTO } from '@/types/dto';
import type { SanityListing } from '@/types/sanity.types';

// Map raw Sanity city to CityDTO
function toCityDTO(raw: any): CityDTO | null {
  if (!raw || typeof raw !== 'object') return null;
  const sustainability = typeof raw.sustainabilityScore === 'number'
    ? Math.max(0, Math.min(100, raw.sustainabilityScore))
    : undefined;

  const dim: unknown = raw.primaryImage?.asset?.metadata?.dimensions;
  return {
    id: raw._id,
    name: raw.name,
    slug: raw.slug,
    country: raw.country ?? '',
    sustainabilityScore: sustainability as CityDTO['sustainabilityScore'],
    highlights: Array.isArray(raw.highlights) ? raw.highlights : [],
    imageUrl: raw.primaryImage?.asset?.url ?? undefined,
    imageDimensions: dim && typeof dim === 'object' && !Array.isArray(dim)
      && (Number.isFinite((dim as any).width) || Number.isFinite((dim as any).height))
      ? {
          width: Number.isFinite((dim as any).width) ? (dim as any).width : undefined,
          height: Number.isFinite((dim as any).height) ? (dim as any).height : undefined
        }
      : undefined,
    description: raw.description ?? undefined,
  };
}

export async function getCityBySlug(slug: string): Promise<CityDTO | null> {
  const query = groq`*[_type == "city" && slug.current == $slug][0]{
    _id,
    name,
    "slug": slug.current,
    country,
    sustainabilityScore,
    highlights,
    description,
    "primaryImage": primaryImage{
      asset->{
        url,
        metadata{ dimensions }
      }
    }
  }`;

  const raw = await client.fetch(query, { slug } as Record<string, unknown>);
  return toCityDTO(raw);
}

export async function getListingsByCityId(cityId: string): Promise<ListingSummaryDTO[]> {
  const query = groq`*[_type == "listing" && moderation.status == "published" && city._ref == $cityId]{
    _id,
    name,
    slug,
    type,
    shortDescription,
    address,
    location,
    priceRange,
    website,
    primaryImage,
    galleryImages,
    ecoFocusTags[]->{ name },
    digitalNomadFeatures[]->{ name },
    amenities[]->{ name },
    city->{
      _id,
      name,
      country,
      sustainabilityScore,
      highlights,
      slug
    }
  }`;

  const raws = await client.fetch<SanityListing[]>(query, { cityId } as Record<string, unknown>);
  return (Array.isArray(raws) ? raws : []).map(transformToSummaryDTO);
}

export async function getCitiesList(limit = 20): Promise<CityDTO[]> {
  const query = groq`*[_type == "city"] | order(_createdAt desc)[0...$limit]{
    _id,
    name,
    "slug": slug.current,
    country,
    sustainabilityScore,
    highlights,
    description,
    "primaryImage": primaryImage{
      asset->{
        url,
        metadata{ dimensions }
      }
    }
  }`;

  const raw = await client.fetch<any[]>(query, { limit } as Record<string, unknown>);
  return (Array.isArray(raw) ? raw : []).map(toCityDTO).filter(Boolean) as CityDTO[];
}
