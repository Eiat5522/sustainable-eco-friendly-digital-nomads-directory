import type { Metadata } from 'next';
import { groq } from 'next-sanity';
import { Suspense } from 'react';
import { CategoryListings } from '@/components/category/CategoryListings';
import { sanityFetch } from '@/lib/sanity/client';

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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `${slug.charAt(0).toUpperCase() + slug.slice(1)} Category`,
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  return (
    <main className="container mx-auto py-12">
      <h1 className="text-2xl font-bold mb-4">Category: {slug}</h1>
      <Suspense fallback={<p>Loading listings...</p>}>
        <CategoryListings slug={slug} />
      </Suspense>
    </main>
  );
}
