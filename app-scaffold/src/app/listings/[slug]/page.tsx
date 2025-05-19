import { Breadcrumbs } from '@/components/Breadcrumbs';
import { ImageGallery } from '@/components/listings/ImageGallery';
import { ListingDetail } from '@/components/listings/ListingDetail';
import { RelatedListings } from '@/components/listings/RelatedListings';
import { getListingImages } from '@/lib/getListingImages.js';
import { getListingById } from '@/lib/listings';
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
}

type Props = {
  params: { slug: string };
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  try {
    // First try to fetch from Sanity
    const sanityListing = await getClient().fetch<Listing>(
      `*[_type == "listing" && slug.current == $slug][0]{
        name,
        description_short,
        primary_image_url,
      }`,
      { slug: params.slug }
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
          authors: ['Sustainable Digital Nomads Directory'],
        },
        twitter: {
          card: 'summary_large_image',
          title: sanityListing.name,
          description: sanityListing.description_short,
          images: [sanityListing.primary_image_url],
        },
      };
    }

    // If not found in Sanity, try to get by ID (assuming the slug might actually be an ID)
    const idListing = getListingById(params.slug);
    if (idListing) {
      return {
        title: `${idListing.name} | Sustainable Digital Nomads Directory`,
        description: idListing.description_short,
      };
    }

    // Not found in either source
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
    // First try to fetch from Sanity
    const sanityListing = await getClient().fetch<Listing>(
      `*[_type == "listing" && slug.current == $slug][0]{
        ...,
        city->{name, country},
        images[]{
          asset->{
            url,
            metadata
          }
        }
      }`,
      { slug: params.slug }
    );

    if (sanityListing) {
      // Render Sanity listing
      return (
        <main className="container mx-auto py-12 px-4 sm:px-6">
          <Breadcrumbs
            items={[
              { label: 'Listings', href: '/listings' },
              { label: sanityListing.name, href: `/listings/${params.slug}` },
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

            <ListingDetail listing={sanityListing} />
          </article>

          <RelatedListings
            slug={params.slug}
            category={sanityListing.category}
            cityName={sanityListing.city.name}
          />
        </main>
      );
    }

    // If not found in Sanity, try to get by ID
    const idListing = getListingById(params.slug);
    if (idListing) {
      const images = getListingImages(params.slug);

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
                  {idListing.name}
                </h1>
                <span className={`inline-block px-3 py-1 text-sm font-semibold rounded-full ${
                  idListing.category === 'coworking'
                    ? 'bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-100'
                    : idListing.category === 'accommodation'
                    ? 'bg-teal-100 text-teal-800 dark:bg-teal-800 dark:text-teal-100'
                    : idListing.category === 'cafe'
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-800 dark:text-amber-100'
                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-800 dark:text-emerald-100'
                }`}>
                  {idListing.category.charAt(0).toUpperCase() + idListing.category.slice(1)}
                </span>
              </div>
            </div>

            {/* Image Gallery */}
            {images && images.length > 0 && (
              <div className="mb-8">
                <ImageGallery
                  images={images}
                  alt={`Photos of ${idListing.name}`}
                />
              </div>
            )}

            {/* Content adapted from [id]/page.tsx */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2">
                <div className="prose dark:prose-invert max-w-none">
                  <h2 className="text-2xl font-bold mb-4 text-slate-800 dark:text-slate-200">About This Place</h2>
                  <p className="text-slate-600 dark:text-slate-300">{idListing.description_long || idListing.description_short}</p>
                </div>
              </div>

              <div>
                <div className="bg-white dark:bg-slate-700 p-6 rounded-lg shadow">
                  <h3 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-200">Location</h3>
                  <p className="text-slate-600 dark:text-slate-300">{idListing.city?.name}, {idListing.city?.country}</p>
                </div>
              </div>
            </div>
          </article>
        </main>
      );
    }

    // Not found in either source
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
