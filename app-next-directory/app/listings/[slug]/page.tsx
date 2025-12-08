import type { Collection, Filter } from 'mongodb';
import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { groq } from 'next-sanity';
import { cache } from 'react';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { ListingDetailView } from '@/components/listings/ListingDetailView';
import {
  mockListingDetail,
  mockRelatedListings,
  mockReviews,
} from '@/components/listings/listingDetailMockData';
import { transformToDetailDTO } from '@/lib/dto-transformer';
import { structuredLogger as logger } from '@/lib/logger';
import { client } from '@/lib/sanity/client';
import type { UserRole } from '@/types/auth';
import type { CityDTO, ListingDetailDTO } from '@/types/dto';
import type { SanityListing } from '@/types/sanity.types';
import { getCollection } from '@/utils/db-helpers';

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

type ReviewDocument = {
  _id?: string;
  id?: string;
  rating?: number | string;
  comment?: string | null;
  createdAt?: string | Date | null;
  _createdAt?: string | Date | null;
  status?: string | null;
  listingSlug?: string | null;
  user?:
    | string
    | {
        id?: string | null;
        _id?: string | null;
        name?: string | null;
        image?: string | null;
      }
    | null;
};

const DEFAULT_REVIEWS_LIMIT = 10;

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

function isPriceRange(
  value: string | null | undefined
): value is 'budget' | 'moderate' | 'premium' {
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

function extractTagNames(tags?: RelatedListingRecord['ecoFocusTags']): string[] {
  if (!Array.isArray(tags)) return [];
  const names: string[] = [];
  for (const tag of tags) {
    if (typeof tag === 'string' && tag.trim().length > 0) {
      names.push(tag);
      continue;
    }
    if (
      tag &&
      typeof tag === 'object' &&
      typeof tag.name === 'string' &&
      tag.name.trim().length > 0
    ) {
      names.push(tag.name.trim());
    }
  }
  return names;
}

function mapCityRecordToDTO(city?: RelatedListingRecord['city']): CityDTO | null {
  if (!city || !city._id || !city.name || !city.country || !city.slug) {
    return null;
  }
  return {
    id: city._id,
    name: city.name,
    slug: city.slug,
    country: city.country,
  };
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

// Wrap in React cache() to deduplicate requests within the same render pass
const fetchListingBySlug = cache(async (slug: string): Promise<ListingDetailDTO | null> => {
  const raw = await client.fetch<SanityListing | null>(LISTING_QUERY, { slug });
  if (!raw) return null;
  try {
    return transformToDetailDTO(raw);
  } catch (e) {
    logger.error('Failed to transform listing payload', e, { slug, component: 'listings/[slug]' });
    return null;
  }
});

async function fetchRelatedListings(cityId?: string, excludeId?: string) {
  if (!cityId)
    return [] as Array<{
      id: string;
      name: string;
      slug: string;
      imageUrl: string;
      city: string | CityDTO | null;
      priceRange: 'budget' | 'moderate' | 'premium';
      ecoFocusTags: string[];
    }>;
  try {
    const records = await client.fetch<RelatedListingRecord[]>(RELATED_QUERY, {
      cityId,
      excludeId,
    });
    return records.map(record => {
      const priceRange = isPriceRange(record.priceRange) ? record.priceRange : 'moderate';

      return {
        id: record._id ?? '',
        name: record.name ?? '',
        slug: record.slug ?? '',
        imageUrl: record.imageUrl ?? '',
        city: mapCityRecordToDTO(record.city),
        priceRange,
        ecoFocusTags: extractTagNames(record.ecoFocusTags),
      };
    });
  } catch (error) {
    logger.error('Failed to fetch related listings', error, {
      component: 'listings/[slug]',
      cityId,
      excludeId,
    });
    return [];
  }
}

async function fetchReviews(listingSlug: string, userId?: string): Promise<Review[]> {
  try {
    const collection = (await getCollection('reviews')) as Collection<ReviewDocument>;

    const filter: Filter<ReviewDocument> = { listingSlug };
    if (userId) {
      filter.$or = [{ status: 'approved' }, { status: 'pending', user: userId }];
    } else {
      filter.status = 'approved';
    }

    const documents = await collection
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(DEFAULT_REVIEWS_LIMIT)
      .toArray();

    const reviews: Review[] = [];

    for (const review of documents) {
      const id =
        typeof review?.id === 'string'
          ? review.id
          : typeof review?._id === 'string'
            ? review._id
            : null;

      const rating = Number((review as ReviewDocument)?.rating);
      if (!id || !Number.isFinite(rating) || rating <= 0) {
        continue;
      }

      const status = review?.status === 'pending' ? 'pending' : 'approved';
      const comment = typeof review?.comment === 'string' ? review.comment : '';
      const createdAtValue = (() => {
        const createdAt = review?.createdAt;
        const createdAtFallback = review?._createdAt;

        if (createdAt instanceof Date) return createdAt.toISOString();
        if (typeof createdAt === 'string') return createdAt;
        if (createdAtFallback instanceof Date) return createdAtFallback.toISOString();
        if (typeof createdAtFallback === 'string') return createdAtFallback;
        return new Date().toISOString();
      })();

      const rawUser = review?.user;
      let userName = 'Anonymous';
      let userImage: string | undefined;
      let mappedUserId: string | undefined;

      if (typeof rawUser === 'string') {
        mappedUserId = rawUser;
      } else if (rawUser && typeof rawUser === 'object') {
        const maybeName = typeof rawUser.name === 'string' ? rawUser.name.trim() : '';
        if (maybeName) {
          userName = maybeName;
        }
        const maybeImage = typeof rawUser.image === 'string' ? rawUser.image : undefined;
        userImage = maybeImage && maybeImage.length > 0 ? maybeImage : undefined;
        mappedUserId =
          typeof rawUser.id === 'string'
            ? rawUser.id
            : typeof rawUser._id === 'string'
              ? rawUser._id
              : undefined;
      }

      reviews.push({
        id,
        rating,
        comment,
        createdAt: createdAtValue,
        status,
        user: { name: userName, image: userImage, id: mappedUserId },
      });
    }

    return reviews;
  } catch (error) {
    logger.error('Failed to fetch listing reviews', error, {
      component: 'listings/[slug]',
      listingSlug,
      userId,
    });
    return [];
  }
}

async function checkIsFavorited(listingId: string, userId?: string): Promise<boolean> {
  if (!userId) return false;
  try {
    const favorite = await client.fetch<{ _id?: string | null } | null>(FAVORITE_QUERY, {
      userId,
      listingId,
    });
    return Boolean(favorite?._id);
  } catch (error) {
    logger.error('Failed to check favorite status', error, {
      component: 'listings/[slug]',
      listingId,
      userId,
    });
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

  // FORTEST: Wrap headers() in try-catch for compatibility with prerender
  let _h = null as
    | null
    | Awaited<Awaited<ReturnType<typeof headers>>>
    | { get(name: string): string | null | undefined };
  try {
    _h = await headers();
  } catch {
    _h = null;
  }

  const sessionPromise = auth(_h);
  const listing = await fetchListingBySlug(slug);
  if (!listing) notFound();

  const session = await sessionPromise;
  const user = session?.user as { id?: string; role?: UserRole } | undefined;
  const userId = user?.id;
  const isSignedIn = Boolean(session && userId);

  const [relatedListings, reviews, isFavorited] = await Promise.all([
    fetchRelatedListings(listing.city?.id, listing.id),
    fetchReviews(listing.slug, userId),
    checkIsFavorited(listing.id, userId),
  ]);

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
