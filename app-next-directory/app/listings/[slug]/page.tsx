export const revalidate = 300; // ISR: revalidate every 5 minutes
import { ListingDetailView } from '@/components/listings/ListingDetailView';
import { mockListingDetail, mockRelatedListings, mockReviews } from '@/components/listings/listingDetailMockData';
import { client } from '@/lib/sanity/client';
import { groq } from 'next-sanity';
import { transformToDetailDTO } from '@/lib/dto-transformer';
import type { SanityListing } from '@/types/sanity.types';
import type { CityDTO } from '@/types/dto';
import type { ListingDetailDTO } from '@/types/dto';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import type { UserRole } from '@/types/auth';

type Props = { params: Promise<{ slug: string }> };

type ListingFixture = {
  listing: ListingDetailDTO;
  reviews?: typeof mockReviews;
  relatedListings?: typeof mockRelatedListings;
  isSignedIn?: boolean;
  isFavorited?: boolean;
};

type RelatedListingRecord = {
  _id?: string | null;
  name?: string | null;
  slug?: string | null;
  priceRange?: string | null;
  imageUrl?: string | null;
  city?: {
    _id?: string | null;
    name?: string | null;
    country?: string | null;
    slug?: string | null;
  } | null;
  ecoFocusTags?: Array<{ name?: string | null } | string | null | undefined> | null;
};

type Review = {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  user: {
    name: string;
    image?: string;
    id?: string;
  };
  status: 'pending' | 'approved';
};

const isE2ETest = process.env.NEXT_PUBLIC_E2E === '1' || process.env.E2E === '1';
const E2E_ERROR_SLUG = 'listing-error-simulated';

const e2eFixtures: Record<string, ListingFixture> = {
  'banyan-tree-phuket': {
    listing: mockListingDetail,
    reviews: mockReviews,
    relatedListings: mockRelatedListings,
    isSignedIn: true,
    isFavorited: false,
  },
};

function isPriceRange(value: string | null | undefined): value is 'budget' | 'moderate' | 'premium' {
  return value === 'budget' || value === 'moderate' || value === 'premium';
}

function cloneFixture(fixture: ListingFixture) {
  const listing = structuredClone(fixture.listing);
  if (!Array.isArray(listing.galleryImages) || listing.galleryImages.length === 0) {
    listing.galleryImages = ['/test-gallery-1.jpg', '/test-gallery-2.jpg'];
  } else {
    listing.galleryImages = listing.galleryImages.map((src, index) => {
      if (typeof src === 'string' && src.trim().length > 0) {
        return src === '/placeholder_image.png' ? `/test-gallery-${index + 1}.jpg` : src;
      }
      return `/test-gallery-${index + 1}.jpg`;
    });
  }

  return {
    listing,
    reviews: fixture.reviews ? structuredClone(fixture.reviews) : [],
    relatedListings: fixture.relatedListings ? structuredClone(fixture.relatedListings) : [],
    isSignedIn: Boolean(fixture.isSignedIn),
    isFavorited: Boolean(fixture.isFavorited),
  };
}

function extractTagNames(
  tags?: RelatedListingRecord['ecoFocusTags']
): string[] {
  if (!Array.isArray(tags)) return [];
  const names: string[] = [];
  for (const tag of tags) {
    if (typeof tag === 'string' && tag.trim().length > 0) {
      names.push(tag);
      continue;
    }
    if (tag && typeof tag === 'object' && typeof tag.name === 'string' && tag.name.trim().length > 0) {
      names.push(tag.name.trim());
    }
  }
  return names;
}

const LISTING_QUERY = groq`*[_type == "listing" && moderation.status == "published" && slug.current == $slug][0]{
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

const RELATED_QUERY = groq`*[_type == "listing" && moderation.status == "published" && city._ref == $cityId && _id != $excludeId][0...6]{
  _id,
  name,
  "slug": slug.current,
  priceRange,
  "imageUrl": coalesce(primaryImage.asset->url, ""),
  ecoFocusTags[]->{ name },
  city->{ _id, name, country, "slug": slug.current }
}`;

const FAVORITE_QUERY = groq`*[_type == "userFavorite" && user._ref == $userId && listing._ref == $listingId][0]{ _id }`;

async function fetchListingBySlug(slug: string): Promise<ListingDetailDTO | null> {
  const raw = await client.fetch<SanityListing | null>(LISTING_QUERY, { slug });
  if (!raw) return null;
  try {
    return transformToDetailDTO(raw);
  } catch (e) {
    console.error('[listings/[slug]] transform failed for', slug, e);
    return null;
  }
}

async function fetchRelatedListings(cityId?: string, excludeId?: string) {
  if (!cityId) return [] as Array<{
    id: string; name: string; slug: string; imageUrl: string; city: string | CityDTO | null; priceRange: 'budget'|'moderate'|'premium'; ecoFocusTags: string[];
  }>;
  try {
    const records = await client.fetch<RelatedListingRecord[]>(RELATED_QUERY, { cityId, excludeId });
    return records.map((record) => {
      const priceRange = isPriceRange(record.priceRange)
        ? record.priceRange
        : 'moderate';

      return {
        id: record._id ?? '',
        name: record.name ?? '',
        slug: record.slug ?? '',
        imageUrl: record.imageUrl ?? '',
        city: record.city ?? null,
        priceRange,
        ecoFocusTags: extractTagNames(record.ecoFocusTags),
      };
    });
  } catch (error) {
    console.error('[listings/[slug]] failed to fetch related listings', error);
    return [];
  }
}

async function fetchReviews(listingId: string, userId?: string): Promise<Review[]> {
  try {
    const url = new URL('/api/reviews', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000');
    url.searchParams.set('listingId', listingId);
    if (userId) {
      url.searchParams.set('userId', userId);
    }
    const res = await fetch(url.toString(), { next: { tags: [`listing:${listingId}-reviews`] } });
    if (!res.ok) {
      throw new Error('Failed to fetch reviews');
    }
    const data = await res.json();
    const source = Array.isArray(data?.reviews) ? data.reviews : [];
    const reviews: Review[] = [];

    for (const review of source) {
      const id = typeof review?.id === 'string' ? review.id : typeof review?._id === 'string' ? review._id : null;
      const rating = Number(review?.rating);
      if (!id || !Number.isFinite(rating) || rating <= 0) {
        continue;
      }

      const status = review?.status === 'pending' ? 'pending' : 'approved';
      const comment = typeof review?.comment === 'string' ? review.comment : '';
      const createdAt =
        typeof review?.createdAt === 'string'
          ? review.createdAt
          : typeof review?._createdAt === 'string'
            ? review._createdAt
            : new Date().toISOString();
      const rawName = typeof review?.user?.name === 'string' ? review.user.name : '';
      const userName = rawName.trim().length > 0 ? rawName : 'Anonymous';
      const userImage =
        typeof review?.user?.image === 'string' && review.user.image.length > 0
          ? review.user.image
          : undefined;
      const userIdValue = typeof review?.user?.id === 'string' ? review.user.id : typeof review?.user?._id === 'string' ? review.user._id : undefined;

      reviews.push({
        id,
        rating,
        comment,
        createdAt,
        status,
        user: { name: userName, image: userImage, id: userIdValue },
      });
    }
    return reviews;
  } catch (error) {
    console.error('[listings/[slug]] failed to fetch reviews', error);
    return [];
  }
}

async function checkIsFavorited(listingId: string, userId?: string): Promise<boolean> {
  if (!userId) return false;
  try {
    const favorite = await client.fetch<{ _id?: string | null } | null>(FAVORITE_QUERY, { userId, listingId });
    return Boolean(favorite?._id);
  } catch (error) {
    console.error('[listings/[slug]] failed to check favorite status', error);
    return false;
  }
}

export default async function ListingPage({ params }: Props) {
  const { slug } = await params;

  if (isE2ETest) {
    if (slug === E2E_ERROR_SLUG) {
      throw new Error('E2E forced listing error');
    }

    const fixture = e2eFixtures[slug];
    if (!fixture) notFound();

    const { listing, reviews, relatedListings, isSignedIn, isFavorited } = cloneFixture(fixture);

    return (
      <>
        <Header />
        <main>
          <ListingDetailView
            listing={listing}
            reviews={reviews}
            relatedListings={relatedListings}
            isSignedIn={isSignedIn}
            isFavorited={isFavorited}
          />
        </main>
        <Footer />
      </>
    );
  }

  const { auth } = await import('@/lib/auth');
  const sessionPromise = auth();
  const listing = await fetchListingBySlug(slug);
  if (!listing) notFound();

  const session = await sessionPromise;
  const user = session?.user as { id?: string; role?: UserRole } | undefined;
  const userId = user?.id;
  const isSignedIn = Boolean(session && userId);

  const [relatedListings, reviews, isFavorited] = await Promise.all([
    fetchRelatedListings(listing.city?.id, listing.id),
    fetchReviews(listing.id, userId),
    checkIsFavorited(listing.id, userId),
  ]);

  return (
    <>
      <Header />
      <main>
          <ListingDetailView
            listing={listing}
            reviews={reviews}
            relatedListings={relatedListings as any}
            isSignedIn={isSignedIn}
            isFavorited={isFavorited}
            userId={userId}
          />
      </main>
      <Footer />
    </>
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const listing = await fetchListingBySlug(slug);

  if (!listing) {
    return { title: 'Listing not found' };
  }

  const summary = listing.shortDescription ?? listing.longDescription ?? '';
  const description = summary ? summary.slice(0, 160) : undefined;
  const primaryImage = listing.galleryImages?.[0] ?? listing.imageUrl ?? undefined;

  return {
    title: listing.name,
    description,
    openGraph: {
      title: listing.name,
      description,
      images: primaryImage ? [primaryImage] : undefined,
    },
  };
}
