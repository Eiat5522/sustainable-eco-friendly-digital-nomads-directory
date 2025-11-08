import { client } from './client';

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

// Get all available cities for filtering
async function getAllCities(_preview = false) {
  const sanityClient = client;

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

  return await sanityClient.fetch(query);
}

// Get all eco focus tags for filtering
async function getAllEcoTags(_preview = false) {
  const sanityClient = client;

  const query = `*[_type == "ecoTag"] {
    _id,
    name,
    "slug": slug.current,
    description
  }`;

  return await sanityClient.fetch(query);
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

async function getFeaturedListings(limit = 10, _preview = false) {
  const sanityClient = client;

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

  return await sanityClient.fetch(query, { limit });
}

// Export all functions
export {
  getAllCities,
  getAllEcoTags,
  getLatestBlogPosts,
  getListingBySlug,
  getFeaturedListings,
};

// Additional alias export
export const getCity = getListingBySlug;



