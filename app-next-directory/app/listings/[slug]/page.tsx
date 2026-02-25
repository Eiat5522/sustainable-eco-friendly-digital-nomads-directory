import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { Suspense } from 'react';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { ListingDetailView } from '@/components/listings/ListingDetailView';
import {
  mockListingDetail,
  mockRelatedListings,
  mockReviews,
} from '@/components/listings/listingDetailMockData';
import { getListingReviews } from '@/lib/data-access/favorites.dal';
import {
  getListingBySlug,
  getPopularListingSlugs,
  getRelatedListings,
} from '@/lib/data-access/listings.dal';
import { structuredLogger as logger } from '@/lib/logger';
import type { UserRole } from '@/types/auth';
import type { ListingDetailDTO } from '@/types/dto';

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
    listing.galleryImages = ['/test-images/gallery-1.svg', '/test-images/gallery-2.svg'];
  } else {
    listing.galleryImages = listing.galleryImages.map((src, index) => {
      if (typeof src === 'string' && src.trim().length > 0) {
        return src === '/placeholder_image.png' ? `/test-images/gallery-${index + 1}.svg` : src;
      }
      return `/test-images/gallery-${index + 1}.svg`;
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

// Generate static params for popular listings using DAL
export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  try {
    const popularSlugs = await getPopularListingSlugs();
    return popularSlugs.map(item => ({ slug: item.slug }));
  } catch (error) {
    logger.error('Failed to generate static params for listings', error, {
      component: 'listings/[slug]',
    });
    // Return a placeholder on error to satisfy Cache Components requirement
    return [{ slug: 'placeholder-listing' }];
  }
}

/**
 * Main listing content with data fetching
 * Wrapped in Suspense for better loading states
 */
async function ListingContent({ slug }: { slug: string }) {
  // Access connection() first to opt-in to dynamic rendering
  await connection();

  if (isE2ETest) {
    if (slug === E2E_ERROR_SLUG) {
      throw new Error('E2E forced listing error');
    }

    const fixture = e2eFixtures[slug];
    if (!fixture) notFound();

    const { listing, reviews, relatedListings, isSignedIn, isFavorited } = cloneFixture(fixture);

    return (
      <ListingDetailView
        listing={listing}
        reviews={reviews}
        relatedListings={relatedListings}
        isSignedIn={isSignedIn}
        isFavorited={isFavorited}
      />
    );
  }

  const { auth } = await import('@/lib/auth');

  const session = await auth();
  const user = session?.user as { id?: string; role?: UserRole } | undefined;
  const userId = user?.id;
  const isSignedIn = Boolean(session && userId);

  // Use DAL functions for cached data fetching
  const listing = await getListingBySlug(slug);
  if (!listing) notFound();

  // Fetch related data - reviews and related listings are cached via DAL
  const [relatedListings, reviews] = await Promise.all([
    getRelatedListings(listing.city?.id, listing.id),
    getListingReviews(listing.slug, userId),
  ]);

  return (
    <ListingDetailView
      listing={listing}
      reviews={reviews}
      relatedListings={relatedListings}
      isSignedIn={isSignedIn}
      isFavorited={false}
      userId={userId}
    />
  );
}

export default async function ListingPage({ params }: Props) {
  const { slug } = await params;
  const listingContent = await ListingContent({ slug });

  return (
    <>
      <Suspense fallback={<div className="h-16 bg-gray-100 animate-pulse" />}>
        <Header />
      </Suspense>
      <main className="relative overflow-hidden bg-neo-secondary px-4 py-8">
        <div
          className="pointer-events-none absolute inset-0 z-0 opacity-25"
          style={{
            backgroundImage:
              'radial-gradient(circle at 2px 2px, var(--neo-border) 2px, transparent 0)',
            backgroundSize: '28px 28px',
          }}
        />
        <div className="relative z-10">{listingContent}</div>
      </main>
      <Suspense fallback={<div className="h-32 bg-gray-100 animate-pulse" />}>
        <Footer />
      </Suspense>
    </>
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  if (isE2ETest) {
    if (slug === E2E_ERROR_SLUG) {
      return { title: 'Listing error' };
    }

    const fixture = e2eFixtures[slug];
    if (!fixture) {
      return { title: 'Listing not found' };
    }

    const summary =
      fixture.listing.shortDescription ?? fixture.listing.longDescription ?? 'Listing details';
    const description = summary ? summary.slice(0, 160) : undefined;
    const primaryImage =
      fixture.listing.galleryImages?.[0] ?? fixture.listing.imageUrl ?? undefined;

    return {
      title: fixture.listing.name,
      description,
      openGraph: {
        title: fixture.listing.name,
        description,
        images: primaryImage ? [primaryImage] : undefined,
      },
    };
  }

  const listing = await getListingBySlug(slug);

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
