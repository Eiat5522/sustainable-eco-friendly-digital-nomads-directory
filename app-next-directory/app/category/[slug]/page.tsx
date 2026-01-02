import type { Metadata } from 'next';
import { groq } from 'next-sanity';
import { sanityFetch } from '@/lib/sanity/client';

type CategoryListing = {
  _id: string;
  name: string;
  slug: string;
};
function toSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  const fallbackCategories = ['coworking'];
  try {
    const categories = (await sanityFetch({
      query: groq`array::unique(*[_type == "listing" && defined(category)].category)`,
      revalidate: 60 * 60 * 24 * 7,
      tags: ['categories:list'],
    })) as string[];

    const normalized = (categories ?? [])
      .filter((category): category is string => typeof category === 'string' && category.length > 0)
      .map(c => toSlug(c))
      .filter(s => s.length > 0);

    const unique = Array.from(new Set(normalized));
    const slugs = unique.length > 0 ? unique : fallbackCategories.map(toSlug);

    return slugs.map(slug => ({ slug }));
  } catch (_error) {
    // If fetching categories fails during build, return fallback values for debug prerender.
    return fallbackCategories.map(toSlug).map(slug => ({ slug }));
  }
}

export const metadata: Metadata = {
  title: 'Category',
};

export default async function CategoryPage({ params }: { params: { slug: string } }) {

  const { slug } = params;

  // Resolve the original category value from the slug so our Sanity query
  // matches the stored category values (which are not slugified).
  let categoryForQuery = slug;
  try {
    const categories = (await sanityFetch({
      query: groq`array::unique(*[_type == "listing" && defined(category)].category)`,
      // Use a cached/long-lived tag for the categories index; it changes very
      // rarely so we can safely cache for long periods and revalidate via tags
      // when content updates happen.
      revalidate: 60 * 60 * 24 * 7,
      tags: ['categories:list'],
    })) as string[];
    const matched = (categories ?? []).find(c => toSlug(String(c)) === slug);
    if (matched && typeof matched === 'string') {
      categoryForQuery = matched;
    }
  } catch (_err) {
    // If lookup fails, fall back to using the slug directly which may still
    // work if listings store slugified category values.
  }
  // Fetch listings for this category (safe, will return empty array on error)
  let listings: CategoryListing[] = [];
  try {
    const LISTINGS_BY_CATEGORY = groq`*[_type == "listing" && category == $category && moderation.status == "published"]{ _id, name, "slug": slug.current, primaryImage }`;
    // Tag listings by category so we can revalidate a single category when
    // its listings change. Tags give fine-grained control without relying on
    // short time-based revalidation.
    listings =
      ((await sanityFetch({
        query: LISTINGS_BY_CATEGORY,
        params: { category: categoryForQuery },
        // For tag-based caching we set tags and let Next.js manage freshness
        // via tag invalidation. We still provide a long time-based fallback.
        revalidate: 60 * 60 * 24 * 7,
        tags: [`category:${toSlug(String(categoryForQuery))}`],
      })) as CategoryListing[]) ?? [];
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
            {listing.name}
          </li>
        ))}
      </ul>
    </main>
  );
}
