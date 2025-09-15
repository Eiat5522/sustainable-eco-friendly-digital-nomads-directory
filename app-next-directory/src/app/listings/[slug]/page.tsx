import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { client } from '@/lib/sanity/client';
import { groq } from 'next-sanity';
import { ListingDetailView } from '@/components/listings/ListingDetailView';
import type { Metadata } from 'next';
import type { ListingDetailDTO } from '@/types/dto';
import type { UserRole } from '@/types/auth';

// Define the listing query
const LISTING_QUERY = groq`
  *[_type == "listing" && slug.current == $slug][0] {
    _id,
    name,
    slug,
    mainImage {
      asset -> {
        url,
        metadata {
          dimensions
        }
      },
      alt
    },
    galleryImages[] {
      asset -> {
        url,
        metadata {
          dimensions
        }
      },
      alt
    },
    description,
    address,
    city -> {
      _id,
      name,
      slug,
      country -> {
        name,
        code
      }
    },
    website,
    amenities,
    sustainabilityFeatures,
    priceRange,
    contactInfo,
    coordinates,
    listingType
  }
`;

// Define the reviews query
const REVIEWS_QUERY = groq`
  *[_type == "review" && listing._ref == $listingId && approved == true] | order(createdAt desc) {
    _id,
    rating,
    comment,
    createdAt,
    user -> {
      _id,
      name,
      image
    }
  }
`;

async function getListing(slug: string): Promise<ListingDetailDTO | null> {
  const listing = await client.fetch(LISTING_QUERY, { slug });
  
  if (!listing) {
    return null;
  }

  // Transform to DTO format
  const listingDTO: ListingDetailDTO = {
    id: listing._id,
    name: listing.name,
    slug: listing.slug.current,
    imageUrl: listing.mainImage?.asset?.url || null,
    galleryImages: listing.galleryImages?.map((img: any) => ({
      url: img.asset?.url || '',
      alt: img.alt || '',
    })) || [],
    description: listing.description || '',
    address: listing.address || '',
    city: listing.city ? {
      id: listing.city._id,
      name: listing.city.name,
      slug: listing.city.slug.current,
      country: listing.city.country ? {
        name: listing.city.country.name,
        code: listing.city.country.code,
      } : null,
    } : null,
    website: listing.website || null,
    amenities: listing.amenities || [],
    sustainabilityFeatures: listing.sustainabilityFeatures || [],
    priceRange: listing.priceRange || 'moderate',
    contactInfo: listing.contactInfo || null,
    coordinates: listing.coordinates ? {
      lat: listing.coordinates.lat,
      lng: listing.coordinates.lng,
    } : null,
    listingType: listing.listingType || 'accommodation',
  };

  return listingDTO;
}

async function getReviews(listingId: string) {
  const reviews = await client.fetch(REVIEWS_QUERY, { listingId });
  
  return reviews.map((review: any) => ({
    id: review._id,
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt,
    user: {
      name: review.user?.name || 'Anonymous',
      image: review.user?.image || undefined,
    },
  }));
}

async function checkIsFavorited(listingId: string, userId?: string): Promise<boolean> {
  if (!userId) return false;
  
  try {
    const favorite = await client.fetch(
      `*[_type == "userFavorite" && user._ref == $userId && listing._ref == $listingId][0]`,
      { userId, listingId }
    );
    return !!favorite;
  } catch (error) {
    console.error('Failed to check favorite status:', error);
    return false;
  }
}

interface PageProps {
  params: { slug: string };
}

export default async function ListingDetailPage({ params }: PageProps) {
  // Support Next 14 (sync) and Next 15 (async) params
  const { slug } = await Promise.resolve(params);
  const session = await auth();
  
  const listing = await getListing(slug);
  
  if (!listing) {
    notFound();
  }
  
  const reviews = await getReviews(listing.id);
  
  // Check if user is signed in and get role
  const user = session?.user as { id?: string; role?: UserRole } | undefined;
  const isSignedIn = !!session && !!user?.id;
  
  // Check if listing is favorited by the user
  const isFavorited = await checkIsFavorited(listing.id, user?.id);
  
  return (
    <ListingDetailView
      listing={listing}
      reviews={reviews}
      isSignedIn={isSignedIn}
      isFavorited={isFavorited}
    />
  );
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await Promise.resolve(params);
  const listing = await getListing(slug);
  
  if (!listing) {
    return {
      title: 'Listing not found',
    };
  }
  
  return {
    title: listing.name,
    description: listing.description?.slice(0, 160) + '...',
    openGraph: {
      title: listing.name,
      description: listing.description?.slice(0, 160) + '...',
      images: listing.imageUrl ? [listing.imageUrl] : undefined,
    },
  };
}