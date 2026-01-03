'use client';

import type React from 'react';
import { InteractiveMap } from '@/components/ui/InteractiveMap';

type ListingMapClientProps = {
  location?: { lat: number; lng: number } | null;
  address?: string | null;
  name: string;
};

export function ListingMapClient({
  location,
  address,
  name,
}: ListingMapClientProps): React.JSX.Element {
  return (
    <InteractiveMap location={location ?? undefined} address={address ?? undefined} name={name} />
  );
}
