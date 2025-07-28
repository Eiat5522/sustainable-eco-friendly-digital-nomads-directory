import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { urlFor } from '@/lib/sanity/image';
import { PortableText } from '@portabletext/react';
import { MapContainer } from '@/components/map';
import { AppListingDetail, AppCity, AppReview } from '@/types/appView';
import { Star } from 'lucide-react';
import { format } from 'date-fns';
import { Lightbox } from '@/components/common/Lightbox';
import { Badge } from '@/components/ui/badge';

interface ListingDetailProps {
  listing: AppListingDetail;
}

export default function ListingDetail({ listing }: ListingDetailProps) {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Build gallery images with explicit alt text for testing
  const images = (listing.galleryImages || []).map((img: any, idx: number) => ({
    src: urlFor(img).url(),
    alt: `Gallery image ${idx + 1}`,
  }));

  if (listing.primaryImage) {
    images.unshift({
      src: urlFor(listing.primaryImage).url(),
      alt: listing.primaryImage.alt || listing.name,
    });
  }

  const handleImageClick = (index: number) => {
    setCurrentImageIndex(index);
    setIsLightboxOpen(true);
  };

  const calculateAverageRating = () => {
    if (!listing.reviews || listing.reviews.length === 0) return null;
    const totalRating = listing.reviews.reduce((sum: number, review: AppReview) => sum + review.rating, 0);
    return (totalRating / listing.reviews.length).toFixed(1);
  };

  const averageRating = calculateAverageRating();

  return (
    <div className="container mx-auto px-4 py-8" role="article">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Title and Location */}
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-2">
              {listing.name}
            </h1>
            {listing.city && (
              <Link
                href={`/cities/${listing.city.slug}`}
                className="text-lg text-muted-foreground hover:text-primary"
              >
                {listing.city.name}, {listing.city.country}
              </Link>
            )}
            <div className="flex items-center mt-2 text-sm text-gray-600">
              {averageRating && (
                <>
                  <Star className="h-4 w-4 text-yellow-500 mr-1" fill="currentColor" />
                  <span>{averageRating} ({listing.reviews?.length} reviews)</span>
                  <span className="mx-2">•</span>
                </>
              )}
              <span>{listing.type} in {listing.city?.name}</span>
            </div>
          </div>

          {/* Image Gallery */}
          {images.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative h-80 md:h-auto md:col-span-2 rounded-lg overflow-hidden cursor-pointer" onClick={() => handleImageClick(0)}>
                <Image
                  src={images[0].src}
                  alt={images[0].alt}
                  fill
                  className="object-cover"
                  priority
                />
                {images.length > 1 && (
                  <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                    +{images.length - 1} more photos
                  </div>
                )}
              </div>
              {images.slice(1, 5).map((img, index) => (
                <div key={index} className="relative h-40 rounded-lg overflow-hidden cursor-pointer" onClick={() => handleImageClick(index + 1)}>
                  <Image
                    src={img.src}
                    alt={img.alt}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Description */}
          {listing.longDescription && (
            <div>
              <h2 className="text-2xl font-semibold mb-4">About this place</h2>
              <div className="prose prose-lg max-w-none">
                <PortableText value={listing.longDescription as any} />
              </div>
            </div>
          )}

          {/* Eco Features */}
          {listing.ecoTags && listing.ecoTags.length > 0 && (
            <div>
              <h2 className="text-2xl font-semibold mb-4">Eco Features</h2>
              <div className="flex flex-wrap gap-2">
                {listing.ecoTags.map((tag: string) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Contact Information */}
          {(listing.contactEmail || listing.contactPhone || listing.website) && (
            <div>
              <h2 className="text-2xl font-semibold mb-4">Contact Information</h2>
              <div className="space-y-2">
                {listing.contactEmail && (
                  <p>
                    Email: <a href={`mailto:${listing.contactEmail}`} className="text-primary-600 hover:underline">{listing.contactEmail}</a>
                  </p>
                )}
                {listing.contactPhone && (
                  <p>
                    Phone: <a href={`tel:${listing.contactPhone}`} className="text-primary-600 hover:underline">{listing.contactPhone}</a>
                  </p>
                )}
                {listing.website && (
                  <p>
                    Website: <a href={listing.website} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">{listing.website}</a>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Reviews */}
          {listing.reviews && listing.reviews.length > 0 && (
            <div>
              <h2 className="text-2xl font-semibold mb-4">Reviews</h2>
              <div className="space-y-6">
                {listing.reviews.map((review: AppReview) => (
                  <div key={review.createdAt} className="border-b pb-4 last:border-b-0">
                    <div className="flex items-center mb-2">
                      <Star className="h-4 w-4 text-yellow-500 mr-1" fill="currentColor" />
                      <span className="font-semibold">{review.rating}</span>
                      <span className="text-sm text-gray-500 ml-2">
                        by {review.user.name} on {format(new Date(review.createdAt), 'PPP')}
                      </span>
                    </div>
                    <p className="text-gray-700">{review.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-8">
          {/* Price Range */}
          {listing.priceRange && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-4">Price Range</h3>
              <p className="text-gray-700 capitalize">{listing.priceRange}</p>
            </div>
          )}

          {/* Location Map */}
          {listing.location && listing.location.lat && listing.location.lng ? (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-4">Location</h3>
              <div className="h-64 w-full rounded-lg overflow-hidden">
                <MapContainer listings={[listing]} />
              </div>
              {listing.address && (
                <p className="text-gray-700 mt-4">{listing.address}</p>
              )}
            </div>
          ) : (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-4">Location</h3>
              <p className="text-gray-500">No valid coordinates for this listing.</p>
              {listing.address && (
                <p className="text-gray-700 mt-4">{listing.address}</p>
              )}
            </div>
          )}

          {/* Coworking Details */}
          {listing.coworkingDetails && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-4">Coworking Details</h3>
              {listing.coworkingDetails.capacity && (
                <p className="text-gray-700">Capacity: {listing.coworkingDetails.capacity}</p>
              )}
              {listing.coworkingDetails.pricingPlans && listing.coworkingDetails.pricingPlans.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold mb-2">Pricing Plans:</h4>
                  <ul className="space-y-1">
                    {listing.coworkingDetails.pricingPlans.map((plan, index) => (
                      <li key={index} className="text-gray-700">
                        {plan.type}: {plan.price} {plan.period}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {listing.coworkingDetails.openingHours && listing.coworkingDetails.openingHours.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold mb-2">Opening Hours:</h4>
                  <ul className="space-y-1">
                    {listing.coworkingDetails.openingHours.map((hour, index) => (
                      <li key={index} className="text-gray-700">
                        {hour.day}: {hour.opens} - {hour.closes}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Accommodation Details */}
          {listing.accommodationDetails && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-4">Accommodation Details</h3>
              {listing.accommodationDetails.pricePerNightThb && (
                <p className="text-gray-700">
                  Price per night: {listing.accommodationDetails.pricePerNightThb.min} - {listing.accommodationDetails.pricePerNightThb.max} THB
                </p>
              )}
              {listing.accommodationDetails.openingHours && listing.accommodationDetails.openingHours.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold mb-2">Opening Hours:</h4>
                  <ul className="space-y-1">
                    {listing.accommodationDetails.openingHours.map((hour, index) => (
                      <li key={index} className="text-gray-700">
                        {hour.day}: {hour.opens} - {hour.closes}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Cafe Details */}
          {listing.cafeDetails && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-4">Cafe Details</h3>
              {listing.cafeDetails.openingHours && listing.cafeDetails.openingHours.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold mb-2">Opening Hours:</h4>
                  <ul className="space-y-1">
                    {listing.cafeDetails.openingHours.map((hour, index) => (
                      <li key={index} className="text-gray-700">
                        {hour.day}: {hour.opens} - {hour.closes}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Category-specific Details */}
          {listing.type === 'restaurant' && listing.restaurantDetails && (
            <div>
              <h2 className="text-2xl font-semibold mb-4">Restaurant Details</h2>
              <ul className="list-disc list-inside">
                {listing.restaurantDetails.cuisine && (
                  <li>Cuisine: {listing.restaurantDetails.cuisine.join(', ')}</li>
                )}
                {listing.restaurantDetails.dietaryOptions && (
                  <li>Dietary Options: {listing.restaurantDetails.dietaryOptions.join(', ')}</li>
                )}
                {listing.restaurantDetails.pricePerPerson != null && (
                  <li>Price Per Person: {listing.restaurantDetails.pricePerPerson}</li>
                )}
                {listing.restaurantDetails.delivery != null && (
                  <li>Delivery Available: {listing.restaurantDetails.delivery ? 'Yes' : 'No'}</li>
                )}
                {listing.restaurantDetails.takeaway != null && (
                  <li>Takeaway: {listing.restaurantDetails.takeaway ? 'Yes' : 'No'}</li>
                )}
                {listing.restaurantDetails.reservation != null && (
                  <li>Reservation Required: {listing.restaurantDetails.reservation ? 'Yes' : 'No'}</li>
                )}
                {listing.restaurantDetails.outdoorSeating != null && (
                  <li>Outdoor Seating: {listing.restaurantDetails.outdoorSeating ? 'Yes' : 'No'}</li>
                )}
              </ul>
            </div>
          )}

          {listing.type === 'activities' && listing.activitiesDetails && (
            <div>
              <h2 className="text-2xl font-semibold mb-4">Activities Details</h2>
              <ul className="list-disc list-inside">
                {listing.activitiesDetails.category && (
                  <li>Category: {listing.activitiesDetails.category.join(', ')}</li>
                )}
                {listing.activitiesDetails.duration && (
                  <li>Duration: {listing.activitiesDetails.duration}</li>
                )}
                {listing.activitiesDetails.difficulty && (
                  <li>Difficulty: {listing.activitiesDetails.difficulty}</li>
                )}
                {listing.activitiesDetails.groupSize && (
                  <li>Group Size: {listing.activitiesDetails.groupSize.min} - {listing.activitiesDetails.groupSize.max}</li>
                )}
                {listing.activitiesDetails.seasonality && (
                  <li>Seasonality: {listing.activitiesDetails.seasonality.join(', ')}</li>
                )}
                {listing.activitiesDetails.equipment != null && (
                  <li>Equipment Required: {listing.activitiesDetails.equipment ? 'Yes' : 'No'}</li>
                )}
              </ul>
            </div>
          )}
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
    {/* Amenities */}
    {listing.amenities && listing.amenities.length > 0 && (
      <div>
        <h2 className="text-2xl font-semibold mb-4">Amenities</h2>
        <div className="flex flex-wrap gap-4">
          {listing.amenities.map((amenity: import('@/types/sanity').Amenity) => (
            <div key={amenity._id} className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2">
              {amenity.badge?.asset?.url && (
                <img src={amenity.badge.asset.url} alt={amenity.name} className="w-8 h-8 rounded-full object-cover" />
              )}
              <div>
                <div className="font-semibold">{amenity.name}</div>
                {amenity.description && (
                  <div className="text-xs text-gray-500">{amenity.description}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
  );
}
// ...existing code...


