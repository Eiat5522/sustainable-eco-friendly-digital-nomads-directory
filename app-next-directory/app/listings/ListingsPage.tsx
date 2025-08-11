/* eslint-disable complexity */
import FeaturedListings from '@/components/listings/FeaturedListings';
import { useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { type Listing } from '@/types/listings';
import { type Listing as SanityListing } from '@/../sanity.types';
import { AppListingCard, SanityImage, SanityGalleryImage } from '@/types/appView';
import { mapSanityListingToCard } from '@/lib/listings';

// Type guards for distinguishing Listing vs SanityListing
function isLegacyListing(l: Listing | SanityListing): l is Listing {
  const anyL = l as any;
  return !!anyL && typeof anyL === 'object' && 'city' in anyL && 'address' in anyL && 'shortDescription' in anyL;
}
function isSanityListing(l: Listing | SanityListing): l is SanityListing {
  const anyL = l as any;
  return (
    !!anyL &&
    typeof anyL === 'object' &&
    typeof anyL._id === 'string' &&
    typeof anyL.name === 'string' &&
    // Sanity objects do NOT carry a `city` field
    !('city' in anyL)
  );
}
function legacyListingToCard(legacy: Listing): AppListingCard {
  const slug = legacy.slug?.current ?? '';
  const city = legacy.city
    ? {
        id: '', // legacy listings don't carry city id
        name: legacy.city.name,
        slug: legacy.city.slug?.current ?? '',
        country: undefined,
      }
    : null;

  // Helper to convert a string URL to a basic SanityImage structure
  const toSanityImage = (url: string | undefined): SanityImage | undefined => {
    if (!url) return undefined;
    return {
      _type: 'image',
      asset: {
        _ref: 'placeholder-ref', // Placeholder ref, as legacy data doesn't have it
        _type: 'reference',
        url: url,
      },
    };
  };

  // Helper to convert string URLs to SanityGalleryImage array
  const toSanityGalleryImages = (urls: string[] | undefined): SanityGalleryImage[] => {
    if (!Array.isArray(urls) || urls.length === 0) return [];
    return urls
      .filter(Boolean)
      .map((url, idx) => ({
        _type: 'image',
        // Prefix with index to reduce collision chances if duplicate URLs exist
        _key: `${idx}-${url}`,
        asset: {
          _ref: 'placeholder-ref',
          _type: 'reference',
          url: url,
        },
      }));
  };
  return {
    id: legacy._id,
    name: legacy.name,
    slug,
    city,
    ecoFocusTags: Array.isArray(legacy.ecoFocusTags)
      ? legacy.ecoFocusTags.map((t: any) => (typeof t === 'string' ? t : t?.name)).filter(Boolean)
      : [],
    digitalNomadFeatures: Array.isArray(legacy.digitalNomadFeatures) ? legacy.digitalNomadFeatures : [],
    priceRange: legacy.priceRange as AppListingCard['priceRange'],
    website: legacy.website ?? null,
    primaryImage: toSanityImage((legacy as any).primaryImage || (legacy as any).imageUrl), // Use helper
    galleryImages: toSanityGalleryImages((legacy as any).galleryImages), // Use helper
    type: legacy.type,
    shortDescription: legacy.shortDescription,
    address: legacy.address,
    category: legacy.category,
    location: legacy.location,
  };
}

  interface ListingsPageProps {
  initialListings: Array<Listing | SanityListing>;
}

export default function ListingsPage({ initialListings }: ListingsPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const category = searchParams?.get('category');
    if (category) {
      // Redirect old category URLs to search page
      const categoryMap: { [key: string]: string } = {
        'coworking': 'Coworking',
        'cafes': 'Cafe',
        'restaurants': 'Restaurant',
        'accommodation': 'Accommodation',
        'activities': 'Activities'
      };

      const searchTerm = categoryMap[category] || category;
      router.replace(`/search?q=${encodeURIComponent(searchTerm)}`);
      return;
    }
  }, [searchParams, router]);

  const featuredListings: AppListingCard[] = useMemo(
    () =>
      initialListings
        .map(l =>
          isSanityListing(l)
            ? mapSanityListingToCard(l)
            : isLegacyListing(l)
              ? legacyListingToCard(l)
              : null,
        )
        .filter(Boolean) as AppListingCard[],
    [initialListings],
  );

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Page Header */}
      <section className="text-center mb-16">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          Sustainable Listings
        </h1>
        <p className="mt-4 text-xl text-gray-500">
          Explore eco-friendly spaces for digital nomads
        </p>
      </section>
      {/* Listings Grid */}
      <section className="mb-16">
        <FeaturedListings listings={featuredListings} />
      </section>
    </main>
  );
}
