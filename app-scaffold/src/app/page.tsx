"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { CityHero } from '@/components/listings/CityHero';
import { CitySection } from '@/components/listings/CitySection';

// Dynamically import CityCarousel to avoid hydration issues
const DynamicCityCarousel = dynamic(() => import('@/components/listings/CityCarousel'), {
  ssr: false,
  loading: () => (
    <div className="aspect-[2/1] lg:aspect-[3/1] bg-gray-200 animate-pulse rounded-lg" />
  ),
});

const cities = [
  {
    id: '1',
    name: 'Chiang Mai',
    imageUrl: '/images/listings/chiang-mai-hero.jpg',
    description: 'A digital nomad haven with ancient temples and modern coworking spaces, all embracing sustainable practices.',
    slug: 'chiang-mai',
    listingsCount: 45
  },
  {
    id: '2',
    name: 'Bangkok',
    imageUrl: '/images/listings/bangkok-hero.jpg',
    description: 'Where modern eco-innovation meets traditional Thai culture in this bustling metropolis.',
    slug: 'bangkok',
    listingsCount: 38
  },
  {
    id: '3',
    name: 'Phuket',
    imageUrl: '/images/listings/phuket-hero.jpg',
    description: 'Paradise island with a growing sustainable tourism movement and remote work infrastructure.',
    slug: 'phuket',
    listingsCount: 32
  },
  {
    id: '4',
    name: 'Koh Lanta',
    imageUrl: '/images/listings/koh-lanta-hero.jpg',
    description: 'An island sanctuary for digital nomads focused on eco-tourism and sustainable living.',
    slug: 'koh-lanta',
    listingsCount: 25
  },
  {
    id: '5',
    name: 'Pai',
    imageUrl: '/images/listings/pai-hero.jpg',
    description: 'A mindful mountain community with organic cafes and eco-resorts.',
    slug: 'pai',
    listingsCount: 20
  }
];
import dynamic from 'next/dynamic';
import { CityHero } from '@/components/listings/CityHero';
import { CitySection } from '@/components/listings/CitySection';

// Dynamically import CityCarousel to avoid hydration issues
const DynamicCityCarousel = dynamic(() => import('@/components/listings/CityCarousel'), {
  ssr: false,
  loading: () => (
    <div className="aspect-[2/1] lg:aspect-[3/1] bg-gray-200 animate-pulse rounded-lg" />
  ),
});

const cities = [
  {
    id: '1',
    name: 'Chiang Mai',
    imageUrl: '/images/listings/chiang-mai-hero.jpg',
    description: 'A digital nomad haven with ancient temples and modern coworking spaces, all embracing sustainable practices.',
    slug: 'chiang-mai',
    listingsCount: 45
  },
  {
    id: '2',
    name: 'Bangkok',
    imageUrl: '/images/listings/bangkok-hero.jpg',
    description: 'Where modern eco-innovation meets traditional Thai culture in this bustling metropolis.',
    slug: 'bangkok',
    listingsCount: 38
  },
  {
    id: '3',
    name: 'Phuket',
    imageUrl: '/images/listings/phuket-hero.jpg',
    description: 'Paradise island with a growing sustainable tourism movement and remote work infrastructure.',
    slug: 'phuket',
    listingsCount: 32
  },
  {
    id: '4',
    name: 'Koh Lanta',
    imageUrl: '/images/listings/koh-lanta-hero.jpg',
    description: 'An island sanctuary for digital nomads focused on eco-tourism and sustainable living.',
    slug: 'koh-lanta',
    listingsCount: 25
  },
  {
    id: '5',
    name: 'Pai',
    imageUrl: '/images/listings/pai-hero.jpg',
    description: 'A mindful mountain community with organic cafes and eco-resorts.',
    slug: 'pai',
    listingsCount: 20
  }
];

async function getFeaturedListings(): Promise<Listing[]> {
  try {
    const filePath = path.join(process.cwd(), 'src/data/listings.json');
    const fileContents = await fs.readFile(filePath, 'utf8');
    const data = JSON.parse(fileContents);
    // Using the original data format directly
    return data.slice(0, 6); // Return first 6 listings as featured
  } catch (error) {
    console.error('Error loading listings:', error);
    return []; // Return empty array if there's an error
  }
}

export default async function HomePage() {
  const featuredListings = await getFeaturedListings();m 'next/link';
import Image from 'next/image';
import { promises as fs } from 'fs';
import path from 'path';
import { type Listing } from '@/types/listings';

async function getFeaturedListings(): Promise<Listing[]> {
  const filePath = path.join(process.cwd(), 'src/data/listings.json');
  const fileContent = await fs.readFile(filePath, 'utf8');
  const listings = JSON.parse(fileContent) as Listing[];
  return listings.slice(0, 3); // Return first 3 listings as featured
}

export default async function HomePage() {
  const featuredListings = await getFeaturedListings();

  return (
    <div>
      {/* City Carousel */}
      <section className="relative">
        <DynamicCityCarousel cities={cities} />
      </section>

      {/* Featured City Section */}
      <CitySection
        city={cities[0]} // Featuring Chiang Mai
        listingStats={{
          coworking: 15,
          cafe: 12,
          accommodation: 8,
          restaurant: 6,
          activity: 4
        }}
        className="bg-gray-50"
      />

      {/* Featured Listings */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Featured Sustainable Spaces</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredListings.map((listing) => (
              <Link
                key={listing.id}
                href={`/listings/${listing.id}`}
                className="group bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="relative h-48">
                  <Image
                    src={listing.primary_image_url}
                    alt={listing.name}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute top-4 right-4 z-10">
                    <span className={`
                      inline-block px-3 py-1 text-sm font-medium rounded-full 
                      ${listing.category === 'coworking' ? 'bg-green-100 text-green-800' :
                        listing.category === 'cafe' ? 'bg-blue-100 text-blue-800' :
                        'bg-pink-100 text-pink-800'}
                    `}>
                      {listing.category}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="font-bold text-xl mb-2 group-hover:text-primary-600">
                    {listing.name}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {listing.description_short}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {listing.eco_focus_tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="inline-block px-2 py-1 text-xs bg-primary-50 text-primary-700 rounded"
                      >
                        {tag.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link
              href="/listings"
              className="inline-block bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
            >
              View All Listings
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose Sustainable Spaces?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-100 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-8 h-8 text-primary-600">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-4">Verified Eco-Friendly</h3>
              <p className="text-gray-600">
                All listings are carefully vetted for their sustainable practices and environmental initiatives.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-4">Digital Nomad Ready</h3>
              <p className="text-gray-600">
                Fast internet, comfortable workspaces, and amenities suited for remote work.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-4">Community Focus</h3>
              <p className="text-gray-600">
                Connect with like-minded digital nomads who care about sustainability.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
