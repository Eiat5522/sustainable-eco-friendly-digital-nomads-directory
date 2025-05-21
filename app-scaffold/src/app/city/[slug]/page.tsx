import { Breadcrumbs } from '@/components/Breadcrumbs';
import { ListingCard } from '@/components/listings/ListingCard'; // Assuming you have this
import { PreviewBanner } from '@/components/preview/PreviewBanner';
import { getClient } from '@/lib/sanity/client';
import { Listing } from '@/types/listings'; // Assuming you have a shared Listing type
import { Metadata } from 'next';
import { draftMode } from 'next/headers';
import { notFound } from 'next/navigation';

// Utility to convert a string to a slug
function slugify(text: string): string {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w-]+/g, '') // Remove all non-word chars
    .replace(/--+/g, '-'); // Replace multiple - with single -
}

// Function to fetch all unique city names and convert them to slugs
async function getAllCitySlugs() {
  const client = getClient();
  // Fetch all unique city names from listings
  const cityNames = await client.fetch<string[]>(
    `array::unique(*[_type == "listing" && defined(city)].city)`
  );
  return cityNames.map((name: string) => ({ // Added type for name
    slug: slugify(name),
  }));
}

export async function generateStaticParams() {
  const citySlugs = await getAllCitySlugs();
  return citySlugs;
}

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

export default async function CityPage({ params }: CityPageProps) {
  const { isEnabled } = draftMode();
  const client = getClient(isEnabled);

  // Fetch listings for the current city slug
  // We need to fetch all listings and then filter them in code if Sanity's GROQ can't slugify on the fly for queries.
  // Or, if your Sanity instance allows for custom functions or more complex queries, that could be an option.
  // For now, let's fetch all and filter, which is not ideal for very large datasets.
  // A better approach if possible is to store a slugified version of the city in Sanity if you add a proper City schema.

  const allListings = await client.fetch<Listing[]>(
    `*[_type == "listing"]{
      "id": _id,
      name,
      "slug": slug.current,
      city,
      category,
      "description_short": descriptionShort,
      "eco_focus_tags": ecoTags,
      "digital_nomad_features": nomadFeatures,
      "primary_image_url": mainImage.asset->url
    }`
  );

  console.log('All Listings:', allListings);
  console.log('Params Slug:', params.slug);

  const listingsInCity = allListings.filter(
    (listing: Listing) => {
      const citySlug = slugify(listing.city);
      console.log(`Comparing: ${citySlug} === ${params.slug}`);
      return citySlug === params.slug;
    }
  );
  console.log('Listings in City:', listingsInCity);

  // Removed the notFound() call here to always show the "No listings" message
  // if (listingsInCity.length === 0) {
  //   // Try to find if the city name itself exists, even if no listings currently
  //   const cityExists = allListings.some((listing: Listing) => slugify(listing.city) === params.slug);
  //   if (!cityExists) {
  //       notFound();
  //   }
  // }

  // Determine the "true" city name from the first listing, or de-slugify
  const cityName = listingsInCity.length > 0 ? listingsInCity[0].city : params.slug.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());


  const breadcrumbs = [
    { name: 'Home', href: '/' },
    { name: 'Cities', href: '/cities' }, // Assuming you might have a /cities overview page
    { name: cityName },
  ];

  return (
    <>
      {isEnabled && <PreviewBanner />}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Breadcrumbs segments={breadcrumbs} />
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Eco-Friendly Listings in {cityName}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mt-2">
            Discover sustainable coworking spaces, cafes, and accommodations.
          </p>
        </div>

        {listingsInCity.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {listingsInCity.map((listing: Listing) => ( // Added type for listing
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-xl text-gray-700 dark:text-gray-300">
              No listings found for {cityName} yet.
            </p>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              Check back soon or explore other cities!
            </p>
          </div>
        )}
      </main>
    </>
  );
}
