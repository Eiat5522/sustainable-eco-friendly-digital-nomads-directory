import { Breadcrumbs } from '@/components/Breadcrumbs';
import { ImageGallery } from '@/components/listings/ImageGallery';
import { ListingDetail } from '@/components/listings/ListingDetail';
import { RelatedListings } from '@/components/listings/RelatedListings';
import { getClient } from '@/lib/sanity/client';
import { Metadata, ResolvingMetadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface SanityImage {
  asset: {
    url: string;
    metadata: {
      dimensions: {
        width: number;
        height: number;
      };
      alt?: string;
    };
  };
}

interface Location {
  lat: number;
  lng: number;
}

interface City {
  name: string;
  country: string;
}

interface Review {
  rating: number;
  comment: string;
  author: string;
  date: string;
}

interface Listing {
  _id: string;
  name: string;
  slug: { current: string };
  description_short: string;
  description_long: string;
  category: string;
  city: City;
  location?: Location;
  images: SanityImage[];
  primary_image_url: string;
  eco_features: string[];
  amenities: string[];
  contact_phone?: string;
  contact_email?: string;
  website?: string;
  price_range?: string;
  reviews?: Review[];
  sustainabilityScore: number;
  featured: boolean;
}

// Function to fetch all listing slugs from Sanity for generateStaticParams
async function getAllListingSlugs() {
  const client = getClient();
  const slugs = await client.fetch<Array<{ slug: { current: string } }>>(
    `*[_type == "listing" && defined(slug.current)]{ "slug": slug ,\n        featured\n      }`
  );
  return slugs.map((item) => ({
    slug: item.slug.current,
  }));
}

export async function generateStaticParams() {
  const slugs = await getAllListingSlugs();
  return slugs;
}

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  try {
    const { slug } = await params;
    // Fetch from Sanity by slug
    const sanityListing = await getClient().fetch<Listing>(
      `*[_type == "listing" && slug.current == $slug][0]{
        name,
        description_short,
        primary_image_url,
        featured
      }`,
      { slug }
    );

    if (sanityListing) {
      return {
        title: `${sanityListing.name} | Sustainable Digital Nomads Directory`,
        description: sanityListing.description_short,
        openGraph: {
          type: 'website',
          title: sanityListing.name,
          description: sanityListing.description_short,
          images: [sanityListing.primary_image_url],
        },
        twitter: {
          card: 'summary_large_image',
          title: sanityListing.name,
          description: sanityListing.description_short,
          images: [sanityListing.primary_image_url],
        },
      };
    }

    // If no listing is found by slug, return 404
    return notFound();
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: 'Listing | Sustainable Digital Nomads Directory',
      description: 'View details about this eco-friendly listing.'
    };
  }
}

export default async function ListingPage({ params }: Props) {
  try {
    const { slug } = await params;
    // Fetch from Sanity by slug
    const sanityListing = await getClient().fetch<Listing>(
      `*[_type == "listing" && slug.current == $slug][0]{
        _id,
        name,
        slug,
        description_short,
        description_long,
        category,
        city->{name, country},
        location,
        images[]{
          asset->{
            url,
            metadata
          }
        },
        "primary_image_url": images[0].asset->url,
        eco_features,
        amenities,
        contact_phone,
        contact_email,
        website,
        price_range,
        reviews[]{
          rating,
          comment,
          author,
          "date": _createdAt
        },
        sustainabilityScore,
        featured
      }`,
      { slug }
    );

    if (sanityListing) {
      console.log("Fetched Sanity Listing:", JSON.stringify(sanityListing, null, 2));
      // Render Sanity listing
      return (
        <main className="container mx-auto py-12 px-4 sm:px-6">
          <Breadcrumbs
            segments={[
              { name: 'Listings', href: '/listings' },
              { name: sanityListing.name, href: `/listings/${slug}` },
            ]}
          />

          <article className="bg-stone-50 dark:bg-slate-800 p-6 sm:p-8 rounded-lg shadow-lg">
            {sanityListing.images && sanityListing.images.length > 0 && (
              <div className="mb-8">
                <ImageGallery
                  images={sanityListing.images.map(img => img.asset.url)}
                  alt={`Photos of ${sanityListing.name}`}
                />
              </div>
            )}

            <ListingDetail listing={{
              ...sanityListing,
              gallery_images: sanityListing.images?.map(img => img.asset.url) || [],
              reviews: sanityListing.reviews?.map(review => ({
                ...review,
                _createdAt: review.date
              })) || []
            }} />
          </article>

          <RelatedListings
            currentSlug={slug}
            category={sanityListing.category}
            cityName={sanityListing.city.name}
          />
        </main>
      );
    }

    // If no listing is found, return 404
    return notFound();
  } catch (error) {
    console.error("Error rendering listing:", error);
    return (
      <main className="container mx-auto py-12 px-4 sm:px-6">
        <h1 className="text-3xl font-bold mb-4">An error occurred</h1>
        <p>We encountered an error loading this listing. Please try again later.</p>
        <Link href="/listings" className="text-emerald-600 hover:underline mt-4 inline-block">
          ← Back to all listings
        </Link>
      </main>
    );
  }
}
