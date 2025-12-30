'use cache';

import type { Metadata } from 'next';
import { cacheLife, cacheTag } from 'next/cache';
import { groq } from 'next-sanity';
import { client } from '@/lib/sanity/client';

type CategoryListing = {
  _id: string;
  name: string;
  slug: string;
  primaryImage?: unknown;
};

export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  const fallbackCategories = ['coworking'];
  try {
    const categories = await client.fetch<string[]>(
      groq`array::unique(*[_type == "listing" && defined(category)].category)`
    );
    const normalized = (categories ?? []).filter(
      (category): category is string => typeof category === 'string' && category.length > 0
    );

    const slugs = normalized.length > 0 ? normalized : fallbackCategories;

    return slugs.map(slug => ({ slug }));
  } catch (_error) {
    // If fetching categories fails during build, return fallback values for debug prerender.
    return fallbackCategories.map(slug => ({ slug }));
  }
}

export const metadata: Metadata = {
  title: 'Category',
};

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // Cache category pages for a moderate duration
  cacheLife('hours');
  cacheTag(`category-${slug}`);

  // Fetch listings for this category (safe, will return empty array on error)
  let listings: CategoryListing[] = [];
  try {
    const LISTINGS_BY_CATEGORY = groq`*[_type == "listing" && category == $category && moderation.status == "published"]{ _id, name, "slug": slug.current, primaryImage }`;
    listings =
      (await client.fetch<CategoryListing[]>(LISTINGS_BY_CATEGORY, { category: slug })) ?? [];
  } catch (_error) {
    // swallow - page will render with no results
  }

  return (
    <main className="container mx-auto py-12">
      <h1 className="text-2xl font-bold mb-4">Category: {slug}</h1>
      <p className="mb-6">Listings found: {listings.length}</p>
      <ul className="space-y-3">
        {listings.map(listing => (
          <li key={listing._id} className="p-3 border rounded">
            <a href={`/listings/${listing.slug}`} className="font-medium">
              {listing.name}
            </a>
          </li>
        ))}
      </ul>
    </main>
  );
}
