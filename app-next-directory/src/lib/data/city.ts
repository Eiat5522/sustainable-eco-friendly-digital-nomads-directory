import { client } from '@/lib/sanity/client';
import { groq } from 'next-sanity';
import { transformToSummaryDTO } from '@/lib/dto-transformer';
import type { CityDTO, CityDetailDTO, ListingSummaryDTO } from '@/types/dto';

type SanityImageDimensions = { width?: number; height?: number };
type SanityImageAsset = { url?: string; metadata?: { dimensions?: SanityImageDimensions } };
type SanityImageRef = { asset?: SanityImageAsset } | null | undefined;

// Input shape for dereferenced Sanity data from GROQ queries
interface DereferencedSanityListing {
  _id: string;
  name: string;
  slug: { current: string };
  type: 'coworking' | 'cafe' | 'accommodation' | 'restaurant' | 'activities';
  shortDescription?: string;
  address?: string;
  location?: { lat: number; lng: number };
  priceRange?: 'budget' | 'moderate' | 'premium';
  website?: string;
  primaryImage?: SanityImageRef;
  galleryImages?: SanityImageRef[];
  ecoFocusTags?: Array<{ name: string }>;
  digitalNomadFeatures?: Array<{ name: string }>;
  amenities?: Array<{ name: string }>;
  city?: {
    _id: string;
    name: string;
    country: string;
    sustainabilityScore?: number;
    highlights?: string[];
    slug: { current: string };
  };
}

// Sanitize Sanity geopoint input to ensure consumers get { lat, lng } or undefined
function toGeoPoint(
  geo?: { lat?: number; lng?: number } | null
): { lat: number; lng: number } | undefined {
  const lat = geo?.lat;
  const lng = geo?.lng;
  if (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat! >= -90 &&
    lat! <= 90 &&
    lng! >= -180 &&
    lng! <= 180
  ) {
    return { lat: lat!, lng: lng! };
  }
  return undefined;
}
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

// Map raw Sanity city to CityDetailDTO (extends CityDTO with additional fields)
function toCityDetailDTO(raw: any): CityDetailDTO | null {
  if (!raw || typeof raw !== 'object') return null;

  // Get base CityDTO fields
  const baseCity = toCityDTO(raw);
  if (!baseCity) return null;

  // Add additional detail fields
  const galleryUrls: string[] = Array.isArray(raw.galleryImages)
    ? raw.galleryImages
        .map((img: SanityImageRef) => (typeof img?.asset?.url === 'string' ? img.asset.url : undefined))
        .filter((u: unknown): u is string => typeof u === 'string' && u.trim().length > 0)
    : [];

  return {
    ...baseCity,
    shortDescription: raw.shortDescription ?? undefined,
    airQuality: raw.airQuality ?? undefined,
    internetSpeed: typeof raw.internetSpeed === 'number' ? raw.internetSpeed : undefined,
    costOfLiving: raw.costOfLiving ?? undefined,
    climate: raw.climate ?? undefined,
    safety: raw.safety ?? undefined,
    walkability: raw.walkability ?? undefined,
    sustainabilityInitiatives: Array.isArray(raw.sustainabilityInitiatives)
      ? raw.sustainabilityInitiatives.map((v: any) => (typeof v === 'string' ? v : v?.name)).filter(Boolean)
      : [],
    digitalNomadFeatures: Array.isArray(raw.digitalNomadFeatures)
      ? raw.digitalNomadFeatures.map((v: any) => (typeof v === 'string' ? v : v?.name)).filter(Boolean)
      : [],
    galleryImages: galleryUrls,
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

  const raw = await client.fetch(query, { slug } as Record<string, unknown>) as any;
  return toCityDTO(raw);
}

export async function getCityDetailBySlug(slug: string): Promise<CityDetailDTO | null> {
  const query = groq`*[_type == "city" && slug.current == $slug][0]{
    _id,
    name,
    "slug": slug.current,
    country,
    sustainabilityScore,
    highlights,
    description,
    shortDescription,
    airQuality,
    internetSpeed,
    costOfLiving,
    climate,
    safety,
    walkability,
    sustainabilityInitiatives,
    digitalNomadFeatures,
    galleryImages[]{
      asset->{
        url,
       }
    },
    "primaryImage": primaryImage{
      asset->{
        url
        metadata{ dimensions }
      }
    }
  }`;

  const raw = await client.fetch(query, { slug } as Record<string, unknown>) as any;
  return toCityDetailDTO(raw);
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

  const raws = await client.fetch<DereferencedSanityListing[]>(query, { cityId });  return (Array.isArray(raws) ? raws : []).map(transformToSummaryDTO);
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

  const raw = await client.fetch(query, { limit } as Record<string, unknown>) as any;
  return (Array.isArray(raw) ? raw : []).map(toCityDTO).filter(Boolean) as CityDTO[];
}
