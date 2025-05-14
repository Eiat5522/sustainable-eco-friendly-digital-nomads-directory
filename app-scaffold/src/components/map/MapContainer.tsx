"use client";

import dynamic from 'next/dynamic';
import { type Listing } from '@/types/listings';
import StaticMapImage from './StaticMapImage';
import type { LatLngBounds } from 'leaflet';
import { cn } from '@/lib/utils';

const Map = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => <StaticMapImage listings={[]} width={1200} height={600} />
});

interface MapContainerProps {
  listings: Listing[];
  onBoundsChange?: (bounds: LatLngBounds) => void;
  className?: string;
}

export default function MapContainer({ 
  listings, 
  onBoundsChange,
  className 
}: MapContainerProps) {
  return (
    <div className={cn("relative", className)}>
      {/* SEO-friendly static map (pre-rendered) */}
      <div className="hidden">
        <StaticMapImage listings={listings} width={1200} height={600} />
      </div>
      
      {/* Interactive map (client-side only) */}
      <Map 
        listings={listings} 
        onBoundsChange={onBoundsChange}
      />
    </div>
  );
}
