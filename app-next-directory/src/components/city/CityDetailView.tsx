import { Leaf, MapPin, Wifi, DollarSign, Thermometer, Shield, Footprints, Wind } from 'lucide-react';
import { NeoBadge } from '@/components/ui/neo-badge';
import type { CityDTO, CityDetailDTO, ListingSummaryDTO } from '@/types/dto';
import { ListingGrid } from '@/components/listings/ListingGrid';
import Image from 'next/image';

interface CityDetailViewProps {
  city: CityDTO | CityDetailDTO;
  listings: ListingSummaryDTO[];
}

export function CityDetailView({ city, listings }: CityDetailViewProps) {
  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        {/* City Header with Image */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
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

          {/* City Image */}
          {city.imageUrl && (
            <div className="relative h-96 w-full overflow-hidden rounded-xl border-4 border-black bg-white shadow-[8px_8px_0_0_rgba(0,0,0,1)] mb-6">
              <Image
                src={city.imageUrl}
                alt={`${city.name} cityscape`}
                fill
                sizes="(min-width: 1024px) 100vw, 100vw"
                className="object-cover"
                onError={(e) => {
                  // Fallback to gradient background if image fails to load
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    parent.className = parent.className.replace('bg-white', 'bg-gradient-to-br from-emerald-200 to-sky-200');
                  }
                }}
              />
            </div>
          )}

        {/* City Description */}
        {city.description && (
          <div className="prose prose-lg max-w-none mb-6">
            <p className="text-neo-text-secondary leading-relaxed">{city.description}</p>
          </div>
        )}

        {/* Additional City Details (only shown for CityDetailDTO) */}
        {'shortDescription' in city && city.shortDescription && (
          <div className="bg-neo-bg-secondary rounded-xl p-6 mb-6">
            <h3 className="heading-sm mb-4">Quick Facts</h3>
            <p className="text-neo-text-secondary mb-4">{city.shortDescription}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {'internetSpeed' in city && city.internetSpeed && (
                <div className="flex items-center gap-2">
                  <Wifi size={16} className="text-neo-primary" />
                  <span className="text-sm">{city.internetSpeed} Mbps avg</span>
                </div>
              )}

              {'costOfLiving' in city && city.costOfLiving && (
                <div className="flex items-center gap-2">
                  <DollarSign size={16} className="text-neo-primary" />
                  <span className="text-sm">{city.costOfLiving}</span>
                </div>
              )}

              {'climate' in city && city.climate && (
                <div className="flex items-center gap-2">
                  <Thermometer size={16} className="text-neo-primary" />
                  <span className="text-sm">{city.climate}</span>
                </div>
              )}

              {'safety' in city && city.safety && (
                <div className="flex items-center gap-2">
                  <Shield size={16} className="text-neo-primary" />
                  <span className="text-sm">{city.safety}</span>
                </div>
              )}

              {'walkability' in city && city.walkability && (
                <div className="flex items-center gap-2">
                  <Footprints size={16} className="text-neo-primary" />
                  <span className="text-sm">{city.walkability}</span>
                </div>
              )}

              {'airQuality' in city && city.airQuality && (
                <div className="flex items-center gap-2">
                  <Wind size={16} className="text-neo-primary" />
                  <span className="text-sm">{city.airQuality}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sustainability Initiatives (only shown for CityDetailDTO) */}
        {'sustainabilityInitiatives' in city && city.sustainabilityInitiatives && city.sustainabilityInitiatives.length > 0 && (
          <div className="bg-green-50 rounded-xl p-6 mb-6">
            <h3 className="heading-sm mb-4 flex items-center gap-2">
              <Leaf size={20} className="text-green-600" />
              Sustainability Initiatives
            </h3>
            <div className="flex flex-wrap gap-2">
              {city.sustainabilityInitiatives.map((initiative, idx) => (
                <NeoBadge key={idx} variant="success" size="sm">
                  {initiative}
                </NeoBadge>
              ))}
            </div>
          </div>
        )}

        {/* Digital Nomad Features (only shown for CityDetailDTO) */}
        {'digitalNomadFeatures' in city && city.digitalNomadFeatures && city.digitalNomadFeatures.length > 0 && (
          <div className="bg-blue-50 rounded-xl p-6 mb-6">
            <h3 className="heading-sm mb-4">Digital Nomad Features</h3>
            <div className="flex flex-wrap gap-2">
              {city.digitalNomadFeatures.map((feature, idx) => (
                <NeoBadge key={idx} variant="outline" size="sm">
                  {feature}
                </NeoBadge>
              ))}
            </div>
          </div>
        )}
        </div>

        {/* City Highlights */}
        {city.highlights && city.highlights.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-12">
            {city.highlights.map((highlight, idx) => (
              <NeoBadge key={idx} variant="outline" size="sm">
                {highlight}
              </NeoBadge>
            ))}
          </div>
        )}

        {/* Listings Section */}
        <div>
          <h2 className="heading-md mb-6">Places to Work & Stay</h2>
          <ListingGrid listings={listings} />
        </div>
      </div>
    </section>
  );
}
