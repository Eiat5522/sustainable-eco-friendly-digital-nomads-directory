import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PageLayoutServer } from '@/components/layout/PageLayoutServer';
import { ListingGrid } from '@/components/listings/ListingGrid';
import {
  getAllCategorySlugs,
  getCategoryBySlug,
  getCategoryListings,
} from '@/lib/data-access/categories.dal';

type Params = { slug: string };

type Props = { params: Params | Promise<Params> };

export async function generateStaticParams(): Promise<Params[]> {
  const slugs = await getAllCategorySlugs();
  if (slugs.length === 0) {
    return [{ slug: 'placeholder-category' }];
  }
  return slugs.map(slug => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const category = await getCategoryBySlug(resolvedParams.slug);

  if (!category) {
    return {
      title: 'Category Not Found',
      description: 'The requested category does not exist.',
    };
  }

  return {
    title: category.seo?.metaTitle || category.title,
    description: category.seo?.metaDescription || category.description,
  };
}

export default async function CategoryDetailPage({ params }: Props) {
  const resolvedParams = await params;
  const category = await getCategoryBySlug(resolvedParams.slug);

  if (!category) {
    notFound();
  }

  const listings = await getCategoryListings(category.id, category.slug);

  return (
    <PageLayoutServer>
      <div className="relative overflow-hidden bg-neo-secondary px-4 py-12 sm:py-14">
        <div
          className="pointer-events-none absolute inset-0 z-0 opacity-25"
          style={{
            backgroundImage:
              'radial-gradient(circle at 2px 2px, var(--neo-border) 2px, transparent 0)',
            backgroundSize: '28px 28px',
          }}
        />

        <div className="container relative z-10 mx-auto max-w-6xl">
          <div
            className="overflow-hidden border-4 border-neo-border bg-neo-surface"
            style={{ boxShadow: '12px 12px 0px 0px var(--neo-shadow)' }}
          >
            <div className="border-b-4 border-neo-border bg-neo-success p-6 md:p-8">
              <h1 className="heading-lg mb-2">{category.title}</h1>
              <p className="text-sm font-semibold text-neo-text-secondary">
                {category.description}
              </p>
            </div>

            <div className="space-y-6 p-6 md:p-8">
              <p className="text-sm font-semibold text-neo-text-secondary">
                {category.listingCount} published listings
              </p>
              <ListingGrid listings={listings} />
            </div>
          </div>
        </div>
      </div>
    </PageLayoutServer>
  );
}
