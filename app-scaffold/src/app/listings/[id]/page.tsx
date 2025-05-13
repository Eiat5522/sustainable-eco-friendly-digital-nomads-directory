import { Metadata } from 'next';
import { ImageGallery } from '@/components/listings/ImageGallery';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getListingById } from '@/lib/listings';
import { getListingImages } from '@/lib/getListingImages.js';

interface Props {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const listing = getListingById(resolvedParams.id);
  if (!listing) return notFound();

  return {
    title: `${listing.name} | Sustainable Digital Nomads Directory`,
    description: listing.description_short,
  };
}

export default async function ListingPage({ params }: Props) {
  const resolvedParams = await params;
  const listing = getListingById(resolvedParams.id);
  if (!listing) return notFound();

  const images = getListingImages(resolvedParams.id);

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
            {listing.description_short}
          </p>
        </div>

        {/* Image and Key Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Image Gallery */}
          <ImageGallery
            images={images}
            alt={listing.name}
          />

          {/* Key Info */}
          <div className="space-y-6 bg-white dark:bg-slate-700 p-6 rounded-lg shadow">
            {/* Location */}
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                Location
              </h2>
              <p className="text-slate-600 dark:text-slate-400">{listing.address_string}</p>
            </div>

            {/* Eco Focus Tags */}
            {listing.eco_focus_tags && listing.eco_focus_tags.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                Sustainability Features
              </h2>
              <div className="flex flex-wrap gap-2">
                {listing.eco_focus_tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-block px-3 py-1 text-sm bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100 rounded-full" // Deep Forest Green-like
                  >
                    {tag.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
            )}

            {/* Digital Nomad Features */}
            {listing.digital_nomad_features && listing.digital_nomad_features.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text_slate-900 dark:text-white mb-2">
                  Digital Nomad Features
                </h2>
                <div className="flex flex-wrap gap-2">
                  {listing.digital_nomad_features.map((feature) => (
                    <span
                      key={feature}
                      className="inline-block px-3 py-1 text-sm bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100 rounded-full" // Soft Beige-like
                    >
                      {feature.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Detailed Description */}
        <div className="prose dark:prose-invert max-w-none prose-headings:text-slate-800 dark:prose-headings:text-slate-100 prose-p:text-slate-700 dark:prose-p:text-slate-300 prose-strong:text-slate-800 dark:prose-strong:text-slate-200 prose-ul:text-slate-700 dark:prose-ul:text-slate-300 prose-li:text-slate-700 dark:prose-li:text-slate-300">
          <h2 className="text-2xl font-semibold mt-8 mb-4">About {listing.name}</h2>
          <p>{listing.description_long}</p>

          {listing.eco_notes_detailed && (
            <>
              <h2 className="text-2xl font-semibold mt-6 mb-4">Sustainability Initiatives</h2>
              <p>{listing.eco_notes_detailed}</p>
            </>
          )}

          {/* Category-specific Details */}
          {listing.category === 'coworking' && listing.coworking_details && (
            <>
              <h2>Coworking Details</h2>
              {listing.coworking_details.operating_hours && (
                <p>
                  <strong>Operating Hours:</strong>{' '}
                  {typeof listing.coworking_details.operating_hours === 'string'
                    ? listing.coworking_details.operating_hours
                    : Object.entries(listing.coworking_details.operating_hours).map(([key, value]) => `${key.replace(/_/g, ' ')}: ${value}`).join(', ')}
                </p>
              )}
              {listing.coworking_details.pricing_plans && listing.coworking_details.pricing_plans.length > 0 && (
                <>
                  <h3 className="text-xl font-semibold mt-4 mb-2">Pricing Plans</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {listing.coworking_details.pricing_plans.map((plan, index) => (
                      <li key={index}>
                        <span className="font-medium">{String(plan.type).replace(/_/g, ' ')}:</span> ฿{plan.price_thb}
                        {plan.price_notes && <span className="text-sm italic"> ({plan.price_notes})</span>}
                      </li>
                    ))}
                  </ul>
                </>
              )}
              {listing.coworking_details.specific_amenities_coworking && listing.coworking_details.specific_amenities_coworking.length > 0 && (
                <>
                  <h3 className="text-xl font-semibold mt-4 mb-2">Amenities</h3>
                  <ul className="list-disc list-inside grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                    {listing.coworking_details.specific_amenities_coworking.map((amenity) => (
                      <li key={amenity}>{amenity.replace(/_/g, ' ')}</li>
                    ))}
                  </ul>
                </>
              )}
            </>
          )}

          {listing.category === 'cafe' && listing.cafe_details && (
            <>
              <h2>Cafe Details</h2>
              {listing.cafe_details.operating_hours && (
                <p>
                  <strong>Operating Hours:</strong>{' '}
                  {typeof listing.cafe_details.operating_hours === 'string'
                    ? listing.cafe_details.operating_hours
                    : Object.entries(listing.cafe_details.operating_hours).map(([key, value]) => `${key.replace(/_/g, ' ')}: ${value}`).join(', ')}
                </p>
              )}
              {listing.cafe_details.price_indication && (
                <p>
                  <strong>Price Range:</strong> {String(listing.cafe_details.price_indication)}
                </p>
              )}
              {listing.cafe_details.menu_highlights_cafe && listing.cafe_details.menu_highlights_cafe.length > 0 && (
                <>
                  <h3 className="text-xl font-semibold mt-4 mb-2">Menu Highlights</h3>
                  <ul className="list-disc list-inside grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                    {listing.cafe_details.menu_highlights_cafe.map((highlight) => (
                      <li key={highlight}>{highlight.replace(/_/g, ' ')}</li>
                    ))}
                  </ul>
                </>
              )}
              {listing.cafe_details.wifi_reliability_notes && (
                <p>
                  <strong>WiFi Notes:</strong> {listing.cafe_details.wifi_reliability_notes}
                </p>
              )}
            </>
          )}

          {listing.category === 'accommodation' && listing.accommodation_details && (
            <>
              <h2>Accommodation Details</h2>
              <p>
                <strong>Type:</strong> {String(listing.accommodation_details.accommodation_type).replace(/_/g, ' ')}
              </p>
              {listing.accommodation_details.price_per_night_thb_range && (
                <p>
                  <strong>Price Range:</strong>{' '}
                  {typeof listing.accommodation_details.price_per_night_thb_range === 'string'
                    ? listing.accommodation_details.price_per_night_thb_range
                    : `฿${(listing.accommodation_details.price_per_night_thb_range as { min?: number; max?: number }).min || 'N/A'} - ฿${(listing.accommodation_details.price_per_night_thb_range as { min?: number; max?: number }).max || 'N/A'}`}
                </p>
              )}
              {listing.accommodation_details.room_types_available && listing.accommodation_details.room_types_available.length > 0 && (
                <>
                  <h3 className="text-xl font-semibold mt-4 mb-2">Room Types</h3>
                  <ul className="list-disc list-inside grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                    {listing.accommodation_details.room_types_available.map((type) => (
                      <li key={type}>{type.replace(/_/g, ' ')}</li>
                    ))}
                  </ul>
                </>
              )}
              {listing.accommodation_details.specific_amenities_accommodation && listing.accommodation_details.specific_amenities_accommodation.length > 0 && (
                <>
                  <h3 className="text-xl font-semibold mt-4 mb-2">Amenities</h3>
                  <ul className="list-disc list-inside grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                    {listing.accommodation_details.specific_amenities_accommodation.map((amenity) => (
                      <li key={amenity}>{amenity.replace(/_/g, ' ')}</li>
                    ))}
                  </ul>
                </>
              )}
            </>
          )}

          {/* Source URLs */}
          {listing.source_urls && listing.source_urls.length > 0 && (
            <>
              <h2 className="text-2xl font-semibold mt-6 mb-4">Sources & Additional Information</h2>
              <ul className="list-disc list-inside space-y-1">
                {listing.source_urls.map((url) => (
                  <li key={url}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-600 dark:text-emerald-400 hover:underline hover:text-emerald-700 dark:hover:text-emerald-300 break-all"
                    >
                      {url}
                    </a>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </article>
    </main>
  );
}
