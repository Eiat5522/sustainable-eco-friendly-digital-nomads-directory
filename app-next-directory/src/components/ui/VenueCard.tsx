import Image from 'next/image';
import Link from 'next/link';
import * as React from 'react';
import { NeoCard, NeoCardHeader, NeoCardTitle } from '@/components/ui/neo-card';
import { cn } from '@/lib/utils';
import type { FeaturedListingDTO } from '@/types/dto';

interface VenueCardProps {
  venue: FeaturedListingDTO;
  className?: string;
  priority?: boolean;
}

export function VenueCard({ venue, className, priority = false }: Readonly<VenueCardProps>) {
  const [imgErr, setImgErr] = React.useState(false);
  const cityLabel = venue.city.trim().length > 0 ? venue.city : '';

  // Truncate long titles to prevent card height variation
  const truncatedTitle = venue.name.length > 60 ? `${venue.name.substring(0, 60)}...` : venue.name;

  return (
    <Link href={`/listings/${venue.slug}`} className={cn('block', className)}>
      <NeoCard
        variant="elevated"
        className="group hover:shadow-[16px_16px_0px_0px] transition-all duration-300 cursor-pointer h-full flex flex-col"
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

        </div>

        <NeoCardHeader className="flex-grow">
          <NeoCardTitle className="group-hover:text-neo-primary transition-colors duration-200 line-clamp-2">
            {truncatedTitle}
          </NeoCardTitle>
          {cityLabel && <p className="body-sm text-neo-text-secondary mt-1">{cityLabel}</p>}
        </NeoCardHeader>
      </NeoCard>
    </Link>
  );
}
