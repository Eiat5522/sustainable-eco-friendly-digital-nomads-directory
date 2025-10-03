"use client";
import { useState } from 'react';
import { Leaf, MapPin, Wifi, DollarSign, Thermometer, Shield, Footprints, Wind } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Image from 'next/image';
import { NeoBadge } from '@/components/ui/neo-badge';
import { RelatedListings } from '@/components/listings/RelatedListings';
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

  const listingsSection = (
    <div data-testid="city-listings-section" className="flex flex-col gap-6">
      <h2 className="heading-md">Places to Work &amp; Stay</h2>
      <RelatedListings listings={listings} />
    </div>
  );

  const aboutSection = (
    <div className="flex flex-col gap-6" data-testid="city-about-section">
      {city.description && (
        <div className="prose prose-lg max-w-none">
          <p className="text-neo-text-secondary leading-relaxed">{city.description}</p>
        </div>
      )}

      {'shortDescription' in city && city.shortDescription && (
        <div className="bg-neo-bg-secondary rounded-xl p-6">
          <h3 className="heading-sm mb-4">Quick Facts</h3>
          <p className="text-neo-text-secondary mb-4">{city.shortDescription}</p>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
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

      {isCityDetailDTO(city) && city.sustainabilityInitiatives && city.sustainabilityInitiatives.length > 0 && (
        <div className="bg-green-50 rounded-xl p-6">
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

      {'digitalNomadFeatures' in city && city.digitalNomadFeatures && city.digitalNomadFeatures.length > 0 && (
        <div className="bg-blue-50 rounded-xl p-6">
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

      {city.highlights && city.highlights.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {city.highlights.map((highlight, idx) => (
            <NeoBadge key={idx} variant="outline" size="sm">
              {highlight}
            </NeoBadge>
          ))}
        </div>
      )}
      {listings.length > 0 && <div className="mt-12">{listingsSection}</div>}
    </div>
  );

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="mb-12">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MapPin className="text-neo-primary" />
              <h1 className="heading-lg">{city.name}</h1>
              {city.sustainabilityScore !== undefined && (
                <NeoBadge variant="success" className="ml-2 flex items-center gap-1">
                  <Leaf size={16} />
                  <span>{city.sustainabilityScore}%</span>
                </NeoBadge>
              )}
            </div>
          </div>

          {city.imageUrl && (
            <div
              className={`relative mb-6 h-96 w-full overflow-hidden rounded-xl border-4 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] ${
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

        <div className="flex flex-col gap-8">
          {aboutSection}
        </div>
      </div>
    </section>
  );
}