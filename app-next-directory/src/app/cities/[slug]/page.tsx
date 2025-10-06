import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { sanity } from '@/lib/sanity';
import { City } from '@/types';
import CityDetailView from '@/components/city/CityDetailView';

interface CityPageProps {
  params: Promise<{ slug: string }>;
}

async function getCity(slug: string): Promise<City | null> {
  const query = `
    *[_type == "city" && slug.current == $slug][0] {
      _id,
      title,
      slug,
      description,
      mainImage {
        asset-> {
          _id,
          url
        },
        alt
      },
      country,
      region,
      population,
      timezone,
      currency,
      language,
      costOfLiving,
      climate,
      internetSpeed,
      nomadFriendliness,
      safetyRating,
      airQualityIndex,
      greenSpacePercentage,
      publicTransportRating,
      bikeInfrastructureRating,
      walkabilityScore,
      recyclingAvailability,
      renewableEnergyUsage,
      featuredListings[]-> {
        _id,
        title,
        slug,
        mainImage {
          asset-> {
            _id,
            url
          },
          alt
        },
        listingType,
        address,
        priceRange,
        rating
      },
      seo {
        title,
        description,
        keywords
      }
    }
  `;

  try {
    const city = await sanity.fetch(query, { slug });
    return city;
  } catch (error) {
    console.error('Error fetching city:', error);
    return null;
  }
}

export async function generateMetadata({ params }: CityPageProps): Promise<Metadata> {
  const { slug } = await params;
  const city = await getCity(slug);

  if (!city) {
    return {
      title: 'City Not Found - Sustainable Digital Nomads Directory',
      description: 'The requested city could not be found.',
    };
  }

  const seoTitle = city.seo?.title || `${city.title} - Sustainable Digital Nomads Directory`;
  const seoDescription = city.seo?.description || city.description || `Discover sustainable co-working spaces, accommodations, and eco-friendly venues in ${city.title}. Find the perfect digital nomad destination with our comprehensive city guide.`;

  return {
    title: seoTitle,
    description: seoDescription,
    keywords: city.seo?.keywords,
    openGraph: {
      title: seoTitle,
      description: seoDescription,
      images: city.mainImage?.asset?.url ? [{ url: city.mainImage.asset.url }] : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: seoTitle,
      description: seoDescription,
      images: city.mainImage?.asset?.url ? [city.mainImage.asset.url] : [],
    },
  };
}

export default async function CityPage({ params }: CityPageProps) {
  const { slug } = await params;
  const city = await getCity(slug);

  if (!city) {
    notFound();
  }

  return <CityDetailView city={city} />;
}

export const revalidate = 3600; // Revalidate every hour