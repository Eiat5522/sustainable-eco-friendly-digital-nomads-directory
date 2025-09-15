import Image from 'next/image';
import Link from 'next/link';
import { NeoCard, NeoCardHeader, NeoCardTitle, NeoCardContent } from '@/components/ui/neo-card';
import type { ListingSummaryDTO } from '@/types/dto';
import { NoListingsFound } from '@/components/listings/NoListingsFound';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ListingGridProps {
  listings: ListingSummaryDTO[];
}

export function ListingGrid({ listings }: ListingGridProps) {
  if (!Array.isArray(listings) || listings.length === 0) {
    return <NoListingsFound />;
  }

  const tagColor = (text: string, category: 'eco' | 'amenity') => {
    const t = text.toLowerCase();
    if (category === 'eco') {
      if (/solar|renewable|energy/.test(t)) return 'bg-emerald-100 text-emerald-700';
      if (/waste|zero|recycl/.test(t)) return 'bg-lime-100 text-lime-700';
      if (/water|conserv/.test(t)) return 'bg-cyan-100 text-cyan-700';
      if (/vegan|vegetarian|organic/.test(t)) return 'bg-teal-100 text-teal-700';
      if (/garden|bike|walk|green/.test(t)) return 'bg-green-100 text-green-700';
      return 'bg-emerald-100 text-emerald-700';
    }
    if (/wifi|internet/.test(t)) return 'bg-blue-100 text-blue-700';
    if (/meeting|conference|room|call/.test(t)) return 'bg-indigo-100 text-indigo-700';
    if (/24\/?7|24-7|24x7|access/.test(t)) return 'bg-purple-100 text-purple-700';
    if (/kitchen|restaurant|bar|cafe/.test(t)) return 'bg-amber-100 text-amber-800';
    if (/security|locker|safe/.test(t)) return 'bg-orange-100 text-orange-700';
    if (/bike|parking/.test(t)) return 'bg-sky-100 text-sky-700';
    if (/garden|terrace|rooftop/.test(t)) return 'bg-green-100 text-green-700';
    return 'bg-blue-100 text-blue-700';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {listings.map((listing) => (
        <Link key={listing.id} href={`/listings/${listing.slug}`} className="block">
          <NeoCard
            variant="elevated"
            className="group hover:shadow-[16px_16px_0px_0px] transition-all duration-300 cursor-pointer"
          >
            <div className="relative h-48 mb-4 overflow-hidden rounded-lg">
              {/* Local placeholder */}
              <Image
                src="/placeholder_image.png"
                alt="Listing placeholder"
                fill
                sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                className="object-cover"
              />
              {/* Remote image layered above; hide on error */}
              {listing.imageUrl && (
                <Image
                  src={listing.imageUrl}
                  alt={`${listing.name}, ${listing.city?.name ?? ''}`}
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e: React.SyntheticEvent<HTMLImageElement>) => { e.currentTarget.hidden = true; }}
                />
              )}
              {listing.featured && (
                <div className="absolute top-3 right-3 flex items-center gap-1 bg-yellow-400 text-black px-2 py-1 rounded-full shadow">
                  <Star size={14} className="fill-black" aria-hidden />
                  <span className="text-xs font-bold">Featured</span>
                </div>
              )}
            </div>
            <NeoCardHeader>
              <NeoCardTitle className="group-hover:text-neo-primary transition-colors duration-200">
                {listing.name}
              </NeoCardTitle>
              {listing.city?.name && (
                <p className="body-sm text-neo-text-secondary mt-1">
                  {listing.city.name}
                </p>
              )}
            </NeoCardHeader>
            {(Array.isArray(listing.ecoFocusTags) && listing.ecoFocusTags.length > 0) ||
             (Array.isArray(listing.amenityNames) && listing.amenityNames.length > 0) ? (
              <NeoCardContent>
                {Array.isArray(listing.ecoFocusTags) && listing.ecoFocusTags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {listing.ecoFocusTags.slice(0, 3).map((tag, index) => (
                      <span
                        key={`eco-${index}`}
                        className={cn('px-2 py-1 text-xs rounded-lg font-medium', tagColor(tag, 'eco'))}
                      >
                        {tag}
                      </span>
                    ))}
                    {listing.ecoFocusTags.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-lg font-medium">
                        +{listing.ecoFocusTags.length - 3} more
                      </span>
                    )}
                  </div>
                )}
                {Array.isArray(listing.amenityNames) && listing.amenityNames.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {listing.amenityNames.slice(0, 3).map((name, index) => (
                      <span
                        key={`amenity-${index}`}
                        className={cn('px-2 py-1 text-xs rounded-lg font-medium', tagColor(name, 'amenity'))}
                      >
                        {name}
                      </span>
                    ))}
                    {listing.amenityNames.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-lg font-medium">
                        +{listing.amenityNames.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </NeoCardContent>
            ) : null}
          </NeoCard>
        </Link>
      ))}
    </div>
  );
}
