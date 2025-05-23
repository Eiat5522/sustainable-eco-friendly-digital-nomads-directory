import { getClient } from '@/lib/sanity/client';
import { getAllCities } from '@/lib/sanity/queries';
import { slugify } from '@/lib/utils';
import { Listing } from '@/types/listings';
import { Metadata } from 'next';

interface CityPageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: CityPageProps): Promise<Metadata> {
  const client = getClient();
  // Fetch one listing for this city to get the actual city name for metadata
  // This assumes city names are consistent.
  const listingInCity = await client.fetch<Listing | null>(
    `*[_type == "listing" && defined(city)][0]{
      "id": _id,
      city
    }`
  ).then(result => result && slugify(result.city) === params.slug ? result : null);

  const cityName = listingInCity ? listingInCity.city : params.slug.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()); // Fallback to de-slugified slug

  if (!listingInCity && !cityName) { // If no listing found and slug is weird
    return { title: 'City Not Found' };
  }

  return {
    title: `${cityName} - Eco-Friendly Listings | Sustainable Digital Nomads`,
    description: `Discover sustainable coworking spaces, cafes, and accommodations in ${cityName}.`,
    openGraph: {
      title: `${cityName} - Sustainable Nomad Hotspots`,
      description: `Find the best eco-conscious places for digital nomads in ${cityName}.`,
    },
  };
}

export async function generateStaticParams() {
  const cities = await getAllCities();
  console.log('Cities for generateStaticParams:', JSON.stringify(cities, null, 2)); // Added for debugging
  return cities.map((city: { title: string; slug: string }) => ({
    slug: city.slug || slugify(city.title),
  }));
}

// Import the CityPageClient component

// Use dynamic import with no SSR to ensure client component works correctly
// const CityPageClient = dynamic(() => import('./CityPageClient'), { ssr: false });

export default async function CityPage({ params }: CityPageProps) {
  // const { isEnabled } = draftMode();

  // // Server-side data fetching
  // const cityData = await getCity(params.slug);
  // const listingsData = await getListingsByCity(params.slug);

  // // Handle city not found
  // if (!cityData) {
  //   return (
  //     <div className="flex flex-col items-center justify-center min-h-screen text-center">
  //       <h2 className="text-2xl font-semibold text-gray-700 mb-4">City Not Found</h2>
  //       <p className="text-gray-600 mb-6">The city you are looking for does not exist or could not be loaded.</p>
  //       <Link href="/"
  //         className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
  //       >
  //         Go to Homepage
  //       </Link>
  //     </div>
  //   );
  // }

  return (
    <>
      {/* {isEnabled && <PreviewBanner />} */}
      {/* <ScrollToTopButton /> */}
      {/* <CityPageClient city={cityData} listings={listingsData || []} /> */}
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold">City Page: {params.slug}</h1>
        <p>If you see this, the basic page component is rendering.</p>
      </div>
    </>
  );
}
