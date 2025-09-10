import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { NeoCard, NeoCardHeader, NeoCardTitle } from '@/components/ui/neo-card';
import type { FeaturedListingDTO } from '@/types/dto';
import { cn } from '@/lib/utils';

interface VenueCardProps {
  venue: FeaturedListingDTO;
  className?: string;
  priority?: boolean;
}

export function VenueCard({ venue, className, priority = false }: Readonly<VenueCardProps>) {
  // Guard against unexpected shapes from API by safely deriving a city label
  const cityLabel = (() => {
    const v: any = venue as any;
    const c = v?.city;
    if (typeof c === 'string') return c;
    if (c && typeof c === 'object' && typeof c.name === 'string') return c.name;
    return '';
  })();
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
            alt="Venue placeholder"
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
            className="object-cover"
            priority={priority}
          />
          {/* Remote image layered above; hide on error so placeholder shows */}
          {venue.imageUrl && (
            <Image
              src={venue.imageUrl}
              alt={venue.name}
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              priority={priority}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
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
      </NeoCard>
    </Link>
  );
}
