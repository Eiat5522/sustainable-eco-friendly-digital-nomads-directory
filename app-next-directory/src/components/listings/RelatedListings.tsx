'use client';

import Autoplay from 'embla-carousel-autoplay';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useRef } from 'react';
import { NeoButton } from '@/components/ui/neo-button';
import { NeoCard, NeoCardContent, NeoCardHeader, NeoCardTitle } from '@/components/ui/neo-card';
import { SectionHeader } from '@/components/ui/SectionHeader';
import type { CityDTO } from '@/types/dto';

interface RelatedListing {
  id: string;
  name: string;
  slug: string;
  imageUrl: string;
  city: string | CityDTO | null;
  priceRange: 'budget' | 'moderate' | 'premium';
  ecoFocusTags: string[];
}

interface RelatedListingsProps {
  listings: RelatedListing[];
}

export function RelatedListings({ listings }: RelatedListingsProps) {
  const autoplay = useRef(Autoplay({ delay: 4000, stopOnInteraction: true }));
  const [viewportRef, emblaApi] = useEmblaCarousel(
    {
      align: 'start',
      containScroll: 'trimSnaps',
      loop: true,
      skipSnaps: false,
    },
    [autoplay.current]
  );

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  if (!listings || listings.length === 0) {
    return null;
  }

  const getPriceRangeColor = (priceRange: string) => {
    switch (priceRange) {
      case 'budget':
        return 'text-neo-success bg-neo-success/20 border border-neo-success/40';
      case 'moderate':
        return 'text-neo-primary bg-neo-primary/15 border border-neo-primary/35';
      case 'premium':
        return 'text-neo-accent bg-neo-accent/20 border border-neo-accent/40';
      default:
        return 'text-neo-text-secondary bg-neo-secondary/25 border border-neo-border';
    }
  };

  return (
    <section className="mb-8">
      <SectionHeader
        title="Related Listings"
        description="Discover similar sustainable venues you might love"
        className="mb-8"
      />

      <div className="relative">
        <NeoButton
          variant="secondary"
          size="sm"
          className="hidden md:flex absolute -left-3 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white"
          aria-label="Scroll related listings left"
          onClick={scrollPrev}
          onMouseEnter={() => autoplay.current?.stop()}
          onMouseLeave={() => autoplay.current?.play()}
        >
          <ChevronLeft size={18} />
        </NeoButton>

        <div ref={viewportRef} className="overflow-hidden">
          <div className="flex gap-6">
            {listings.map(listing => (
              <div key={listing.id} className="shrink-0 basis-[85%] sm:basis-[60%] lg:basis-1/2">
                <Link
                  href={`/listings/${listing.slug}`}
                  className="block h-full"
                  data-testid="related-listing-card"
                  data-has-image={Boolean(listing.imageUrl)}
                >
                  <NeoCard
                    variant="elevated"
                    className="group flex h-full flex-col cursor-pointer transition-all duration-300 hover:shadow-[16px_16px_0px_0px]"
                  >
                    <div className="relative h-48 mb-4 overflow-hidden rounded-lg">
                      {listing.imageUrl ? (
                        <Image
                          src={listing.imageUrl}
                          alt={`${listing.name} in ${typeof listing.city === 'string' ? listing.city : (listing.city?.name ?? '')}`}
                          fill
                          sizes="(min-width: 1024px) 50vw, (min-width: 640px) 60vw, 85vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <Image
                          src="/placeholder_image.png"
                          alt=""
                          aria-hidden
                          role="presentation"
                          fill
                          sizes="(min-width: 1024px) 50vw, (min-width: 640px) 60vw, 85vw"
                          className="object-cover"
                          data-testid="related-listing-fallback"
                        />
                      )}
                      {listing.priceRange && (
                        <div className="absolute top-3 left-3">
                          <span
                            className={`px-2 py-1 rounded-lg text-xs font-medium ${getPriceRangeColor(listing.priceRange)}`}
                          >
                            {listing.priceRange.charAt(0).toUpperCase() +
                              listing.priceRange.slice(1)}
                          </span>
                        </div>
                      )}
                    </div>

                    <NeoCardHeader>
                      <NeoCardTitle className="group-hover:text-neo-primary transition-colors duration-200">
                        {listing.name}
                      </NeoCardTitle>
                      {(() => {
                        const cityText =
                          typeof listing.city === 'string'
                            ? listing.city
                            : (listing.city?.name ?? '');
                        return cityText ? (
                          <p className="body-sm text-neo-text-secondary mt-1">{cityText}</p>
                        ) : null;
                      })()}
                    </NeoCardHeader>

                    <NeoCardContent className="mt-auto">
                      {listing.ecoFocusTags && listing.ecoFocusTags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {listing.ecoFocusTags.slice(0, 3).map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-neo-success/20 text-neo-success text-xs rounded-lg font-medium"
                            >
                              {tag}
                            </span>
                          ))}
                          {listing.ecoFocusTags.length > 3 && (
                            <span className="px-2 py-1 bg-neo-secondary/25 text-neo-text-secondary text-xs rounded-lg font-medium border border-neo-border">
                              +{listing.ecoFocusTags.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </NeoCardContent>
                  </NeoCard>
                </Link>
              </div>
            ))}
          </div>
        </div>

        <NeoButton
          variant="secondary"
          size="sm"
          className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white"
          aria-label="Scroll related listings right"
          onClick={scrollNext}
          onMouseEnter={() => autoplay.current?.stop()}
          onMouseLeave={() => autoplay.current?.play()}
        >
          <ChevronRight size={18} />
        </NeoButton>
      </div>
    </section>
  );
}
