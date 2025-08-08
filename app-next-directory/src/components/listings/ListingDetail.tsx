"use client";
import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { urlFor } from '@/lib/sanity/image';
import { PortableText } from '@portabletext/react';
import { MapContainer } from '@/components/map';
import { AppListingDetail, AppCity, AppReview } from '@/types/appView';
import { SanityImage } from '@/types/appView';
import { Star } from 'lucide-react';
import { format } from 'date-fns';
import { Lightbox } from '@/components/common/Lightbox';
import { Badge } from '@/components/ui/badge';

interface ListingDetailProps {
  listing: AppListingDetail;
}

export default function ListingDetail({ listing }: ListingDetailProps) {
  const isTestEnv = process.env.NODE_ENV === 'test';
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Fallback image path for when images fail to load or are unavailable
  const FALLBACK_IMAGE_PATH = '/images/test-image.jpg';

  // Build gallery images with explicit alt text for testing
  const images = (listing.galleryImages || []).map((img: SanityImage, idx: number) => {
    try {
      if (img?.asset?._ref) {
        return {
          src: urlFor(img).width(800).height(600).auto('format').url(),
          alt: `Gallery image ${idx + 1}`,
        };
      }
    } catch {}
    return { src: FALLBACK_IMAGE_PATH, alt: `Gallery image ${idx + 1}` };
  }).filter(Boolean);

  if (listing.primaryImage && listing.primaryImage.asset?._ref) {
    images.unshift({
      src: urlFor(listing.primaryImage).width(800).height(600).auto('format').url(),
      alt: listing.primaryImage.alt || listing.name,
    });
  } else {
    images.unshift({ src: FALLBACK_IMAGE_PATH, alt: listing.name });
  }

  const handleImageClick = (index: number) => {
    setCurrentImageIndex(index);
    setIsLightboxOpen(true);
  };

  // Combined location string for testability
  const locationString = [
    listing.city?.name,
    listing.city?.country
  ].filter(Boolean).join(', ');

  // Category string for testability
  const categoryString = `${listing.type} in ${locationString}`;

  // Calculate average rating
  const averageRating = listing.reviews && listing.reviews.length > 0
    ? (listing.reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / listing.reviews.length).toFixed(1)
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8" role="article">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-8">
                {/* Title and Location */}
                <div>
                  <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-4 text-gray-900">
                    {listing.name}
                  </h1>
                  {listing.city && (
                    <Link
                      href={`/cities/${listing.city.slug}`}
                      className="text-lg text-gray-600 hover:text-blue-600 transition-colors"
                    >
                      {locationString}
                    </Link>
                  )}
                  <div className="flex items-center mt-2 text-sm text-gray-500">
                    <span data-testid="combined-location">{categoryString}</span>
                  </div>
                </div>

          {/* Image Gallery */}
          {images.length > 0 && (
            <div className="space-y-4">
              {/* Main Image */}
              <div className="relative h-96 w-full rounded-lg overflow-hidden cursor-pointer" onClick={() => handleImageClick(0)}>
                <Image
                  src={images[0].src}
                  alt={images[0].alt}
                  fill
                  className="object-cover"
                  priority
                  {...(isTestEnv && {
                    'data-testid': 'listing-detail-image',
                    'data-src': images[0].src,
                    'data-alt': images[0].alt,
                  })}
                  onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE_PATH; }}
                  sizes="(max-width: 768px) 100vw, 100vw"
                />
                {images.length > 1 && (
                  <>
                    <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                      +{images.length - 1} more photos
                    </div>
                    <button
                      className="absolute top-4 right-4 bg-white/80 text-black px-3 py-1 rounded shadow text-xs font-semibold"
                      onClick={e => { e.stopPropagation(); setIsLightboxOpen(true); setCurrentImageIndex(0); }}
                      data-testid="see-all-photos"
                    >
                      {`See all ${images.length} photos`}
                    </button>
                  </>
                )}
              </div>
              
              {/* Thumbnail Grid */}
              {images.length > 1 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {images.slice(1, 5).map((img, index) => (
                    <div key={index} className="relative h-24 rounded-lg overflow-hidden cursor-pointer" onClick={() => handleImageClick(index + 1)}>
                      <Image
                        src={img.src}
                        alt={img.alt}
                        fill
                        className="object-cover hover:scale-105 transition-transform"
                        onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE_PATH; }}
                        loading="lazy"
                        sizes="(max-width: 768px) 50vw, 25vw"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

                {/* Short Description */}
                {listing.shortDescription && (
                  <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
                    <p className="text-lg text-gray-700" data-testid="short-description">{listing.shortDescription}</p>
                  </div>
                )}

                {/* Description */}
                {listing.longDescription && (
                  <div className="bg-white border rounded-lg p-6">
                    <h2 className="text-2xl font-semibold mb-4 text-gray-900 border-b pb-2">About this place</h2>
                    <div className="prose prose-lg max-w-none text-gray-700" data-testid="long-description">
                      <PortableText
                        value={listing.longDescription as any}
                        components={{
                          types: {
                            undefined: () => null,
                            null: () => null,
                            default: () => null,
                          },
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Eco Features */}
                {listing.ecoFocusTags && listing.ecoFocusTags.length > 0 && (
                  <div className="bg-green-50 border rounded-lg p-6">
                    <h2 className="text-2xl font-semibold mb-4 text-gray-900 border-b pb-2">Eco Features</h2>
                    <div className="flex flex-wrap gap-2">
                      {listing.ecoFocusTags.map((tag: string) => (
                        <Badge key={tag} variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-200">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Amenities */}
                {listing.amenities && listing.amenities.length > 0 && (
                  <div className="bg-white border rounded-lg p-6">
                    <h2 className="text-2xl font-semibold mb-4 text-gray-900 border-b pb-2">Amenities</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {listing.amenities.map((amenity: import('@/types/sanity').Amenity) => (
                        <div key={amenity._id} className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-3 hover:bg-gray-100 transition-colors">
                          {amenity.badge?.asset?.url && (
                            <img src={amenity.badge.asset.url} alt={amenity.name} className="w-8 h-8 rounded-full object-cover" />
                          )}
                          <div>
                            <div className="font-semibold text-gray-900">{amenity.name}</div>
                            {amenity.description && (
                              <div className="text-sm text-gray-500">{amenity.description}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Contact Information */}
                {(listing.contactEmail || listing.contactPhone || listing.website) && (
                  <div className="bg-white border rounded-lg p-6">
                    <h2 className="text-2xl font-semibold mb-4 text-gray-900 border-b pb-2">Contact Information</h2>
                    <div className="space-y-3">
                      {listing.contactEmail && (
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-600">Email:</span>
                          <a href={`mailto:${listing.contactEmail}`} className="text-blue-600 hover:text-blue-800 hover:underline font-medium">
                            {listing.contactEmail}
                          </a>
                        </div>
                      )}
                      {listing.contactPhone && (
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-600">Phone:</span>
                          <a href={`tel:${listing.contactPhone}`} className="text-blue-600 hover:text-blue-800 hover:underline font-medium">
                            {listing.contactPhone}
                          </a>
                        </div>
                      )}
                      {listing.website && (
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-600">Website:</span>
                          <a href={listing.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 hover:underline font-medium">
                            {listing.website}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Reviews */}
                {listing.reviews && listing.reviews.length > 0 && (
                  <div className="bg-white border rounded-lg p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-semibold text-gray-900">Reviews</h2>
                      {averageRating && (
                        <div className="flex items-center bg-yellow-100 px-3 py-1 rounded-full" data-testid="average-rating">
                          <span className="text-yellow-600 font-semibold">{averageRating} ★</span>
                          <span className="text-gray-600 ml-2 text-sm">({listing.reviews.length} reviews)</span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-6">
                      {listing.reviews.map((review: AppReview) => (
                        <div key={review.createdAt} className="border-b border-gray-200 pb-6 last:border-b-0">
                          <div className="flex items-center mb-3">
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star 
                                  key={i} 
                                  className={`h-4 w-4 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                                />
                              ))}
                            </div>
                            <span className="font-semibold ml-2" data-testid="reviewer-rating">{review.rating}</span>
                            <span className="text-sm text-gray-500 ml-4">
                              by <span className="font-medium" data-testid="reviewer-name">{review.user.name}</span> on{' '}
                              <span data-testid="review-date">{new Date(review.createdAt).toLocaleDateString()}</span>
                            </span>
                          </div>
                          <p className="text-gray-700 leading-relaxed" data-testid="review-comment">{review.comment}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="lg:col-span-1 space-y-6">
                {/* Price Range */}
                {listing.priceRange && (
                  <div className="bg-white border rounded-lg shadow-sm p-6">
                    <h3 className="text-xl font-semibold mb-4 text-gray-900 border-b pb-2">Price Range</h3>
                    <p className="text-gray-700 capitalize font-medium">{listing.priceRange}</p>
                  </div>
                )}

                {/* Location Map */}
                {listing.location && listing.location.lat && listing.location.lng ? (
                  <div className="bg-white border rounded-lg shadow-sm p-6">
                    <h3 className="text-xl font-semibold mb-4 text-gray-900 border-b pb-2">Location</h3>
                    <div className="h-64 w-full rounded-lg overflow-hidden border">
                      <MapContainer listings={[listing]} />
                    </div>
                    {listing.address && (
                      <p className="text-gray-700 mt-4 text-sm leading-relaxed">{listing.address}</p>
                    )}
                  </div>
                ) : (
                  <div className="bg-white border rounded-lg shadow-sm p-6">
                    <h3 className="text-xl font-semibold mb-4 text-gray-900 border-b pb-2">Location</h3>
                    <p className="text-gray-500">No valid coordinates for this listing.</p>
                    {listing.address && (
                      <p className="text-gray-700 mt-4">{listing.address}</p>
                    )}
                  </div>
                )}

                {/* Coworking Details */}
                {listing.coworkingDetails && (
                  <div className="bg-white border rounded-lg shadow-sm p-6">
                    <h3 className="text-xl font-semibold mb-4 text-gray-900 border-b pb-2">Coworking Details</h3>
                    {listing.coworkingDetails.pricingPlans && listing.coworkingDetails.pricingPlans.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-semibold mb-3 text-gray-800">Pricing Plans:</h4>
                        <ul className="space-y-2">
                          {listing.coworkingDetails.pricingPlans.map((plan, index) => (
                            <li key={index} className="text-gray-700 bg-gray-50 p-2 rounded">
                              <span className="font-medium">{plan.type}:</span> {plan.price} {plan.period}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {listing.coworkingDetails.openingHours && listing.coworkingDetails.openingHours.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-3 text-gray-800">Opening Hours:</h4>
                        <ul className="space-y-1">
                          {listing.coworkingDetails.openingHours.map((hour, index) => (
                            <li key={index} className="text-gray-700 text-sm">
                              <span className="font-medium">{hour.day}:</span> {hour.opens} - {hour.closes}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Accommodation Details */}
                {listing.accommodationDetails && (
                  <div className="bg-white border rounded-lg shadow-sm p-6">
                    <h3 className="text-xl font-semibold mb-4 text-gray-900 border-b pb-2">Accommodation Details</h3>
                    {listing.accommodationDetails.pricePerNightThb && (
                      <div className="mb-4">
                        <p className="text-gray-700 bg-blue-50 p-3 rounded">
                          <span className="font-medium">Price per night:</span> {listing.accommodationDetails.pricePerNightThb.min} - {listing.accommodationDetails.pricePerNightThb.max} THB
                        </p>
                      </div>
                    )}
                    {listing.accommodationDetails.openingHours && listing.accommodationDetails.openingHours.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-3 text-gray-800">Check-in/Check-out Hours:</h4>
                        <ul className="space-y-1">
                          {listing.accommodationDetails.openingHours.map((hour, index) => (
                            <li key={index} className="text-gray-700 text-sm">
                              <span className="font-medium">{hour.day}:</span> {hour.opens} - {hour.closes}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Cafe Details */}
                {listing.cafeDetails && (
                  <div className="bg-white border rounded-lg shadow-sm p-6">
                    <h3 className="text-xl font-semibold mb-4 text-gray-900 border-b pb-2">Cafe Details</h3>
                    {listing.cafeDetails.openingHours && listing.cafeDetails.openingHours.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-3 text-gray-800">Opening Hours:</h4>
                        <ul className="space-y-1">
                          {listing.cafeDetails.openingHours.map((hour, index) => (
                            <li key={index} className="text-gray-700 text-sm">
                              <span className="font-medium">{hour.day}:</span> {hour.opens} - {hour.closes}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Category-specific Details */}
                {listing.type === 'restaurant' && listing.restaurantDetails && (
                  <div className="bg-white border rounded-lg shadow-sm p-6">
                    <h2 className="text-xl font-semibold mb-4 text-gray-900 border-b pb-2">Restaurant Details</h2>
                    <ul className="space-y-3">
                      {listing.restaurantDetails.cuisineType && (
                        <li className="bg-gray-50 p-3 rounded">
                          <span className="font-medium">Cuisine:</span> {listing.restaurantDetails.cuisineType.join(', ')}
                        </li>
                      )}
                      {listing.restaurantDetails.dietaryOptions && (
                        <li className="bg-gray-50 p-3 rounded">
                          <span className="font-medium">Dietary Options:</span> {listing.restaurantDetails.dietaryOptions.join(', ')}
                        </li>
                      )}
                      {listing.restaurantDetails.averageMealPriceThb && (
                        <li className="bg-gray-50 p-3 rounded">
                          <span className="font-medium">Price Per Meal:</span> {listing.restaurantDetails.averageMealPriceThb.min} - {listing.restaurantDetails.averageMealPriceThb.max} THB
                        </li>
                      )}
                      {listing.restaurantDetails.operatingHours && (
                        <li className="bg-gray-50 p-3 rounded">
                          <span className="font-medium">Operating Hours:</span> {listing.restaurantDetails.operatingHours}
                        </li>
                      )}
                      {listing.restaurantDetails.priceRange && (
                        <li className="bg-gray-50 p-3 rounded">
                          <span className="font-medium">Price Range:</span> {listing.restaurantDetails.priceRange}
                        </li>
                      )}
                      {listing.restaurantDetails.sustainabilityInitiatives && (
                        <li className="bg-gray-50 p-3 rounded">
                          <span className="font-medium">Sustainability Initiatives:</span> {listing.restaurantDetails.sustainabilityInitiatives.join(', ')}
                        </li>
                      )}
                      {listing.restaurantDetails.seating && (
                        <li className="bg-gray-50 p-3 rounded">
                          <span className="font-medium">Seating:</span> {listing.restaurantDetails.seating.join(', ')}
                        </li>
                      )}
                      {listing.restaurantDetails.workFriendly && (
                        <li className="bg-gray-50 p-3 rounded">
                          <span className="font-medium">Work Friendly:</span> {listing.restaurantDetails.workFriendly.join(', ')}
                        </li>
                      )}
                    </ul>
                  </div>
                )}

                {listing.type === 'activities' && listing.activitiesDetails && (
                  <div className="bg-white border rounded-lg shadow-sm p-6">
                    <h2 className="text-xl font-semibold mb-4 text-gray-900 border-b pb-2">Activities Details</h2>
                    <ul className="space-y-3">
                      {listing.activitiesDetails.activityType && (
                        <li className="bg-gray-50 p-3 rounded">
                          <span className="font-medium">Activity Type:</span> {listing.activitiesDetails.activityType}
                        </li>
                      )}
                      {listing.activitiesDetails.duration && (
                        <li className="bg-gray-50 p-3 rounded">
                          <span className="font-medium">Duration:</span> {listing.activitiesDetails.duration.value} {listing.activitiesDetails.duration.unit}
                        </li>
                      )}
                      {listing.activitiesDetails.groupSize && (
                        <li className="bg-gray-50 p-3 rounded">
                          <span className="font-medium">Group Size:</span> {listing.activitiesDetails.groupSize.min} - {listing.activitiesDetails.groupSize.max}
                        </li>
                      )}
                      {listing.activitiesDetails.skillLevel && (
                        <li className="bg-gray-50 p-3 rounded">
                          <span className="font-medium">Skill Level:</span> {listing.activitiesDetails.skillLevel}
                        </li>
                      )}
                      {listing.activitiesDetails.sustainabilityPractices && (
                        <li className="bg-gray-50 p-3 rounded">
                          <span className="font-medium">Sustainability Practices:</span> {listing.activitiesDetails.sustainabilityPractices.join(', ')}
                        </li>
                      )}
                      {listing.activitiesDetails.seasonality && listing.activitiesDetails.seasonality.bestMonths && (
                        <li className="bg-gray-50 p-3 rounded">
                          <span className="font-medium">Best Months:</span> {listing.activitiesDetails.seasonality.bestMonths.join(', ')}
                        </li>
                      )}
                      {listing.activitiesDetails.ecoScore && listing.activitiesDetails.ecoScore.score && (
                        <li className="bg-gray-50 p-3 rounded">
                          <span className="font-medium">Eco Score:</span> {listing.activitiesDetails.ecoScore.score}
                        </li>
                      )}
                      {listing.activitiesDetails.languages && (
                        <li className="bg-gray-50 p-3 rounded">
                          <span className="font-medium">Languages:</span> {listing.activitiesDetails.languages.join(', ')}
                        </li>
                      )}
                      {listing.activitiesDetails.accessibility && listing.activitiesDetails.accessibility.wheelchairAccessible !== undefined && (
                        <li className="bg-gray-50 p-3 rounded">
                          <span className="font-medium">Wheelchair Accessible:</span> {listing.activitiesDetails.accessibility.wheelchairAccessible ? 'Yes' : 'No'}
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {isLightboxOpen && (
          <Lightbox
            images={images}
            currentIndex={currentImageIndex}
            onClose={() => setIsLightboxOpen(false)}
            onNext={() => setCurrentImageIndex((prev) => (prev + 1) % images.length)}
            onPrev={() => setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)}
          />
        )}
      </div>
    </div>
  );
}
