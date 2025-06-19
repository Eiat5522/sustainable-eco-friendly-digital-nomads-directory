import CityPageClient from './CityPageClient';
import { getClient } from '@/lib/sanity/client';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';

interface CityPageParams {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: CityPageParams): Promise<Metadata> {
  try {
    const { slug } = await params;
    
    // Fetch city details directly from Sanity for metadata
    const query = `*[_type == "city" && slug.current == $slug][0] {
      title,
      description,
      mainImage {
        asset->{
          url
        }
      }
    }`;

    const client = getClient();
    const city = await client.fetch(query, { slug });

    if (!city) {
      return {
        title: 'City Not Found',
        description: 'The requested city could not be found.',
      };
    }

    return {
      title: `${city.title} | Eco-Friendly Digital Nomad Destination`,
      description: city.description || `Discover sustainable and eco-friendly places to stay and work remotely in ${city.title}.`,
      openGraph: {
        images: [city.mainImage?.asset?.url || '/images/default-city.jpg'],
      },
    };
  } catch (error) {
    return {
      title: 'City Not Found',
      description: 'The requested city could not be found.',
    };
  }
}

export default async function CityPageRoute({ params }: CityPageParams) {
  try {
    const { slug } = await params;
    // Fetch city details
    const cityQuery = `*[_type == "city" && slug.current == $slug][0] {
      _id,
      title,
      "slug": slug.current,
      description,
      country,
      sustainabilityScore,
      highlights,
      mainImage {
        asset->{
          _id,
          url,
          metadata {
            dimensions {
              width,
              height
            }
          }
        }
      },
      coordinates,
      climate,
      safety,
      walkability,
      airQuality,
      internetSpeed,
      costOfLiving
    }`;

    // Fetch city listings
    const listingsQuery = `*[_type == "listing" && references(*[_type == "city" && slug.current == $citySlug][0]._id) && moderation.status == "published"] {
      _id,
      name,
      "slug": slug.current,
      description_short,
      category,
      primaryImage {
        asset->{
          _id,
          url,
          metadata {
            dimensions {
              width,
              height
            }
          }
        }
      },
      ecoTags,
      rating,
      priceRange,
      location,
      digital_nomad_features
    }`;

    const client = getClient();
      const [city, listings] = await Promise.all([
      client.fetch(cityQuery, { slug }),
      client.fetch(listingsQuery, { citySlug: slug })
    ]);

    if (!city) {
      notFound();
    }

    return <CityPageClient city={city} listings={listings} />;
  } catch (error) {
    console.error('Error fetching city data:', error);
    notFound();
  }
}
