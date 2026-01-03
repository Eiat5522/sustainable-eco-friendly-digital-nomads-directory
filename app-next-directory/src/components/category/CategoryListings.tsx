import { groq } from 'next-sanity';
import { sanityFetch } from '@/lib/sanity/client';

type CategoryListing = {
  _id: string;
  name: string;
  slug: string;
  primaryImage?: any; // Update with correct type structure
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

export async function CategoryListings({ slug }: { slug: string }) {
  // Resolve the original category value from the slug so our Sanity query
  // matches the stored category values (which are not slugified).
  let categoryForQuery = slug;
    const LISTINGS_BY_CATEGORY = groq`*[_type == "listing" && category == $category && defined(moderation) && moderation.status == "published"]{ _id, name, "slug": slug.current, primaryImage }`;
    const categories = (await sanityFetch({
      query: groq`array::unique(*[_type == "listing" && defined(category)].category)`,
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
    listings =
      ((await sanityFetch({
        query: LISTINGS_BY_CATEGORY,
        params: { category: categoryForQuery },
        revalidate: 60 * 60 * 24 * 7,
        tags: [`category:${toSlug(String(categoryForQuery))}`],
      })) as CategoryListing[]) ?? [];
  } catch (_error) {
    // swallow - page will render with no results
  }

  return (
    <>
      <p className="mb-6">Listings found: {listings.length}</p>
      <ul className="space-y-3">
        {listings.map(listing => (
          <li key={listing._id} className="p-3 border rounded">
            {listing.name}
          </li>
        ))}
      </ul>
    </>
  );
}
