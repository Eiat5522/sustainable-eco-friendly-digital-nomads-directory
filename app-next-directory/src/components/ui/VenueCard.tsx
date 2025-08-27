import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { NeoCard, NeoCardHeader, NeoCardTitle } from '@/components/ui/neo-card';
import type { FeaturedListingDTO } from '@/types/dto';
import { cn } from '@/lib/utils';

interface VenueCardProps {
  venue: FeaturedListingDTO;
  className?: string;
}

export function VenueCard({ venue, className }: VenueCardProps) {
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
          {venue.imageUrl && (
            <Image
              src={venue.imageUrl}
              alt=""
              aria-hidden={true}

              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          )}
        </div>

        <NeoCardHeader>
          <NeoCardTitle className="group-hover:text-neo-primary transition-colors duration-200">
            {venue.name}
          </NeoCardTitle>
          {venue.city && (
            <p className="body-sm text-neo-text-secondary mt-1">
              {venue.city}
            </p>
          )}
        </NeoCardHeader>
      </NeoCard>
    </Link>
  );
}