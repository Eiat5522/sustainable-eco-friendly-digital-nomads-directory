'use client';

import dynamic from 'next/dynamic';
import type { CityDetailDTO, CityDTO, ListingSummaryDTO } from '@/types/dto';
import { useState, useEffect } from 'react';

const DynamicCityDetailView = dynamic(
  () => import('@/components/city/CityDetailView').then(mod => mod.CityDetailView),
  {
    ssr: false,
    loading: () => <div className="h-screen rounded-lg bg-muted animate-pulse" />,
  }
);

interface ClientCityDetailViewWrapperProps {
  city: CityDTO | CityDetailDTO;
  listings: ListingSummaryDTO[];
}

export default function ClientCityDetailViewWrapper({
  city,
  listings,
}: ClientCityDetailViewWrapperProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Explicitly return null to ensure nothing from DynamicCityDetailView is rendered on the server
    return null;
  }

  return <DynamicCityDetailView city={city} listings={listings} />;
}
