"use client";

import dynamic from 'next/dynamic';
import { type Listing } from '@/types/listings';
import StaticMapImage from './StaticMapImage';

const Map = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => <StaticMapImage listings={[]} width={1200} height={600} />
});

interface MapContainerProps {
  listings: Listing[];
}

export default function MapContainer({ listings }: MapContainerProps) {
  return (
    <div className="relative">
      {/* SEO-friendly static map (pre-rendered) */}
      <div className="hidden">
        <StaticMapImage listings={listings} width={1200} height={600} />
      </div>
      
      {/* Interactive map (client-side only) */}
      <Map listings={listings} />
    </div>
  );
}
