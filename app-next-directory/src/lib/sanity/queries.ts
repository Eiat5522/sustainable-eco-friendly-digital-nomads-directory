import { unstable_cache } from 'next/cache';
import { client } from './client';

// Cache featured listings for 1 hour, revalidate with tag
const getCachedFeaturedListings = unstable_cache(
  async (limit: number) => {
    const query = `*[_type == "listing" && moderation.featured == true && moderation.status == "published"] | order(_createdAt desc)[0...$limit] {
      _id,
      name,
      "slug": slug.current,
      "primaryImage": primaryImage{
        ...,
        asset->
      },
      galleryImages[]{
        ...,
        asset->
      },
      location,
      "city": city->{
        _id,
        name,
        country
      },
      priceRange
    }`;
    return await client.fetch(query, { limit });
  },
  ['featured-listings'],
  { revalidate: 3600, tags: ['featured-listings'] }
);

// Cache cities for 1 hour, revalidate with tag
const getCachedAllCities = unstable_cache(
  async () => {
    const query = `*[_type == "city"] {
      _id,
      title,
      "slug": slug.current,
      country,
      description,
      sustainabilityScore,
      highlights,
      "primaryImage": primaryImage {
        asset->{
          _ref,
          _id,
          url,
          metadata {
            dimensions {
              width,
              height
            }
          }
        }
      }
    }`;
    return await client.fetch(query);
  },
  ['all-cities'],
  { revalidate: 3600, tags: ['cities'] }
);

// Cache eco tags for 24 hours (static data)
const getCachedEcoTags = unstable_cache(
  async () => {
    const query = `*[_type == "ecoTag"] {
      _id,
      name,
      "slug": slug.current,
      description
    }`;
    return await client.fetch(query);
  },
  ['eco-tags'],
  { revalidate: 86400, tags: ['eco-tags'] }
);

async function getListingBySlug(slug: string, _preview = false) {
  const sanityClient = client;

  const query = `*[_type=="listing" && slug.current==$slug][0]{
    _id, name,
    "slug": slug.current,
    "city": city->{ "_id": _id, name, "slug": slug.current, country },
    "ecoTags": ecoFocusTags[]->name,
    "nomadFeatures": digitalNomadFeatures[]->name,
    contactPhone, contactEmail, website,
    priceRange, shortDescription, longDescription,

    coworkingDetails: coworking_details{
      capacity,
      pricingPlans[]{ type, price, period },
      openingHours[]{ day, opens, closes }
    },
    accommodationDetails: accommodation_details{
      pricePerNightThb{ min, max },
      openingHours[]{ day, opens, closes }
    },
    cafeDetails: cafe_details{
      openingHours[]{ day, opens, closes }
    },
    amenities: amenities[]-> {
      _id,
      name,
      description,
      badge {
        asset->{url}
      }
    }
  }`;

  return await sanityClient.fetch(query, { slug });
}

// Get all available cities for filtering (uses cached version)
async function getAllCities(_preview = false) {
  return getCachedAllCities();
}

// Get all eco focus tags for filtering (uses cached version)
async function getAllEcoTags(_preview = false) {
  return getCachedEcoTags();
}

// Get latest blog posts
async function getLatestBlogPosts(limit = 3, _preview = false) {
  const sanityClient = client;

  const query = `*[_type == "blogPost"] | order(_createdAt desc)[0...$limit] {
    _id,
    title,
    "slug": slug.current,
    excerpt,
    "primaryImage": primaryImage,
    _createdAt,
    "author": author->name
  }`;

  return await sanityClient.fetch(query, { limit: limit - 1 });
}

// Get featured listings (uses cached version)
async function getFeaturedListings(limit = 10, _preview = false) {
  return getCachedFeaturedListings(limit);
}

// Export all functions
export { getAllCities, getAllEcoTags, getLatestBlogPosts, getListingBySlug, getFeaturedListings };

// Additional alias export
export const getCity = getListingBySlug;
