// MIGRATED: Removed export const revalidate = 300 (incompatible with Cache Components)

import type { Metadata } from 'next';
import { groq } from 'next-sanity';
import { cache, Suspense } from 'react';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { client } from '@/lib/sanity/client';
import ListingContent from './ListingContent'; // Import the new component

type Props = { params: Promise<{ slug: string }> };

const LISTING_QUERY_FOR_METADATA = groq`*[_type == "listing" && moderation.status == "published" && slug.current == $slug][0]{
  name, shortDescription, longDescription, primaryImage, "imageUrl": primaryImage.asset->url, galleryImages
}`;

const fetchListingForMetadata = cache(async (slug: string) => {
  return client().fetch<{
    name?: string;
    shortDescription?: string;
    longDescription?: string;
    primaryImage?: { asset?: { url?: string } };
    imageUrl?: string;
    galleryImages?: Array<{ asset?: { url?: string } }>;
  } | null>(
    LISTING_QUERY_FOR_METADATA,
    { slug },
    { revalidate: 60 } // Add revalidate option for caching
  );
});

export default async function ListingPage({ params }: Props) {
  const { slug } = await params;

  // Authentication is dynamic and will happen inside ListingContent if needed,
  // or a wrapper that is not Suspended
  // Or, if session is truly needed for ALL listing content, it could be passed to ListingContent.

  return (
    <>
      <Header />
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="p-8 bg-white shadow-md rounded-lg text-center">
              <h1 className="text-2xl font-semibold text-gray-800 mb-4">Loading Listing...</h1>
              <p className="text-gray-600">Please wait</p>
            </div>
          </div>
        }
      >
        <ListingContent slug={slug} />
      </Suspense>
      <Footer />
    </>
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const listing = await fetchListingForMetadata(slug);

  if (!listing) {
    return { title: 'Listing not found' };
  }

  const summary = listing.shortDescription ?? listing.longDescription ?? '';
  const description = summary ? summary.slice(0, 160) : undefined;
  const primaryImage = listing.galleryImages?.[0]?.asset?.url ?? listing.imageUrl ?? undefined;

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

export async function generateStaticParams() {
  const posts = await client().fetch(
    groq`*[_type == "listing" && defined(slug.current)]{ "slug": slug.current }`,
    {}, // No params needed for this query
    { revalidate: 60 } // Add revalidate option for caching
  );
  if (!posts || posts.length === 0) {
    return [{ slug: 'no-posts' }];
  }
  return posts.map((post: { slug: string }) => ({
    slug: post.slug,
  }));
}
