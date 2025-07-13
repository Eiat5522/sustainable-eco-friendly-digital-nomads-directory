"use client";

import React from 'react';

import Image from 'next/image'
import { useState } from 'react'
import { urlFor } from '@/lib/sanity/image';
import dynamic from 'next/dynamic';
import type { MapContainerProps } from '../map/MapContainer';

interface Review {
  rating: number
  comment: string
  _createdAt: string
  author: string
}

interface Location {
  lat: number
  lng: number
}

interface City {
  title: string; // Changed from name to title to match Sanity data
  country?: string; 
}

interface ListingProps {
  listing: {
    name: string
    description_short?: string
    description_long?: string
    category?: string
    eco_features?: string[]
    amenities?: string[]
    primaryImage?: any // Or a more specific SanityImage type if available
    galleryImages?: any[]
    city?: City // Make city optional
    location?: Location
    website?: string
    contact_email?: string
    contact_phone?: string
    price_range?: string
    reviews?: any // Temporarily set to any to resolve mismatch. Investigate SanityListing type.
  }
}

// Import MapContainer for SSR-safe map rendering
const MapContainer = dynamic<MapContainerProps>(
  () => import('../map/MapContainer.js').then((mod) => mod.default),
  { ssr: false }
);

export function ListingDetail({ listing }: ListingProps) {
  console.info('ListingDetail rendered', listing)
  // FORTEST: Log the full listing and location for debugging
  console.info('ListingDetail listing:', listing);
  console.info('ListingDetail location:', listing.location);
  // FORTEST: Log the full listing object for debugging
  console.info('ListingDetail FULL listing object:', JSON.stringify(listing, null, 2));
  const reviews = listing.reviews || []
  const [mainImage, setMainImage] = useState(listing.primaryImage)
  const [hoverImage, setHoverImage] = useState<string | null>(null)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const galleryImageUrls = (listing.galleryImages || []).map(
    (img) => urlFor(img)?.url() || '/placeholder-city.jpg'
  );
  const averageRating = Array.isArray(reviews) && reviews.length > 0
    ? reviews.reduce((acc: number, rev: Review) => acc + rev.rating, 0) / reviews.length
    : 0
  const hasCoords =
    typeof listing.location?.lat === 'number' &&
    typeof listing.location?.lng === 'number';

  // Prepare the listing data for the map, ensuring type compatibility.
  // This is only created if coordinates exist.
  const mapListing = hasCoords
    ? {
        // The 'id' property is expected by the map. Let's use the Sanity '_id' if available,
        // falling back to other potential id fields or a default.
        id: (listing as any)._id ?? (listing as any).id ?? 'single-listing-map-id',
        name: listing.name,
        description_short: listing.description_short ?? '',
        description_long: listing.description_long ?? '',
        // Ensure category is one of the expected values for the map markers.
        category: (['coworking', 'cafe', 'accommodation'].includes(listing.category ?? '')
          ? listing.category
          : 'coworking') as 'coworking' | 'cafe' | 'accommodation',
        // FIX: The MapContainer's Listing type expects 'eco_focus_tags' and other properties.
        // We map `eco_features` to `eco_focus_tags` and provide defaults for other required fields.
        eco_focus_tags: listing.eco_features ?? [],
        address_string: '', // Default value to satisfy the type
        eco_notes_detailed: '', // Default value to satisfy the type
        amenities: listing.amenities ?? [],
        primaryImage: listing.primaryImage ?? null,
        galleryImages: listing.galleryImages ?? [],
        city: listing.city?.title ?? '',
        location: listing.location,
        website: listing.website ?? '',
        contact_email: listing.contact_email ?? '',
        contact_phone: listing.contact_phone ?? '',
        price_range: listing.price_range ?? '',
        reviews: listing.reviews ?? [],
        // These seem to be required by the MapContainer's Listing type, so we provide defaults.
        source_urls: [],
        primary_image_url: '',
        gallery_image_urls: [],
        digital_nomad_features: [],
        last_verified_date: '',
        coordinates: { latitude: listing.location?.lat ?? 0, longitude: listing.location?.lng ?? 0 },
      }
    : null;

  if (hasCoords) {
    // FORTEST: Debug log for map rendering
    console.info('Rendering MapContainer with coordinates:', listing.location?.lat, listing.location?.lng);
  } else {
    // FORTEST: Debug log for missing coordinates
    console.warn('ListingDetail: No valid coordinates for map', listing.location);
  }

  return (
    <article className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      {/* Modern Image Gallery */}
      {listing.galleryImages && listing.galleryImages.length > 0 && (
        <div className="relative">
          {/* Desktop Layout */}
          <div className="hidden md:grid md:grid-cols-4 md:gap-2 md:h-96">
            {/* Main Image - Takes up 2 columns */}
            <div className="col-span-2 relative group cursor-pointer" onClick={() => setLightboxOpen(true)}>
              <Image
                src={
                  [hoverImage, mainImage, urlFor(listing.galleryImages[0])?.url(), '/placeholder-city.jpg']
                    .find((src) => typeof src === 'string' && src.trim() !== '') as string
                }
                alt={listing.name}
                fill
                className="object-cover rounded-l-lg group-hover:brightness-110 transition-all duration-300"
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-opacity duration-300 rounded-l-lg" />
            </div>
            
            {/* Side Images Grid */}
            <div className="col-span-2 grid grid-cols-2 gap-2">
              {listing.galleryImages.slice(1, 5).map((img, idx) => {
                const imgUrl = urlFor(img)?.url() || '/placeholder-city.jpg';
                const isLast = idx === 3 || idx === (listing.galleryImages?.length || 0) - 2;
                const remainingCount = Math.max(0, (listing.galleryImages?.length || 0) - 5);
                
                return (
                  <div
                    key={img._key || img.asset?._ref || idx}
                    className={`relative group cursor-pointer overflow-hidden ${
                      idx === 1 ? 'rounded-tr-lg' : idx === 3 ? 'rounded-br-lg' : ''
                    }`}
                    onClick={() => {
                      if (isLast && remainingCount > 0) {
                        setLightboxOpen(true);
                      } else {
                        setMainImage(imgUrl);
                      }
                    }}
                    onMouseEnter={() => setHoverImage(imgUrl)}
                    onMouseLeave={() => setHoverImage(null)}
                  >
                    <Image
                      src={imgUrl}
                      alt={`Gallery image ${idx + 2}`}
                      fill
                      className="object-cover group-hover:brightness-110 transition-all duration-300"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                    
                    {/* "See All Photos" overlay on last image */}
                    {isLast && remainingCount > 0 && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center group-hover:bg-opacity-60 transition-opacity duration-300">
                        <div className="text-white text-center">
                          <div className="text-lg font-semibold">+{remainingCount}</div>
                          <div className="text-sm">See all photos</div>
                        </div>
                      </div>
                    )}
                    
                    {/* Hover overlay for other images */}
                    {(!isLast || remainingCount <= 0) && (
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-opacity duration-300" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mobile Layout */}
          <div className="md:hidden">
            {/* Main Image */}
            <div className="relative h-64 w-full cursor-pointer" onClick={() => setLightboxOpen(true)}>
              <Image
                src={
                  [hoverImage, mainImage, urlFor(listing.galleryImages[0])?.url(), '/placeholder-city.jpg']
                    .find((src) => typeof src === 'string' && src.trim() !== '') as string
                }
                alt={listing.name}
                fill
                className="object-cover"
                priority
                sizes="100vw"
              />
              {/* See All Photos button for mobile */}
              <div className="absolute bottom-4 right-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxOpen(true);
                  }}
                  className="bg-white text-gray-900 px-4 py-2 rounded-lg shadow-lg hover:bg-gray-100 transition-colors duration-200 flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm font-medium">See all {listing.galleryImages.length} photos</span>
                </button>
              </div>
            </div>
            
            {/* Mobile Thumbnail Strip */}
            <div className="flex space-x-2 p-4 overflow-x-auto scrollbar-thin scrollbar-thumb-green-500 scrollbar-track-green-100">
              {listing.galleryImages.slice(0, 8).map((img, idx) => {
                const imgUrl = urlFor(img)?.url() || '/placeholder-city.jpg';
                return (
                  <div
                    key={img._key || img.asset?._ref || idx}
                    className={`relative w-16 h-16 flex-shrink-0 cursor-pointer transition-all duration-300 rounded-lg overflow-hidden ${
                      imgUrl === mainImage ? 'ring-2 ring-green-500 ring-offset-1' : 'hover:ring-2 hover:ring-green-400 hover:ring-offset-1'
                    }`}
                    onClick={() => setMainImage(imgUrl)}
                  >
                    <Image 
                      src={imgUrl} 
                      alt={`Gallery image ${idx + 1}`} 
                      fill 
                      className="object-cover"
                      sizes="64px"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
      {/* Content */}
      <div className="p-6 md:p-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {listing.name}
          </h1>
          {averageRating > 0 && (
            <div className="flex items-center bg-green-100 dark:bg-green-900 px-3 py-1 rounded-full">
              <span className="text-green-700 dark:text-green-300 font-medium">
                {averageRating.toFixed(1)} ★
              </span>
            </div>
          )}
        </div>

        <div className="mb-6">
          {listing.category && listing.city && (
            <h2 className="text-gray-500 dark:text-gray-400">
              {listing.category} in {listing.city.title}{listing.city.country ? `, ${listing.city.country}` : ''}
            </h2>
          )}
          {listing.price_range && (
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Price Range: {listing.price_range}
            </p>
          )}
        </div>

        {/* Description */}
        <div className="prose dark:prose-invert max-w-none mb-8">
          {listing.description_short && <p className="text-lg mb-4">{listing.description_short}</p>}
          {listing.description_long && <div dangerouslySetInnerHTML={{ __html: listing.description_long }} />}
        </div>

        {/* Features & Amenities */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-xl font-semibold mb-4">Eco Features</h3>
            <ul className="space-y-2">
              {(listing.eco_features || []).map((feature) => (
                <li key={feature} className="flex items-center text-green-700 dark:text-green-400">
                  <span className="mr-2">🌱</span> {feature}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-4">Amenities</h3>
            <ul className="space-y-2">
              {(listing.amenities || []).map((amenity) => (
                <li key={amenity} className="flex items-center text-gray-700 dark:text-gray-300">
                  <span className="mr-2">✓</span> {amenity}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 mb-8">
          <h3 className="text-xl font-semibold mb-4">Contact Information</h3>
          <div className="space-y-2">
            {listing.website && (
              <p>
                <strong>Website:</strong>{' '}
                <a
                  href={listing.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-600 dark:text-green-400 hover:underline"
                >
                  {listing.website}
                </a>
              </p>
            )}
            {listing.contact_email && (
              <p>
                <strong>Email:</strong>{' '}
                <a
                  href={`mailto:${listing.contact_email}`}
                  className="text-green-600 dark:text-green-400 hover:underline"
                >
                  {listing.contact_email}
                </a>
              </p>
            )}
            {listing.contact_phone && (
              <p>
                <strong>Phone:</strong>{' '}
                <a
                  href={`tel:${listing.contact_phone}`}
                  className="text-green-600 dark:text-green-400 hover:underline"
                >
                  {listing.contact_phone}
                </a>
              </p>
            )}
          </div>
        </div>

        {/* Reviews */}
        {(listing.reviews || []).length > 0 && (
          <div>
            <h3 className="text-xl font-semibold mb-4">Reviews</h3>
            <div className="space-y-4">
              {Array.isArray(listing.reviews) && listing.reviews.map((review: Review, index: number) => (
                <div
                  key={index}
                  className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{review.author}</span>
                    <span className="text-yellow-500">{'★'.repeat(review.rating)}</span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300">{review.comment}</p>
                  <p className="text-sm text-gray-400 mt-2">
                    {new Date(review._createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {/* Enhanced Photo Gallery Lightbox */}
      {lightboxOpen && listing.galleryImages && listing.galleryImages.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-95 z-50">
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/50 to-transparent p-4">
            <div className="flex items-center justify-between text-white">
              <div>
                <h2 className="text-xl font-semibold">{listing.name}</h2>
                <p className="text-sm opacity-75">
                  {currentImageIndex + 1} / {listing.galleryImages.length}
                </p>
              </div>
              <button
                onClick={() => setLightboxOpen(false)}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
                aria-label="Close gallery"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Main Image Display */}
          <div className="flex items-center justify-center h-full px-4 pt-20 pb-32">
            <div className="relative max-w-6xl max-h-full w-full h-full">
              <Image
                src={galleryImageUrls[currentImageIndex] || '/placeholder-city.jpg'}
                alt={`${listing.name} - Image ${currentImageIndex + 1}`}
                fill
                className="object-contain"
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
              />
            </div>
          </div>

          {/* Navigation Arrows */}
          {listing.galleryImages.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const newIndex = currentImageIndex === 0 ? listing.galleryImages!.length - 1 : currentImageIndex - 1;
                  setCurrentImageIndex(newIndex);
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-colors"
                aria-label="Previous image"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const newIndex = currentImageIndex === listing.galleryImages!.length - 1 ? 0 : currentImageIndex + 1;
                  setCurrentImageIndex(newIndex);
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-colors"
                aria-label="Next image"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          {/* Thumbnail Strip */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-4">
            <div className="flex space-x-2 overflow-x-auto scrollbar-thin scrollbar-thumb-white/30 scrollbar-track-transparent justify-center">
              {galleryImageUrls.map((imgUrl: string, idx: number) => {
                return (
                  <div
                    key={listing.galleryImages?.[idx]?._key || listing.galleryImages?.[idx]?.asset?._ref || idx}
                    className={`relative w-16 h-16 flex-shrink-0 cursor-pointer transition-all duration-300 rounded-lg overflow-hidden ${
                      idx === currentImageIndex ? 'ring-2 ring-white ring-offset-2 ring-offset-black' : 'opacity-70 hover:opacity-100'
                    }`}
                    onClick={() => setCurrentImageIndex(idx)}
                  >
                    <Image 
                      src={imgUrl} 
                      alt={`Thumbnail ${idx + 1}`} 
                      fill 
                      className="object-cover"
                      sizes="64px"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Click outside to close */}
          <div 
            className="absolute inset-0 -z-10"
            onClick={() => setLightboxOpen(false)}
          />
        </div>
      )}
      {/* Map section: Only render if coordinates are present */}
      {hasCoords && mapListing ? (
        <div className="w-full h-96 my-6">
          <MapContainer
            listings={[mapListing]}
            className="h-full w-full rounded-lg shadow"
          />
        </div>
      ) : (
        <div className="text-red-500 text-center my-6">No valid coordinates for this listing.</div>
      )}
    </article>
  )
}
