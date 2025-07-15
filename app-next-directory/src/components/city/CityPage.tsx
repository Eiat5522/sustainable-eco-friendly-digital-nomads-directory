"use client";

import { fetchCityDetails, fetchCityListings } from '@/lib/api';
import { City, CityPageProps, Listing, UnifiedListing } from '@/types';
import React, { useEffect, useState } from 'react';
import ImageCarousel from '../common/ImageCarousel';
import LoadingSpinner from '../common/LoadingSpinner';
import { ListingGrid } from '../listings/ListingGrid';
import CityMap from './CityMap';
import CityStats from './CityStats';

const CityPage: React.FC<CityPageProps> = ({ slug }) => {
  const [city, setCity] = useState<City | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'about' | 'listings' | 'map'>('about');

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

  // Convert listings to unified format
  const unifiedListings: UnifiedListing[] = listings.map(listing => ({
    ...listing,
    // Add any missing properties with defaults
  }));

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">{city.name}</h1>
      <p className="text-gray-600 mb-6">{city.country}</p>

      {/* Image Carousel */}
      <div className="mb-8">
        <ImageCarousel
          images={city.images || []}
          alt={`Photos of ${city.name}`}
        />
      </div>

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
          <button
            onClick={() => setActiveTab('map')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'map'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Map
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mb-12">
        {activeTab === 'about' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">About {city.name}</h2>
            <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: city.description }} />

            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-2">Sustainability Initiatives</h3>
              <ul className="list-disc pl-5 space-y-2">
                {city.sustainabilityInitiatives?.map((initiative, index) => (
                  <li key={index}>{initiative}</li>
                ))}
              </ul>
            </div>

            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-2">Digital Nomad Friendly Features</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {city.nomadFeatures?.map((feature, index) => (
                  <div key={index} className="flex items-start">
                    <div className="flex-shrink-0 h-6 w-6 text-green-500">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="ml-3 text-gray-700">{feature}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'listings' && (
          <div>
            <h2 className="text-xl font-semibold mb-6">Eco-Friendly Accommodations in {city.name}</h2>
            {unifiedListings.length > 0 ? (
              <ListingGrid listings={unifiedListings} />
            ) : (
              <p className="text-gray-500">No listings available for this city yet.</p>
            )}
          </div>
        )}

        {activeTab === 'map' && (
          <div className="h-96">
            <CityMap city={city} listings={unifiedListings} />
          </div>
        )}
      </div>
    </div>
  );
};

export default CityPage;
