import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { NeoCard, NeoCardHeader, NeoCardTitle, NeoCardContent } from '@/components/ui/neo-card';
import type { FeaturedListingDTO } from '@/types/dto';
import { cn } from '@/lib/utils';
import { Star } from 'lucide-react';

interface VenueCardProps {
  venue: FeaturedListingDTO;
  className?: string;
  priority?: boolean;
}

export function VenueCard({ venue, className, priority = false }: Readonly<VenueCardProps>) {
  const [imgErr, setImgErr] = React.useState(false);
  // Guard against unexpected shapes from API by safely deriving a city label
  const cityLabel = (() => {
    const v: any = venue as any;
    const c = v?.city;
    if (typeof c === 'string') return c;
    if (c && typeof c === 'object' && typeof c.name === 'string') return c.name;
    return '';
  })();

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
    // amenity
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
    <Link href={`/listings/${venue.slug}`} className="block">
      <NeoCard 
        variant="elevated" 
        className={cn(
          "group hover:shadow-[16px_16px_0px_0px] transition-all duration-300 cursor-pointer",
          className
        )}
      >
        <div className="relative h-48 mb-4 overflow-hidden rounded-lg">
          {/* Local placeholder to guarantee a visible image */}
          <Image
            src="/placeholder_image.png"
            alt=""
            aria-hidden="true"
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
            className="object-cover"
            priority={priority}
          />
          {/* Remote image layered above; hide on error so placeholder shows */}
          {venue.imageUrl && !imgErr && (
            <Image
              src={venue.imageUrl}
              alt={venue.name}
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              priority={priority}
              onError={() => setImgErr(true)}
            />
          )}

          {/* Featured star badge */}
          {venue.featured && (
            <div className="absolute top-3 right-3 flex items-center gap-1 bg-yellow-400 text-black px-2 py-1 rounded-full shadow">
              <Star size={14} className="fill-black" aria-hidden />
              <span className="text-xs font-bold">Featured</span>
            </div>
          )}
        </div>

        <NeoCardHeader>
          <NeoCardTitle className="group-hover:text-neo-primary transition-colors duration-200">
            {venue.name}
          </NeoCardTitle>
          {cityLabel && (
            <p className="body-sm text-neo-text-secondary mt-1">
              {cityLabel}
            </p>
          )}
        </NeoCardHeader>

        {(Array.isArray(venue.ecoFocusTags) && venue.ecoFocusTags.length > 0) ||
         (Array.isArray(venue.amenityNames) && venue.amenityNames.length > 0) ? (
          <NeoCardContent>
            {/* Eco feature badges */}
            {Array.isArray(venue.ecoFocusTags) && venue.ecoFocusTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {venue.ecoFocusTags.slice(0, 3).map((tag, idx) => (
                  <span
                    key={`eco-${idx}`}
                    className={cn('px-2 py-1 text-xs rounded-lg font-medium', tagColor(tag, 'eco'))}
                  >
                    {tag}
                  </span>
                ))}
                {venue.ecoFocusTags.length > 3 && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-lg font-medium">
                    +{venue.ecoFocusTags.length - 3} more
                  </span>
                )}
              </div>
            )}

            {/* Amenity badges */}
            {Array.isArray(venue.amenityNames) && venue.amenityNames.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {venue.amenityNames.slice(0, 3).map((name, idx) => (
                  <span
                    key={`amenity-${idx}`}
                    className={cn('px-2 py-1 text-xs rounded-lg font-medium', tagColor(name, 'amenity'))}
                  >
                    {name}
                  </span>
                ))}
                {venue.amenityNames.length > 3 && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-lg font-medium">
                    +{venue.amenityNames.length - 3} more
                  </span>
                )}
              </div>
            )}
          </NeoCardContent>
        ) : null}
      </NeoCard>
    </Link>
  );
}
