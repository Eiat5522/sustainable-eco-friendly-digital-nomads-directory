'use client';

import { useEffect, useState } from 'react';
import { CityDetailView } from '@/components/city/CityDetailView';
import { mockCity, mockCityListings } from '@/components/city/cityDetailMockData';
import type { CityDTO, ListingSummaryDTO } from '@/types/dto';

interface Props {
  params: { slug: string };
}

export default function CityPage({ params }: Props) {
  const { slug } = params;
  const [city, setCity] = useState<CityDTO | null>(null);
  const [listings, setListings] = useState<ListingSummaryDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await new Promise((res) => setTimeout(res, 500));
        if (slug !== mockCity.slug) {
          setError('City not found');
          return;
        }
        setCity(mockCity);
        setListings(mockCityListings);
      } catch {
        setError('Failed to fetch city');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="body-lg text-neo-text-secondary">Loading city details...</p>
      </div>
    );
  }

  if (error || !city) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="body-lg text-red-500">{error || 'City not found'}</p>
      </div>
    );
  }

  return <CityDetailView city={city} listings={listings} />;
}
