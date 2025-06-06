'use client';

import { useEffect, useState } from 'react';
import { getFeaturedListings } from '@/lib/queries';

interface ListingType {
  _id: string;
  title: string;
  description: string;
  type: 'accommodation' | 'coworking' | 'cafe';
  price: {
    amount: number;
    currency: string;
    period: string;
  };
  location: string;
  mainImage: {
    asset: {
      url: string;
    };
  };
  ecoFeatures: Array<{ name: string }>;
  rating: number;
  reviewCount: number;
  slug: {
    current: string;
  };
}

export default function FeaturedListings() {
  const [listings, setListings] = useState<ListingType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadListings = async () => {
      try {
        const data = await getFeaturedListings();
        console.log("Raw API Response for Featured Listings:", JSON.stringify(data, null, 2)); // Added for debugging
        // Basic data validation
        if (!Array.isArray(data)) {
          console.error("FeaturedListings Error: API response is not an array. Received:", data);
          setError("Failed to load listings. Expected an array.");
          setListings([]); // Set to empty array to prevent further errors
          return;
        }

        // Optional: More specific validation for each item if needed
        // For example, check if each item is an object and has a title
        const isValidData = data.every(item =>
          typeof item === 'object' &&
          item !== null &&
          typeof item.title === 'string' &&
          typeof item._id === 'string' // Assuming _id is crucial
          // Add other critical property checks here
        );

        if (!isValidData) {
          console.error("FeaturedListings Error: Some items in the API response have an unexpected format. Received:", data);
          setError("Failed to load listings. Data format is incorrect for some items.");
          setListings([]);
          return;
        }

        setListings(data);
      } catch (err) {
        console.error('Failed to fetch featured listings:', err);
        setError('Failed to load featured listings');
      } finally {
        setLoading(false);
      }
    };

    loadListings();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse bg-gray-200 h-96 rounded-lg"></div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 py-8">
        {error}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {listings.map((listing) => (
        <div
          key={listing._id}
          className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
        >
          {/* Image Container */}
          <div className="relative h-48">
            <img
              src={listing.mainImage?.asset?.url || '/placeholder-listing.jpg'}
              alt={listing.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          </div>

          {/* Content */}
          <div className="p-4">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-semibold text-gray-900">{listing.title}</h3>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {listing.type}
              </span>
            </div>

            <p className="text-gray-600 text-sm mb-2 line-clamp-2">{listing.description}</p>

            <div className="flex items-center text-sm text-gray-500 mb-2">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {listing.location}
            </div>

            {/* Eco Features */}
            <div className="flex flex-wrap gap-2 mb-3">
              {listing.ecoFeatures.map((feature, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700"
                >
                  {feature.name}
                </span>
              ))}
            </div>

            {/* Price and Rating */}
            <div className="flex justify-between items-center">
              <div className="text-gray-900">
                <span className="font-bold">{listing.price.currency} {listing.price.amount}</span>
                <span className="text-gray-500 text-sm">/{listing.price.period}</span>
              </div>
              <div className="flex items-center">
                <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="ml-1 text-sm text-gray-600">
                  {listing.rating} ({listing.reviewCount})
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
