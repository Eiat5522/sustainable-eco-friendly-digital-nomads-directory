import { useState } from 'react';
import { Leaf, MapPin, Wifi, DollarSign, Thermometer, Shield, Footprints, Wind } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Image from 'next/image';
import { NeoBadge } from '@/components/ui/neo-badge';
import { ListingGrid } from '@/components/listings/ListingGrid';
import type { CityDTO, CityDetailDTO, ListingSummaryDTO } from '@/types/dto';

interface CityDetailViewProps {
  city: CityDTO | CityDetailDTO;
  listings: ListingSummaryDTO[];
}

export function CityDetailView({ city, listings }: CityDetailViewProps) {
  const [imageError, setImageError] = useState(false);

function isCityDetailDTO(city: CityDTO | CityDetailDTO): city is CityDetailDTO {
  return 'shortDescription' in city;
}

  // Config map for Quick Facts to reduce repetition and centralize formatting
  type QuickFactField = 'internetSpeed' | 'costOfLiving' | 'climate' | 'safety' | 'walkability' | 'airQuality';
  type QuickFactConfig = Readonly<{
    field: QuickFactField;
    icon: LucideIcon;
    formatter: (value: unknown) => string | null;
  }>;

  const formatInternetSpeed = (value: unknown): string | null => {
    if (typeof value === 'number' && Number.isFinite(value)) return `${value} Mbps avg`;
    if (value && typeof value === 'object') {
      const v: any = value;
      const d = Number(v.download);
      const u = Number(v.upload);
      const hasD = Number.isFinite(d);
      const hasU = Number.isFinite(u);
      if (hasD && hasU) return `${d}↓ / ${u}↑ Mbps`;
      if (hasD) return `${d} Mbps down`;
      if (hasU) return `${u} Mbps up`;
    }
    return null;
  };

  const quickFactsConfig: readonly QuickFactConfig[] = [
    { field: 'internetSpeed', icon: Wifi, formatter: formatInternetSpeed },
    { field: 'costOfLiving', icon: DollarSign, formatter: (v) => (typeof v === 'string' && v.trim() ? v : null) },
    { field: 'climate', icon: Thermometer, formatter: (v) => (typeof v === 'string' && v.trim() ? v : null) },
    { field: 'safety', icon: Shield, formatter: (v) => (typeof v === 'string' && v.trim() ? v : null) },
    { field: 'walkability', icon: Footprints, formatter: (v) => (typeof v === 'string' && v.trim() ? v : null) },
    { field: 'airQuality', icon: Wind, formatter: (v) => (typeof v === 'string' && v.trim() ? v : null) },
  ] as const;

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        {/* City Header */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <MapPin className="text-neo-primary" />
              <h1 className="heading-lg">{city.name}</h1>
              {city.sustainabilityScore !== undefined && (
                <NeoBadge variant="success" className="flex items-center gap-1 ml-2">
                  <Leaf size={16} />
                  <span>{city.sustainabilityScore}%</span>
                </NeoBadge>
              )}
            </div>
          </div>

          {/* City Image with graceful fallback */}
          {city.imageUrl && (
            <div
              className={`relative h-96 w-full overflow-hidden rounded-xl border-4 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] mb-6 ${
                imageError ? 'bg-gradient-to-br from-emerald-200 to-sky-200' : 'bg-white'
              }`}
            >
              {!imageError && (
                <Image
                  src={city.imageUrl}
                  alt={`${city.name} cityscape`}
                  fill
                  priority
                  sizes="(min-width: 1024px) 100vw, 100vw"
                  className="object-cover"
                  onError={() => setImageError(true)}
                />
              )}
            </div>
          )}
        </div>

        {/* City Description */}
        {city.description && (
          <div className="prose prose-lg max-w-none mb-6">
            <p className="text-neo-text-secondary leading-relaxed">{city.description}</p>
          </div>
        )}

        {/* Additional City Details (only when detail fields exist) */}
        {'shortDescription' in city && city.shortDescription && (
          <div className="bg-neo-bg-secondary rounded-xl p-6 mb-6">
            <h3 className="heading-sm mb-4">Quick Facts</h3>
            <p className="text-neo-text-secondary mb-4">{city.shortDescription}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {quickFactsConfig.map(({ field, icon: Icon, formatter }) => {
                const raw = (city as CityDetailDTO)[field as keyof CityDetailDTO];
                const display = formatter(raw);
                if (!display) return null;
                return (
                  <div key={field} className="flex items-center gap-2">
                    <Icon size={16} className="text-neo-primary" />
                    <span className="text-sm">{display}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Sustainability Initiatives */}
        {isCityDetailDTO(city) && city.sustainabilityInitiatives && city.sustainabilityInitiatives.length > 0 && (
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

        {/* Digital Nomad Features */}
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
