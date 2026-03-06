import Image from 'next/image';
import Link from 'next/link';
import { PageLayoutServer } from '@/components/layout/PageLayoutServer';
import { NeoBadge } from '@/components/ui/neo-badge';
import { getCategories } from '@/lib/data-access/categories.dal';

export default async function CategoriesPage() {
  const categories = await getCategories();

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
              <h1 className="heading-lg mb-2">Browse Categories</h1>
              <p className="text-sm font-semibold text-neo-text-secondary">
                Explore sustainable venues by category.
              </p>
            </div>

            <div className="p-6 md:p-8">
              {categories.length === 0 ? (
                <p className="text-sm text-neo-text-secondary">
                  No categories available right now.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {categories.map(category => (
                    <Link
                      key={category.id}
                      href={`/categories/${category.slug}`}
                      className="group block"
                    >
                      <article
                        className="overflow-hidden border-4 border-neo-border bg-neo-surface transition-all group-hover:translate-x-[3px] group-hover:translate-y-[3px] group-hover:shadow-none"
                        style={{ boxShadow: '8px 8px 0px 0px var(--neo-shadow)' }}
                      >
                        <div className="relative h-44 overflow-hidden border-b-4 border-neo-border bg-white">
                          <Image
                            src="/placeholder_image.png"
                            alt=""
                            aria-hidden="true"
                            fill
                            className="object-cover"
                            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                          />
                          {category.heroImageUrl ? (
                            <Image
                              src={category.heroImageUrl}
                              alt={category.title}
                              fill
                              className="object-cover"
                              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                            />
                          ) : null}
                        </div>

                        <div className="space-y-3 p-4">
                          <h2 className="font-bold text-neo-text-primary">{category.title}</h2>
                          <p className="text-sm text-neo-text-secondary line-clamp-3">
                            {category.description}
                          </p>
                          <NeoBadge variant="success">
                            {category.listingCount}{' '}
                            {category.listingCount === 1 ? 'listing' : 'listings'}
                          </NeoBadge>
                        </div>
                      </article>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageLayoutServer>
  );
}
