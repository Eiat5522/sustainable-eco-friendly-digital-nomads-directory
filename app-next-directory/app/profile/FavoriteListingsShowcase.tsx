'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, ChevronDown, Heart, Leaf, MapPin, Sparkles, Trash2 } from 'lucide-react';

import { NeoBadge } from '@/components/ui/neo-badge';
import { NeoButton } from '@/components/ui/neo-button';

import type { FavoriteListing } from './utils';
import { formatDate } from './utils';

interface FavoriteListingsShowcaseProps {
  listings: FavoriteListing[];
  onRemove: (id: string) => void;
}

const ACCENT_GRADIENTS = [
  'from-[#FEE2E2] via-neo-surface/70 to-[#FEF3C7]',
  'from-[#DCFCE7] via-neo-surface/70 to-[#BFDBFE]',
  'from-[#FBCFE8] via-neo-surface/70 to-[#DDD6FE]',
  'from-[#FEF9C3] via-neo-surface/70 to-[#FDE68A]',
  'from-[#CFFAFE] via-neo-surface/70 to-[#A5B4FC]',
];

const CATEGORY_LABELS: Record<string, string> = {
  coworking: 'Coworking Space',
  cafe: 'Cafe',
  accommodation: 'Accommodation',
  restaurant: 'Restaurant',
  activities: 'Activities',
};

const PRICE_RANGE_LABELS: Record<string, string> = {
  budget: 'Budget Friendly',
  moderate: 'Moderate',
  premium: 'Premium',
};

function toLabel(value: string | undefined, dictionary: Record<string, string>): string | undefined {
  if (!value) return undefined;
  if (dictionary[value]) return dictionary[value];
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

export function FavoriteListingsShowcase({ listings, onRemove }: FavoriteListingsShowcaseProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (listings.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {listings.map((listing, index) => {
        const isExpanded = expandedId === listing.id;
        const panelId = `favorite-panel-${listing.id}`;
        const accentGradient = ACCENT_GRADIENTS[index % ACCENT_GRADIENTS.length];
        const categoryLabel = toLabel(listing.category ?? listing.type, CATEGORY_LABELS);
        const priceLabel = toLabel(listing.priceRange, PRICE_RANGE_LABELS);
        const ecoTags = Array.isArray(listing.ecoFocusTags) ? listing.ecoFocusTags : [];
        const digitalTags = Array.isArray(listing.digitalNomadFeatures) ? listing.digitalNomadFeatures : [];
        const highlightTags = [
          ...ecoTags.slice(0, 2),
          ...digitalTags.slice(0, 2),
        ];
        const description =
          listing.shortDescription ??
          'This listing hasn\'t added a short description yet. Visit the listing page to explore more details about the experience.';

        return (
          <article
            key={listing.id}
            className="neo-card relative overflow-hidden rounded-3xl bg-neo-surface/95 p-6 transition-transform duration-150 hover:-translate-y-1 focus-within:-translate-y-1"
          >
            <div
              className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${accentGradient} opacity-70`}
              aria-hidden="true"
            />
            <div className="relative z-10 flex flex-col gap-6 lg:flex-row">
              <div className="relative w-full max-w-[18rem] self-start overflow-hidden rounded-2xl border-4 border-neo-border bg-neo-secondary/40 shadow-[6px_6px_0px_0px_var(--color-neo-shadow)] lg:w-64">
                {listing.image ? (
                  <Image
                    src={listing.image.url}
                    alt={listing.image.alt ?? `${listing.name} preview`}
                    width={listing.image.width}
                    height={listing.image.height}
                    className="h-48 w-full object-cover"
                    sizes="(max-width: 1024px) 60vw, 256px"
                  />
                ) : (
                  <div className="flex h-48 w-full items-center justify-center bg-neo-secondary/50 text-neo-text-primary">
                    <Heart className="h-12 w-12" aria-hidden="true" />
                    <span className="sr-only">No preview image available</span>
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="heading-sm text-neo-text-primary">{listing.name}</h3>
                      {categoryLabel && (
                        <NeoBadge size="sm" variant="secondary">
                          {categoryLabel}
                        </NeoBadge>
                      )}
                      {priceLabel && (
                        <NeoBadge size="sm" variant="accent">
                          {priceLabel}
                        </NeoBadge>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-neo-text-secondary">
                      {listing.city && (
                        <span className="inline-flex items-center gap-2 font-semibold text-neo-text-primary">
                          <MapPin className="h-4 w-4" aria-hidden="true" />
                          {listing.city}
                          {listing.country ? `, ${listing.country}` : ''}
                        </span>
                      )}
                      {listing.createdAt && (
                        <span className="rounded-full border-4 border-neo-border bg-neo-secondary/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-neo-text-primary shadow-[3px_3px_0px_0px_var(--color-neo-shadow)]">
                          Saved {formatDate(listing.createdAt)}
                        </span>
                      )}
                    </div>

                    {listing.shortDescription && (
                      <p className="max-w-prose text-sm text-neo-text-secondary sm:text-base">
                        {listing.shortDescription}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-start">
                    <NeoButton
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setExpandedId((current) => (current === listing.id ? null : listing.id))}
                      aria-expanded={isExpanded}
                      aria-controls={panelId}
                      className="gap-2"
                    >
                      <span>{isExpanded ? 'Hide details' : 'View details'}</span>
                      <ChevronDown
                        className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                        aria-hidden="true"
                      />
                    </NeoButton>
                    <NeoButton
                      type="button"
                      variant="danger"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => onRemove(listing.id)}
                      aria-label={`Remove ${listing.name} from favorites`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </NeoButton>
                  </div>
                </div>

                {highlightTags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {highlightTags.map((tag, tagIndex) => (
                      <NeoBadge
                        key={`${listing.id}-highlight-${tag}-${tagIndex}`}
                        variant="outline"
                        size="sm"
                        className="bg-white/75"
                      >
                        {tag}
                      </NeoBadge>
                    ))}
                  </div>
                )}

                <div
                  id={panelId}
                  aria-hidden={!isExpanded}
                  className={`grid gap-4 overflow-hidden transition-all duration-300 ${
                    isExpanded ? 'max-h-[600px] opacity-100' : 'pointer-events-none max-h-0 opacity-0'
                  } ${isExpanded ? 'mt-1' : ''}`}
                >
                  <div className="rounded-2xl border-4 border-neo-border bg-neo-surface/85 p-4 shadow-[4px_4px_0px_0px_var(--color-neo-shadow)]">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-neo-text-primary">Why we love it</h4>
                    <p className="mt-3 text-sm text-neo-text-secondary">{description}</p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border-4 border-neo-border bg-neo-surface/85 p-4 shadow-[4px_4px_0px_0px_var(--color-neo-shadow)]">
                      <h5 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-neo-text-primary">
                        <Leaf className="h-4 w-4" aria-hidden="true" /> Eco focus
                      </h5>
                      {listing.ecoFocusTags.length > 0 ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {listing.ecoFocusTags.map((tag) => (
                            <NeoBadge key={`eco-${listing.id}-${tag}`} variant="success" size="sm">
                              {tag}
                            </NeoBadge>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-3 text-sm text-neo-text-secondary">No eco focus tags yet.</p>
                      )}
                    </div>

                    <div className="rounded-2xl border-4 border-neo-border bg-neo-surface/85 p-4 shadow-[4px_4px_0px_0px_var(--color-neo-shadow)]">
                      <h5 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-neo-text-primary">
                        <Sparkles className="h-4 w-4" aria-hidden="true" /> Nomad-friendly perks
                      </h5>
                      {listing.digitalNomadFeatures.length > 0 ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {listing.digitalNomadFeatures.map((feature) => (
                            <NeoBadge key={`nomad-${listing.id}-${feature}`} variant="secondary" size="sm">
                              {feature}
                            </NeoBadge>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-3 text-sm text-neo-text-secondary">No digital nomad features listed yet.</p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border-4 border-neo-border bg-neo-surface/90 p-4 shadow-[4px_4px_0px_0px_var(--color-neo-shadow)]">
                    <p className="text-sm text-neo-text-secondary">
                      See photos, amenities, and availability on the listing page.
                    </p>
                    <NeoButton asChild size="sm" className="gap-2">
                      <Link href={`/listings/${listing.slug}`}>
                        View listing
                        <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                      </Link>
                    </NeoButton>
                  </div>
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
