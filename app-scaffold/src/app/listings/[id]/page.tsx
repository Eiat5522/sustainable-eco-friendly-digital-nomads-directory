import { Breadcrumbs } from '@/components/Breadcrumbs';
import { PreviewBanner } from '@/components/preview/PreviewBanner';
import { getClient } from '@/lib/sanity.utils';
import { Metadata } from 'next';
import { draftMode } from 'next/headers';
import Image from 'next/image';
import { notFound } from 'next/navigation';

interface ListingPageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({
  params,
}: ListingPageProps): Promise<Metadata> {
  const client = getClient(false);
  const listing = await client.fetch(
    `*[_type == "listing" && _id == $id][0]{
      name,
      description_short,
      city->{name},
      primary_image_url
    }`,
    { id: params.id }
  );

  if (!listing) return { title: 'Listing Not Found' };

  return {
    title: `${listing.name} - Eco-Friendly Space in ${listing.city.name}`,
    description: listing.description_short,
    openGraph: {
      title: `${listing.name} - Sustainable Digital Nomad Space`,
      description: listing.description_short,
      images: [{ url: listing.primary_image_url }],
    },
  };
}

export default async function ListingPage({ params }: ListingPageProps) {
  const preview = draftMode().isEnabled;
  const client = getClient(preview);

  const listing = await client.fetch(
    `*[_type == "listing" && _id == $id][0]{
      _id,
      name,
      description_short,
      description_long,
      city->{
        name,
        country,
        slug
      },
      category,
      "image": primary_image_url,
      "gallery": gallery_image_urls,
      eco_focus_tags,
      digital_nomad_features,
      "slug": slug.current,
      price_range,
      website_url,
      contact_email,
      sustainability_score,
      amenities
    }`,
    { id: params.id }
  );

  if (!listing) {
    notFound();
  }

  // Generate JSON-LD structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: listing.name,
    description: listing.description_long || listing.description_short,
    image: listing.image,
    address: {
      '@type': 'PostalAddress',
      addressLocality: listing.city.name,
      addressCountry: listing.city.country,
    },
    category: listing.category,
    url: `${process.env.NEXT_PUBLIC_SITE_URL}/listings/${listing.slug}`,
    priceRange: listing.price_range,
  };

  const breadcrumbs = [
    { name: 'Home', href: '/' },
    { name: 'Listings', href: '/listings' },
    { name: listing.city.name, href: `/city/${listing.city.slug}` },
    { name: listing.name },
  ];

  return (
    <>
      {preview && <PreviewBanner />}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        <Breadcrumbs segments={breadcrumbs} />

        <article className="bg-white dark:bg-gray-800 shadow-lg rounded-xl overflow-hidden">
          {/* Hero Section */}
          <div className="relative aspect-video">
            {listing.image ? (
              <Image
                src={listing.image}
                alt={listing.name}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center">
                <h1 className="text-white text-2xl font-bold">{listing.name}</h1>
              </div>
            )}
          </div>

          <div className="p-8">
            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {listing.name}
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-300">
                  {listing.city.name}, {listing.city.country}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <span
                  className={`px-4 py-2 rounded-full text-sm font-semibold ${
                    listing.category === 'coworking'
                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100'
                      : listing.category === 'accommodation'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'
                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100'
                  }`}
                >
                  {listing.category}
                </span>
                {listing.sustainability_score && (
                  <span className="px-4 py-2 rounded-full text-sm font-semibold bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                    Eco Score: {listing.sustainability_score}/10
                  </span>
                )}
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Main Info */}
              <div className="lg:col-span-2">
                <div className="prose dark:prose-invert max-w-none">
                  <h2 className="text-2xl font-semibold mb-4">About This Space</h2>
                  <p className="text-gray-600 dark:text-gray-300">
                    {listing.description_long || listing.description_short}
                  </p>
                </div>

                {/* Amenities */}
                {listing.amenities && listing.amenities.length > 0 && (
                  <div className="mt-8">
                    <h2 className="text-2xl font-semibold mb-4">Amenities</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {listing.amenities.map((amenity: string) => (
                        <div key={amenity} className="flex items-center gap-2">
                          <span className="text-emerald-600 dark:text-emerald-400">
                            ✓
                          </span>
                          <span>{amenity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Features & Contact */}
              <div className="space-y-6">
                {/* Eco Features */}
                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-4">
                    Eco Features
                  </h3>
                  {listing.eco_focus_tags?.length ? (
                    <ul className="space-y-2">
                      {listing.eco_focus_tags.map((tag: string) => (
                        <li
                          key={tag}
                          className="flex items-center gap-2 text-green-700 dark:text-green-300"
                        >
                          <span>🌱</span>
                          {tag}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-green-700 dark:text-green-300">
                      No eco features listed yet.
                    </p>
                  )}
                </div>

                {/* Digital Nomad Features */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-4">
                    Digital Nomad Features
                  </h3>
                  {listing.digital_nomad_features?.length ? (
                    <ul className="space-y-2">
                      {listing.digital_nomad_features.map((feature: string) => (
                        <li
                          key={feature}
                          className="flex items-center gap-2 text-blue-700 dark:text-blue-300"
                        >
                          <span>💻</span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-blue-700 dark:text-blue-300">
                      No features listed yet.
                    </p>
                  )}
                </div>

                {/* Contact & Links */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4">Contact & Links</h3>
                  <div className="space-y-4">
                    {listing.website_url && (
                      <a
                        href={listing.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-emerald-600 dark:text-emerald-400 hover:underline"
                      >
                        <span>🌐</span>
                        Visit Website
                      </a>
                    )}
                    {listing.contact_email && (
                      <div className="flex items-center gap-2">
                        <span>📧</span>
                        <a
                          href={`mailto:${listing.contact_email}`}
                          className="text-emerald-600 dark:text-emerald-400 hover:underline"
                        >
                          {listing.contact_email}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </article>
      </main>
    </>
  );
}
