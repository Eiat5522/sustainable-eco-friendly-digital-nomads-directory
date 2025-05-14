import { Metadata } from 'next';
import { ImageGallery } from '@/components/listings/ImageGallery';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getListingBySlug } from '@/lib/sanity/queries';
import { urlForImage, generateImageSrcSet } from '@/lib/sanity/client';
import Image from 'next/image';

interface Props {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const listing = await getListingBySlug(params.slug);
  if (!listing) return notFound();

  return {
    title: `${listing.name} | Sustainable Digital Nomads Directory`,
    description: listing.descriptionShort,
  };
}

export default async function ListingPage({ params }: Props) {
  const listing = await getListingBySlug(params.slug);
  if (!listing) return notFound();

  // Convert Sanity images to the format expected by the ImageGallery component
  const mainImageUrl = listing.mainImage ? urlForImage(listing.mainImage).url() : null;
  const galleryImages = listing.galleryImages 
    ? listing.galleryImages.map(img => urlForImage(img).url())
    : [];
  
  // Combine the main image with gallery images
  const allImages = mainImageUrl ? [mainImageUrl, ...galleryImages] : galleryImages;

  // Format the last verified date
  const lastVerifiedDate = listing.lastVerifiedDate 
    ? new Date(listing.lastVerifiedDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    : 'Date not specified';

  return (
    <main className="container mx-auto py-12 px-4 sm:px-6">
      {/* Back Link */}
      <Link
        href="/listings"
        className="inline-flex items-center text-emerald-600 dark:text-emerald-400 hover:underline mb-8"
      >
        ← Back to Listings
      </Link>

      <article className="bg-stone-50 dark:bg-slate-800 p-6 sm:p-8 rounded-lg shadow-lg">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              {listing.name}
            </h1>
            <span className={`inline-block px-3 py-1 text-sm font-semibold rounded-full ${
              listing.category === 'coworking'
                ? 'bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-100' // Terracotta-like
                : listing.category === 'cafe'
                ? 'bg-pink-100 text-pink-800 dark:bg-pink-800 dark:text-pink-100' // Blush Pink-like
                : 'bg-teal-100 text-teal-800 dark:bg-teal-800 dark:text-teal-100' // Soft Teal for Accommodation
            }`}>
              {listing.category.charAt(0).toUpperCase() + listing.category.slice(1)}
            </span>
          </div>
          <p className="text-xl text-slate-600 dark:text-slate-400">
            {listing.descriptionShort}
          </p>
        </div>

        {/* Image and Key Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Image Gallery */}
          <ImageGallery
            images={allImages}
            alt={listing.name}
          />

          {/* Key Info */}
          <div className="space-y-6 bg-white dark:bg-slate-700 p-6 rounded-lg shadow">
            {/* Location */}
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                Location
              </h2>
              <p className="text-slate-600 dark:text-slate-400">{listing.addressString}</p>
              {listing.coordinates && listing.coordinates.lat && listing.coordinates.lng && (
                <div className="mt-4 h-48 relative rounded overflow-hidden">
                  <Image
                    src={`https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/pin-l+22c55e(${listing.coordinates.lng},${listing.coordinates.lat})/${listing.coordinates.lng},${listing.coordinates.lat},13,0/600x300@2x?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN || 'DEFAULT_TOKEN'}`}
                    alt={`Map showing location of ${listing.name}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 600px"
                  />
                </div>
              )}
            </div>

            {/* Eco Focus Tags */}
            {listing.ecoTags && listing.ecoTags.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                Sustainability Features
              </h2>
              <div className="flex flex-wrap gap-2">
                {listing.ecoTags.map((tag: {name: string, slug: string}) => (
                  <span
                    key={tag.slug}
                    className="inline-block px-3 py-1 text-sm bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100 rounded-full" // Deep Forest Green-like
                  >
                    {tag.name.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
            )}

            {/* Digital Nomad Features */}
            {listing.nomadFeatures && listing.nomadFeatures.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                Digital Nomad Features
              </h2>
              <div className="flex flex-wrap gap-2">
                {listing.nomadFeatures.map((feature: {name: string, slug: string}) => (
                  <span
                    key={feature.slug}
                    className="inline-block px-3 py-1 text-sm bg-indigo-100 text-indigo-800 dark:bg-indigo-800 dark:text-indigo-100 rounded-full" // Deep Purple/Blue-like
                  >
                    {feature.name.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
            )}

            {/* Last verified date */}
            <div className="text-sm text-slate-500 dark:text-slate-400">
              Last verified: {lastVerifiedDate}
            </div>
          </div>
        </div>

        {/* Description Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
            About This Place
          </h2>
          <div className="prose prose-slate dark:prose-invert max-w-none">
            {listing.descriptionLong?.split('\n\n').map((paragraph, idx) => (
              <p key={idx}>{paragraph}</p>
            ))}
          </div>
        </div>

        {/* Eco Notes Section */}
        {listing.ecoNotesDetailed && (
          <div className="mb-12">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
              Sustainability Details
            </h2>
            <div className="prose prose-slate dark:prose-invert max-w-none">
              {listing.ecoNotesDetailed.split('\n\n').map((paragraph, idx) => (
                <p key={idx}>{paragraph}</p>
              ))}
            </div>
          </div>
        )}

        {/* Category-specific Details */}
        {/* Coworking Details */}
        {listing.category === 'coworking' && listing.coworkingDetails && (
          <div className="mb-12 bg-white dark:bg-slate-700 p-6 rounded-lg shadow">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
              Coworking Space Details
            </h2>
            
            {/* Operating Hours */}
            {listing.coworkingDetails.operatingHours && (
              <div className="mb-6">
                <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-2">
                  Operating Hours
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  {listing.coworkingDetails.operatingHours}
                </p>
              </div>
            )}
            
            {/* Pricing Plans */}
            {listing.coworkingDetails.pricingPlans && listing.coworkingDetails.pricingPlans.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-2">
                  Pricing Plans
                </h3>
                <ul className="space-y-2">
                  {listing.coworkingDetails.pricingPlans.map((plan, idx) => (
                    <li 
                      key={idx}
                      className="flex justify-between items-center border-b border-slate-200 dark:border-slate-600 pb-2"
                    >
                      <span className="text-slate-700 dark:text-slate-300">{plan.name}</span>
                      <span className="font-medium text-slate-900 dark:text-white">{plan.price}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Specific Amenities */}
            {listing.coworkingDetails.specificAmenities && listing.coworkingDetails.specificAmenities.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-2">
                  Amenities
                </h3>
                <div className="flex flex-wrap gap-2">
                  {listing.coworkingDetails.specificAmenities.map((amenity, idx) => (
                    <span
                      key={idx}
                      className="inline-block px-3 py-1 text-sm bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-100 rounded-full"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Cafe Details */}
        {listing.category === 'cafe' && listing.cafeDetails && (
          <div className="mb-12 bg-white dark:bg-slate-700 p-6 rounded-lg shadow">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
              Cafe Details
            </h2>
            
            {/* Operating Hours */}
            {listing.cafeDetails.operatingHours && (
              <div className="mb-6">
                <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-2">
                  Operating Hours
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  {listing.cafeDetails.operatingHours}
                </p>
              </div>
            )}
            
            {/* Price Indication */}
            {listing.cafeDetails.priceIndication && (
              <div className="mb-6">
                <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-2">
                  Price Range
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  {listing.cafeDetails.priceIndication}
                </p>
              </div>
            )}
            
            {/* Menu Highlights */}
            {listing.cafeDetails.menuHighlights && listing.cafeDetails.menuHighlights.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-2">
                  Menu Highlights
                </h3>
                <div className="flex flex-wrap gap-2">
                  {listing.cafeDetails.menuHighlights.map((item, idx) => (
                    <span
                      key={idx}
                      className="inline-block px-3 py-1 text-sm bg-amber-50 text-amber-700 dark:bg-amber-900 dark:text-amber-100 rounded-full"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* WiFi Reliability Notes */}
            {listing.cafeDetails.wifiReliabilityNotes && (
              <div>
                <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-2">
                  WiFi Reliability
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  {listing.cafeDetails.wifiReliabilityNotes}
                </p>
              </div>
            )}
          </div>
        )}
        
        {/* Accommodation Details */}
        {listing.category === 'accommodation' && listing.accommodationDetails && (
          <div className="mb-12 bg-white dark:bg-slate-700 p-6 rounded-lg shadow">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
              Accommodation Details
            </h2>
            
            {/* Type */}
            {listing.accommodationDetails.accommodationType && (
              <div className="mb-6">
                <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-2">
                  Type
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  {listing.accommodationDetails.accommodationType}
                </p>
              </div>
            )}
            
            {/* Price Range */}
            {listing.accommodationDetails.pricePerNightRange && (
              <div className="mb-6">
                <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-2">
                  Price Range (Per Night, THB)
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  ฿{listing.accommodationDetails.pricePerNightRange.min} - ฿{listing.accommodationDetails.pricePerNightRange.max}
                </p>
              </div>
            )}
            
            {/* Room Types */}
            {listing.accommodationDetails.roomTypesAvailable && listing.accommodationDetails.roomTypesAvailable.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-2">
                  Room Types Available
                </h3>
                <div className="flex flex-wrap gap-2">
                  {listing.accommodationDetails.roomTypesAvailable.map((roomType, idx) => (
                    <span
                      key={idx}
                      className="inline-block px-3 py-1 text-sm bg-teal-50 text-teal-700 dark:bg-teal-900 dark:text-teal-100 rounded-full"
                    >
                      {roomType}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* Specific Amenities */}
            {listing.accommodationDetails.specificAmenities && listing.accommodationDetails.specificAmenities.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-2">
                  Amenities
                </h3>
                <div className="flex flex-wrap gap-2">
                  {listing.accommodationDetails.specificAmenities.map((amenity, idx) => (
                    <span
                      key={idx}
                      className="inline-block px-3 py-1 text-sm bg-purple-50 text-purple-700 dark:bg-purple-900 dark:text-purple-100 rounded-full"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Sources Section */}
        {listing.sourceUrls && listing.sourceUrls.length > 0 && (
          <div className="border-t border-slate-200 dark:border-slate-700 pt-8 mt-8">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Sources & More Information
            </h2>
            <ul className="space-y-2">
              {listing.sourceUrls.map((url, idx) => (
                <li key={idx}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    {url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </article>
    </main>
  );
}
