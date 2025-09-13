export const revalidate = 300; // ISR: revalidate every 5 minutes
import { ListingDetailView } from '@/components/listings/ListingDetailView';
import { client } from '@/lib/sanity/client';
import { groq } from 'next-sanity';
import { transformToDetailDTO } from '@/lib/dto-transformer';
import type { SanityListing } from '@/types/sanity.types';
import type { CityDTO } from '@/types/dto';
import type { ListingDetailDTO } from '@/types/dto';
import { notFound } from 'next/navigation';

type Props = { params: { slug: string } };

async function fetchListingBySlug(slug: string): Promise<ListingDetailDTO | null> {
  const query = groq`*[_type == "listing" && moderation.status == "published" && slug.current == $slug][0]{
    _id,
    name,
    "slug": slug.current,
    type,
    shortDescription,
    longDescription,
    address,
    location,
    website,
    priceRange,
    contactPhone,
    contactEmail,
    primaryImage,
    galleryImages,
    ecoFocusTags[]->{ _id, name, slug },
    digitalNomadFeatures[]->{ _id, name, slug },
    amenities[]->{ _id, name, slug, icon, category },
    city->{ _id, name, country, sustainabilityScore, highlights, "slug": slug.current },
    coworkingDetails,
    cafeDetails,
    restaurantDetails,
    activitiesDetails,
    accommodationDetails,
    moderation
  }`;

  const raw = await client.fetch<SanityListing | null>(query, { slug });
  if (!raw) return null;
  try {
    return transformToDetailDTO(raw);
  } catch (e) {
    console.error('[listings/[slug]] transform failed for', slug, e);
    return null;
  }
}

export default async function ListingPage({ params }: Props) {
    const { slug } = params;
  const listing = await fetchListingBySlug(slug);
  if (!listing) notFound();

  // Fetch related listings: same city, published, exclude current
  async function fetchRelatedListings(cityId?: string, excludeId?: string) {
    if (!cityId) return [] as Array<{
      id: string; name: string; slug: string; imageUrl: string; city: string | CityDTO | null; priceRange: 'budget'|'moderate'|'premium'; ecoFocusTags: string[];
    }>;
    const RELATED_QUERY = groq`*[_type == "listing" && moderation.status == "published" && city._ref == $cityId && _id != $excludeId][0...6]{
      _id,
      name,
      "slug": slug.current,
      priceRange,
      "imageUrl": coalesce(primaryImage.asset->url, ""),
      ecoFocusTags[]->{ name },
      city->{ _id, name, country, "slug": slug.current }
    }`;
    const raw = await client.fetch<any[]>(RELATED_QUERY, { cityId, excludeId });
    return (raw ?? []).map((r) => ({
      id: r._id,
      name: r.name,
      slug: r.slug || '',
      imageUrl: typeof r.imageUrl === 'string' && r.imageUrl.length > 0 ? r.imageUrl : '/placeholder_image.png',
      city: r.city ? { id: r.city._id, name: r.city.name, slug: r.city.slug, country: r.city.country } as CityDTO : null,
      priceRange: (['budget','moderate','premium'] as const).includes(r.priceRange) ? r.priceRange : 'moderate',
      ecoFocusTags: Array.isArray(r.ecoFocusTags) ? r.ecoFocusTags.map((x: any) => x?.name).filter(Boolean) : [],
    }));
  }

  const relatedListings = await fetchRelatedListings(listing.city?.id, listing.id);

  return (
    <ListingDetailView
      listing={listing}
      reviews={[]}
      relatedListings={relatedListings}
      isSignedIn={false}
      isFavorited={false}
    />
  );
}
