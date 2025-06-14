import { ListingDetail } from '@/components/listings/ListingDetail';
import { notFound } from 'next/navigation';
import { getListingBySlug } from '@/lib/sanity/queries';
import { urlFor } from '@/lib/sanity/image';
import Link from 'next/link';
import Image from 'next/image';
import ImageGallery from '@/components/listings/ImageGallery'; // Import the new client component

// Define the expected shape of the listing data for this page
interface ListingPageProps {
  params: {
    slug: string;
  };
}

// Define a more specific type for the listing data returned by Sanity
// This should align with your getListingBySlug query and Sanity schema
interface SanityListingData {
  _id: string;
  name: string;
  slug: string;
  description_short?: string;
  descriptionLong?: any; // Or string if it's plain text, or a specific type for portable text
  category?: string;
  primaryImage?: { asset?: { _id: string, url: string } }; // Adjusted to match common Sanity structure
  galleryImages?: Array<{ asset?: { _id: string }, alt?: string }>; // Array of Sanity image objects
  city?: string; // This is 'city->title' from the query
  // Add other fields from your 'listingFields' and specific category details
  website?: string;
  contact_email?: string;
  contact_phone?: string;
  price_range?: string;
  eco_features?: string[]; // Assuming these are from ecoTags
  amenities?: string[]; // Assuming these are from digital_nomad_features
  reviews?: Array<{ rating: number; comment: string; _createdAt: string; author: { name: string } }>;
  // Potentially other fields like addressString, openingHours, etc.
  [key: string]: any; // Allow other properties
}


export const revalidate = 60; // ISR every minute

async function getListingData(slug: string): Promise<SanityListingData | null> {
  const listing = await getListingBySlug(slug);
  return listing as SanityListingData | null; // Cast to the more specific type
}

export default async function ListingPage({ params }: ListingPageProps) {
  const listingData = await getListingData(params.slug);

  if (!listingData) {
    notFound();
  }
  
  let primaryImageUrl = '/placeholder-city.jpg'; // Default fallback
  if (listingData.primaryImage?.asset?._id) {
    const builtUrl = urlFor(listingData.primaryImage.asset._id)?.url();
    if (builtUrl) {
      primaryImageUrl = builtUrl;
    }
  }

  // Adapt data for ListingDetail component
  const adaptedListing = {
    name: listingData.name || "Unnamed Listing",
    description_short: listingData.description_short || "",
    description_long: listingData.descriptionLong || "", // Assuming descriptionLong is HTML or needs processing
    category: listingData.category || "Uncategorized",
    eco_features: listingData.ecoTags || [], // from listingFields alias
    amenities: listingData.digital_nomad_features || [], // from listingFields alias
    primary_image_url: primaryImageUrl,
    gallery_images: listingData.galleryImages
      ?.map((img) => (img.asset?._id ? urlFor(img.asset._id)?.url() : null))
      .filter((url): url is string => !!url) || [],
    city: { 
      name: listingData.city || "Unknown City", 
      country: "" // Country is not directly on listingData, might need separate fetch or schema change
    },
    website: listingData.website,
    contact_email: listingData.contactInfo?.email, // Adjust based on actual structure
    contact_phone: listingData.contactInfo?.phone, // Adjust based on actual structure
    price_range: listingData.price_range, // This might be part of category specific details
    reviews: listingData.reviews?.map(r => ({
        rating: r.rating,
        comment: r.comment,
        _createdAt: r._createdAt,
        author: r.author?.name || "Anonymous"
    })) || [],
    // Ensure all other fields expected by ListingDetail are present or handled
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <ListingDetail listing={adaptedListing} />
      
      <ImageGallery images={listingData.galleryImages} listingName={listingData.name || "Listing"} />

      {/* Call to Action */}
      <div className="mt-12 py-8 text-center bg-gray-100 dark:bg-gray-700 rounded-lg">
        <h2 className="text-3xl font-semibold text-gray-800 dark:text-white mb-4">
          Ready to Explore More?
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-2xl mx-auto">
          Sign up to get access to exclusive deals, save your favorite spots, and join a community of eco-conscious travelers.
        </p>
        <Link
          href="/signup" // Placeholder
          className="inline-block bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-10 rounded-lg text-xl transition duration-300 ease-in-out transform hover:scale-105"
        >
          Sign Up Now
        </Link>
      </div>
    </div>
  );
}
