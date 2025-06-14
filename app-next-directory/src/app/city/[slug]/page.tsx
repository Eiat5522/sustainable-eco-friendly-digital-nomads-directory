import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ApiResponseHandler } from '@/utils/api-response'; // Assuming this is correctly pathed
import { getClient } from '@/lib/sanity/client'; // For urlFor, if needed
import { urlFor } from '@/lib/sanity/image'; // Corrected import path

// Define the expected shape of the city data
interface CityPageProps {
  params: {
    slug: string;
  };
}

interface CityData {
  _id: string;
  title: string;
  country: string;
  description?: string;
  sustainabilityScore?: number;
  highlights?: string[];
  mainImage?: {
    asset?: {
      _id: string;
      url: string;
      metadata?: {
        dimensions?: {
          width: number;
          height: number;
        };
      };
      alt?: string; // Added alt here based on schema
    };
  };
}

// Set revalidation for SSG (build-time only)
export const revalidate = false; 

// Function to fetch city data
async function getCityData(slug: string): Promise<CityData | null> {
  // In a real app, you'd fetch from your API endpoint:
  // const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/city/${slug}`);
  // For now, directly using the Sanity query function for simplicity in this step
  // This avoids needing the API to be running during build if using SSG.
  // However, the plan was to call the API route. Let's stick to that if possible,
  // but it requires the API to be available at build time.
  // Using a direct server-side fetch to the API endpoint:
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'; // Fallback for local dev
  
  try {
    const res = await fetch(`${apiUrl}/api/city/${slug}`, {
      next: { revalidate: false }, // Match page revalidation
    });

    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`Failed to fetch city data: ${res.statusText}`);
    }
    const response = await res.json();
    if (response.success) {
      return response.data as CityData;
    }
    console.error("API call was not successful:", response.error);
    return null;
  } catch (error) {
    console.error("Error fetching city data:", error);
    return null;
  }
}

export default async function CityDetailPage({ params }: CityPageProps) {
  const city = await getCityData(params.slug);

  if (!city) {
    notFound(); // Triggers 404 page
  }

  const imageAsset = city.mainImage?.asset;
  let mainImageUrl = '/placeholder-city.jpg'; // Default fallback
  if (imageAsset?._id) {
    const builtUrl = urlFor(imageAsset._id)?.width(1200)?.height(800)?.url();
    if (builtUrl) {
      mainImageUrl = builtUrl;
    }
  }

  const mainImageAlt = imageAsset?.alt || `Image of ${city.title}`;


  return (
    <div className="container mx-auto px-4 py-8">
      <article className="bg-white dark:bg-gray-800 shadow-xl rounded-lg overflow-hidden">
        {/* Main Image */}
        <div className="relative w-full h-64 md:h-96">
          <Image
            src={mainImageUrl}
            alt={mainImageAlt}
            fill
            className="object-cover"
            priority
          />
        </div>

        <div className="p-6 md:p-10">
          {/* City Name and Country */}
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-2">
            {city.title}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-6">
            {city.country}
          </p>

          {/* Description */}
          {city.description && (
            <div className="prose dark:prose-invert max-w-none mb-8">
              <p className="text-lg">{city.description}</p>
            </div>
          )}

          {/* Sustainability Score */}
          {typeof city.sustainabilityScore === 'number' && (
            <div className="mb-8 p-4 bg-green-50 dark:bg-green-900 rounded-lg">
              <h2 className="text-2xl font-semibold text-green-700 dark:text-green-300 mb-2">
                Sustainability Score
              </h2>
              <p className="text-4xl font-bold text-green-600 dark:text-green-200">
                {city.sustainabilityScore}
                <span className="text-2xl">/100</span>
              </p>
            </div>
          )}

          {/* Highlights */}
          {city.highlights && city.highlights.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-3">
                Eco Highlights
              </h2>
              <ul className="list-disc list-inside space-y-2">
                {city.highlights.map((highlight, index) => (
                  <li key={index} className="text-gray-700 dark:text-gray-300 text-lg">
                    {highlight}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Call to Action */}
          <div className="mt-10 text-center">
            <Link
              href="/signup" // Placeholder, eventually leads to signup form
              className="inline-block bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg text-lg transition duration-300 ease-in-out transform hover:scale-105"
            >
              Discover More & Sign Up!
            </Link>
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              Join our community to unlock exclusive content and features.
            </p>
          </div>
        </div>
      </article>
    </div>
  );
}

// Optional: Generate static paths if you know all city slugs at build time
// export async function generateStaticParams() {
//   // const sanityClient = getClient(); // Get client configured for preview: false
//   // const cities = await sanityClient.fetch(`*[_type == "city"]{"slug": slug.current}`);
//   // return cities.map((city: { slug: string }) => ({
//   //   slug: city.slug,
//   // }));
//   // For now, let Next.js handle this dynamically at build time or on first request
//   return [];
// }
