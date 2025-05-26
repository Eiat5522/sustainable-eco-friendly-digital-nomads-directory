import { Breadcrumbs } from '@/components/Breadcrumbs';
import { getClient } from '@/lib/sanity/client';
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface Listing {
  _id: string;
  name: string;
  description_short: string;
  slug: string;
  primary_image_url: string;
  category: string;
  eco_features: string[];
  price_range?: string;
}

interface City {
  _id: string;
  name: string;
  country: string;
  description: string;
  image_url: string;
  sustainability_score: number;
  popular_areas: string[];
  climate_info: {
    best_months: string[];
    average_temperature: number;
  };
  nomad_friendly_score: number;
  listings_count: {
    coworking: number;
    cafe: number;
    accommodation: number;
  };
}

type Props = {
  params: { city: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const cityData = await getClient().fetch<City>(
    `*[_type == "city" && lower(name) == $city][0]{
      name,
      description,
      country
    }`,
    { city: params.city.toLowerCase() }
  );

  if (!cityData) return { title: 'City Not Found' };

  return {
    title: `${cityData.name}, ${cityData.country} - Sustainable Digital Nomad Guide`,
    description: cityData.description,
    openGraph: {
      title: `${cityData.name} - Digital Nomad & Eco-Friendly Travel Guide`,
      description: cityData.description,
      type: 'website',
      siteName: 'Sustainable Digital Nomads Directory',
    }
  };
}

export default async function CityPage({ params }: Props) {
  const cityData = await getClient().fetch<City>(
    `*[_type == "city" && lower(name) == $city][0]{
      _id,
      name,
      country,
      description,
      image_url,
      sustainability_score,
      popular_areas,
      climate_info,
      nomad_friendly_score,
      "listings_count": {
        "coworking": count(*[_type == "listing" && references(^._id) && category == "coworking"]),
        "cafe": count(*[_type == "listing" && references(^._id) && category == "cafe"]),
        "accommodation": count(*[_type == "listing" && references(^._id) && category == "accommodation"])
      }
    }`,
    { city: params.city.toLowerCase() }
  );

  if (!cityData) {
    notFound();
  }

  const cityListings = await getClient().fetch<Listing[]>(
    `*[_type == "listing" && references(*[_type == "city" && lower(name) == $city][0]._id)]{
      _id,
      name,
      description_short,
      "slug": slug.current,
      primary_image_url,
      category,
      eco_features,
      price_range
    }`,
    { city: params.city.toLowerCase() }
  );

  const breadcrumbs = [
    { name: 'Home', href: '/' },
    { name: 'Cities', href: '/cities' },
    { name: cityData.name }
  ];

  // Generate JSON-LD structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'City',
    name: cityData.name,
    description: cityData.description,
    image: cityData.image_url,
    containedInPlace: {
      '@type': 'Country',
      name: cityData.country,
    },
    mainEntity: {
      '@type': 'CollectionPage',
      name: `Eco-Friendly Venues in ${cityData.name}`,
      description: `Sustainable spaces for digital nomads in ${cityData.name}`,
      numberOfItems: cityListings.length,
      itemListElement: cityListings.map((listing, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'LocalBusiness',
          name: listing.name,
          description: listing.description_short,
        }
      }))
    }
  };

  return (
    <main className="container mx-auto py-8 px-4">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Breadcrumbs segments={breadcrumbs} />

      {/* City Hero Section */}
      <div className="relative h-80 rounded-xl overflow-hidden mb-8">
        <Image
          src={cityData.image_url}
          alt={cityData.name}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 p-6 text-white">
          <h1 className="text-4xl font-bold mb-2">{cityData.name}</h1>
          <p className="text-xl opacity-90">{cityData.country}</p>
          <div className="flex items-center mt-3">
            <span className="px-3 py-1 bg-green-500 rounded-full text-sm font-medium">
              Sustainability Score: {cityData.sustainability_score}/10
            </span>
          </div>
        </div>
      </div>

      {/* City Description */}
      <div className="prose dark:prose-invert max-w-none mb-12">
        <p className="text-lg">{cityData.description}</p>
      </div>

      {/* City Info Grid */}
      <div className="grid md:grid-cols-2 gap-8 mb-12">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
          <h2 className="text-xl font-semibold mb-4">Popular Areas</h2>
          <ul className="space-y-2">
            {cityData.popular_areas.map((area) => (
              <li key={area} className="flex items-center text-gray-700 dark:text-gray-300">
                <span className="mr-2">📍</span> {area}
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
          <h2 className="text-xl font-semibold mb-4">Climate Information</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-3">
            Average Temperature: {cityData.climate_info.average_temperature}°C
          </p>
          <div>
            <h3 className="font-medium mb-2">Best Months to Visit:</h3>
            <div className="flex flex-wrap gap-2">
              {cityData.climate_info.best_months.map((month) => (
                <span
                  key={month}
                  className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-sm"
                >
                  {month}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md mb-12">
        <h2 className="text-xl font-semibold mb-6">Digital Nomad Stats</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Nomad Score</p>
            <p className="text-2xl font-bold">{cityData.nomad_friendly_score}/10</p>
          </div>
          <div>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Coworking Spaces</p>
            <p className="text-2xl font-bold">{cityData.listings_count.coworking}</p>
          </div>
          <div>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Cafes</p>
            <p className="text-2xl font-bold">{cityData.listings_count.cafe}</p>
          </div>
          <div>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Accommodations</p>
            <p className="text-2xl font-bold">{cityData.listings_count.accommodation}</p>
          </div>
        </div>
      </div>

      {/* Listings Section */}
      <h2 className="text-2xl font-bold mb-6">Eco-Friendly Spaces in {cityData.name}</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cityListings.map((listing) => (
          <div
            key={listing._id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
          >
            <Link href={`/listings/${listing.slug}`}>
              <div className="relative h-48">
                <Image
                  src={listing.primary_image_url}
                  alt={listing.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-semibold">{listing.name}</h3>
                  <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-sm">
                    {listing.category}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                  {listing.description_short}
                </p>
                <div className="flex flex-wrap gap-2">
                  {listing.eco_features.slice(0, 3).map((feature) => (
                    <span
                      key={feature}
                      className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </main>
  );
}
