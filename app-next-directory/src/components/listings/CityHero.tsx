"use client";

import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export interface CityHeroProps {
  name: string;
  description: string;
  imageUrl: string;
  slug: string;
  listingsCount?: number;
  className?: string;
}

export function CityHero({
  name,
  description,
  imageUrl,
  slug,
  listingsCount,
  className,
}: CityHeroProps) {
  return (
    <div className={cn("relative w-full min-h-[400px] md:min-h-[500px]", className)}>
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src={imageUrl}
          alt={name}
          fill
          className="object-cover"
          priority
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative container mx-auto px-4 h-full flex flex-col justify-end py-12">
        <div className="text-white max-w-3xl">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
            {name}
          </h1>
          <p className="text-lg md:text-xl mb-6 max-w-2xl">
            {description}
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href={`/listings?city=${slug}`}
              className="inline-block bg-white text-primary-600 px-6 py-3 rounded-lg font-semibold hover:bg-primary-100 transition-colors"
            >
              View {listingsCount ? `${listingsCount} Listings` : "All Listings"}
            </Link>
            <Link
              href={`/map?city=${slug}`}
              className="inline-block bg-black/30 text-white px-6 py-3 rounded-lg font-semibold hover:bg-black/50 transition-colors"
            >
              Open Map View
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CityHero;
