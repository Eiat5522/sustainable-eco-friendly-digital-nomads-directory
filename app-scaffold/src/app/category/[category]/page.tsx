import { Breadcrumbs } from '@/components/Breadcrumbs';
import { getClient } from '@/lib/sanity.utils';
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
  city: {
    name: string;
    country: string;
  };
  eco_features: string[];
  price_range?: string;
}

interface CategoryInfo {
  title: string;
  description: string;
  icon: string;
  features: string[];
}

const CATEGORY_INFO: Record<string, CategoryInfo> = {
  coworking: {
    title: 'Coworking Spaces',
    description: 'Eco-friendly coworking spaces for sustainable digital nomads',
    icon: '💻',
    features: [
      'High-speed internet',
      'Meeting rooms',
      'Coffee & tea',
      'Printing facilities',
      'Community events'
    ]
  },
  cafe: {
    title: 'Sustainable Cafes',
    description: 'Zero-waste and eco-conscious cafes with great workspaces',
    icon: '☕',
    features: [
      'Fast WiFi',
      'Power outlets',
      'Sustainable food',
      'Quiet zones',
      'Extended hours'
    ]
  },
  accommodation: {
    title: 'Green Accommodations',
    description: 'Environmentally conscious places to stay while working remotely',
    icon: '🏡',
    features: [
      'Work desk',
      'Reliable internet',
      'Kitchen facilities',
      'Long-term stays',
      'Eco-friendly utilities'
    ]
  }
};

type Props = {
  params: { category: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const categoryInfo = CATEGORY_INFO[params.category];
  if (!categoryInfo) return { title: 'Category Not Found' };

  return {
    title: `${categoryInfo.title} - Sustainable Digital Nomad Directory`,
    description: categoryInfo.description,
    openGraph: {
      title: categoryInfo.title,
      description: categoryInfo.description,
      type: 'website',
      siteName: 'Sustainable Digital Nomads Directory'
    }
  };
}

export default async function CategoryPage({ params }: Props) {
  const categoryInfo = CATEGORY_INFO[params.category];
  if (!categoryInfo) {
    notFound();
  }

  const categoryListings = await getClient().fetch<Listing[]>(
    `*[_type == "listing" && category == $category] {
      _id,
      name,
      description_short,
      "slug": slug.current,
      primary_image_url,
      city->{
        name,
        country
      },
      eco_features,
      price_range
    } | order(city->name asc)`,
    { category: params.category }
  );

  const breadcrumbs = [
    { name: 'Home', href: '/' },
    { name: 'Categories', href: '/categories' },
    { name: categoryInfo.title }
  ];

  // Generate JSON-LD structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: categoryInfo.title,
    description: categoryInfo.description,
    url: `${process.env.NEXT_PUBLIC_SITE_URL}/category/${params.category}`,
    about: {
      '@type': 'Thing',
      name: categoryInfo.title,
    },
    numberOfItems: categoryListings.length,    itemListElement: categoryListings.map((listing: Listing, index: number) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'LocalBusiness',
        name: listing.name,
        description: listing.description_short,
        image: listing.primary_image_url,
        url: `${process.env.NEXT_PUBLIC_SITE_URL}/listings/${listing.slug}`,
      },
    })),
  };

  // Group listings by city for better organization  type ListingsByCity = Record<string, Listing[]>;

  const listingsByCity = categoryListings.reduce<ListingsByCity>((acc, listing) => {
    const cityName = listing.city.name;
    if (!acc[cityName]) {
      acc[cityName] = [];
    }
    acc[cityName].push(listing);
    return acc;
  }, {});

  return (
    <main className="container mx-auto py-8 px-4">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Breadcrumbs segments={breadcrumbs} />

      {/* Category Header */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-4xl">{categoryInfo.icon}</span>
          <div>
            <h1 className="text-3xl font-bold mb-2">{categoryInfo.title}</h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              {categoryInfo.description}
            </p>
          </div>
        </div>
      </div>

      {/* Stats and Features Grid */}
      <div className="grid md:grid-cols-2 gap-8 mb-12">
        {/* Stats Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
          <h2 className="text-xl font-semibold mb-6">Quick Stats</h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Total Locations</p>
              <p className="text-2xl font-bold">{categoryListings.length}</p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Cities</p>
              <p className="text-2xl font-bold">{Object.keys(listingsByCity).length}</p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Avg. Eco Features</p>
              <p className="text-2xl font-bold">
                {Math.round(
                  categoryListings.reduce((acc: number, l: Listing) => acc + l.eco_features.length, 0) /
                  Math.max(categoryListings.length, 1)
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Features Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
          <h2 className="text-xl font-semibold mb-6">Common Features</h2>
          <ul className="grid grid-cols-2 gap-3">
            {categoryInfo.features.map((feature) => (
              <li key={feature} className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <span className="text-emerald-500">✓</span>
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Listings by City */}
      {Object.entries(listingsByCity).map(([cityName, cityListings]: [string, Listing[]]) => (
        <div key={cityName} className="mb-12">
          <h2 className="text-2xl font-bold mb-6">{cityName}</h2>
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
                    <h3 className="text-xl font-semibold mb-2">{listing.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                      {listing.description_short}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {listing.eco_features.slice(0, 3).map((feature: string) => (
                        <span
                          key={feature}
                          className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full"
                        >
                          {feature}
                        </span>
                      ))}
                      {listing.eco_features.length > 3 && (
                        <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
                          +{listing.eco_features.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      ))}

      {categoryListings.length === 0 && (
        <div className="text-center py-12">
          <p className="text-lg text-gray-600 dark:text-gray-300">
            No listings found in this category yet.
          </p>
        </div>
      )}
    </main>
  );
}
