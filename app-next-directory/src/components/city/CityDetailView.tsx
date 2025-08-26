import { Leaf, MapPin } from 'lucide-react';
import { NeoBadge } from '@/components/ui/neo-badge';
import type { CityDTO, ListingSummaryDTO } from '@/types/dto';
import { ListingGrid } from '@/components/listings/ListingGrid';

interface CityDetailViewProps {
  city: CityDTO;
  listings: ListingSummaryDTO[];
}

export function CityDetailView({ city, listings }: CityDetailViewProps) {
  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <MapPin className="text-neo-primary" />
            <h1 className="heading-lg">{city.name}</h1>
            {city.sustainabilityScore && (
              <NeoBadge variant="success" className="flex items-center gap-1 ml-2">
                <Leaf size={16} />
                <span>{city.sustainabilityScore}%</span>
              </NeoBadge>
            )}
          </div>
        </div>

        {city.highlights && city.highlights.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-12">
            {city.highlights.map((highlight, idx) => (
              <NeoBadge key={idx} variant="outline" size="sm">
                {highlight}
              </NeoBadge>
            ))}
          </div>
        )}

        <ListingGrid listings={listings} />
      </div>
    </section>
  );
}
