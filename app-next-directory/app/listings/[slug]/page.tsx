export const revalidate = 300; // ISR: revalidate every 5 minutes
import { ListingDetailView } from '@/components/listings/ListingDetailView';
import { mockListingDetail, mockRelatedListings, mockReviews } from '@/components/listings/listingDetailMockData';
import { client } from '@/lib/sanity/client';
import { groq } from 'next-sanity';
import { transformToDetailDTO } from '@/lib/dto-transformer';
import type { SanityListing } from '@/types/sanity.types';
import type { CityDTO } from '@/types/dto';
import type { ListingDetailDTO } from '@/types/dto';
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

const REVIEWS_QUERY = groq`*[_type == "review" && listing._ref == $listingId && approved == true] | order(createdAt desc) {
  _id,
  rating,
  comment,
  createdAt,
  user->{
    name,
    image
  }
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
  } catch (error) {
    console.error('[listings/[slug]] failed to fetch related listings', error);
    return [];
  }
}

async function fetchReviews(listingId: string) {
  try {
    const raw = await client.fetch<any[]>(REVIEWS_QUERY, { listingId });
    return (Array.isArray(raw) ? raw : [])
      .map((review) => {
        const id = typeof review._id === 'string' ? review._id : undefined;
        const rating = Number(review.rating);
        if (!id || !Number.isFinite(rating) || rating <= 0) {
          return null;
        }
        const comment = typeof review.comment === 'string' ? review.comment : '';
        const createdAt = typeof review.createdAt === 'string' ? review.createdAt : new Date().toISOString();
        const nameSource = typeof review.user?.name === 'string' ? review.user.name : '';
        const userName = nameSource.trim().length > 0 ? nameSource : 'Anonymous';
        const userImage = typeof review.user?.image === 'string' && review.user.image.length > 0 ? review.user.image : undefined;
        return {
          id,
          rating,
          comment,
          createdAt,
          user: { name: userName, image: userImage },
        };
      })
      .filter((review): review is {
        id: string;
        rating: number;
        comment: string;
        createdAt: string;
        user: { name: string; image?: string };
      } => Boolean(review));
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
    fetchReviews(listing.id),
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
        />
      </main>
      <Footer />
    </>
  );
}
