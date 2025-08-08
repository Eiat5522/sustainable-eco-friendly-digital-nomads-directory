"use client";

import { fetchCityDetails, fetchCityListings } from '@/lib/api';
import type { City } from '@/sanity.types'
import type { Listing } from '@/types';
import React, { useEffect, useState } from 'react';
import ImageCarousel from '../common/ImageCarousel';
import LoadingSpinner from '../common/LoadingSpinner';
import { ListingGrid } from '../listings/ListingGrid';
import CityStats from './CityStats';

interface CityPageProps { slug: string }
const CityPage: React.FC<CityPageProps> = ({ slug }) => {
  const isTestEnv = process.env.NODE_ENV === 'test';
  const [city, setCity] = useState<City | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'about' | 'listings'>('about');

  useEffect(() => {
    const loadCityData = async () => {
      setLoading(true);
      try {
        const [cityData, cityListings] = await Promise.all([
          fetchCityDetails(slug),
          fetchCityListings(slug)
        ]);
        setCity(cityData);
        setListings(cityListings);
      } catch (error) {
        console.error('Error loading city data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      loadCityData();
    }
  }, [slug]);

  if (loading) {
    return <LoadingSpinner message="Loading city details..." />;
  }

  if (!city) {
    return <div className="container mx-auto p-6">City not found</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">{city.name}</h1>
      <p className="text-gray-600 mb-6">{city.country}</p>

      {/* Main Image Only (no gallery) */}
      {city.primaryImage && (
        <div className="mb-8">
          <img
            src={typeof city.primaryImage === 'string' ? city.primaryImage : ''}
            alt={city.name}
            className="rounded-lg shadow w-full h-64 object-cover"
          />
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <CityStats city={city} />
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('about')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'about'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            About
          </button>
          <button
            onClick={() => setActiveTab('listings')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'listings'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Eco-Friendly Listings
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mb-12">
        {activeTab === 'about' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">About {city.name}</h2>
            <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: city.description || '' }} />

            {/* Removed: Sustainability Initiatives and Digital Nomad Friendly Features (not in canonical type) */}
          </div>
        )}

        {activeTab === 'listings' && (
          <div>
            <h2 className="text-xl font-semibold mb-6">Eco-Friendly Accommodations in {city.name}</h2>
        {listings.length > 0 ? (
          <ListingGrid listings={listings as any} />
            ) : (
              <p className="text-gray-500">No listings available for this city yet.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CityPage;
