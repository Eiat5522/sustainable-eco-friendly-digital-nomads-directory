import Image from 'next/image';
import Link from 'next/link';
import { NeoCard, NeoCardHeader, NeoCardTitle } from '@/components/ui/neo-card';
import type { ListingSummaryDTO } from '@/types/dto';

interface ListingGridProps {
  listings: ListingSummaryDTO[];
}

export function ListingGrid({ listings }: ListingGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {listings.map((listing) => (
        <Link key={listing.id} href={`/listings/${listing.slug}`} className="block">
          <NeoCard
            variant="elevated"
            className="group hover:shadow-[16px_16px_0px_0px] transition-all duration-300 cursor-pointer"
          >
            <div className="relative h-48 mb-4 overflow-hidden rounded-lg">
              {listing.imageUrl && (
                <Image
                  src={listing.imageUrl}
                  alt={`${listing.name}, ${listing.city?.name ?? ''}`}
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
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
          </NeoCard>
        </Link>
      ))}
    </div>
  );
}
