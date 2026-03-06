import { Leaf, MapPin } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { PageLayoutServer } from '@/components/layout/PageLayoutServer';
import { NeoBadge } from '@/components/ui/neo-badge';
import { getCities } from '@/lib/data-access';

export default async function CitiesPage() {
  const cities = await getCities(24);

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
              <h1 className="heading-lg mb-2">Featured Cities</h1>
              <p className="text-sm font-semibold text-neo-text-secondary">
                Explore eco-forward destinations built for digital nomads.
              </p>
            </div>

            <div className="p-6 md:p-8">
              {cities.length === 0 ? (
                <p className="text-sm text-neo-text-secondary">No cities available right now.</p>
              ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {cities.map(city => (
                    <Link key={city.id} href={`/cities/${city.slug}`} className="group block">
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
                          {city.imageUrl ? (
                            <Image
                              src={city.imageUrl}
                              alt={city.name}
                              fill
                              className="object-cover"
                              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                            />
                          ) : null}
                        </div>
                        <div className="space-y-3 p-4">
                          <div className="flex items-center gap-2">
                            <MapPin size={16} className="text-neo-primary" />
                            <h2 className="font-bold text-neo-text-primary">{city.name}</h2>
                          </div>
                          {city.country ? (
                            <p className="text-xs font-semibold uppercase tracking-wide text-neo-text-secondary">
                              {city.country}
                            </p>
                          ) : null}
                          {typeof city.sustainabilityScore === 'number' ? (
                            <NeoBadge variant="success" className="inline-flex items-center gap-1">
                              <Leaf size={14} />
                              {city.sustainabilityScore}%
                            </NeoBadge>
                          ) : null}
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
