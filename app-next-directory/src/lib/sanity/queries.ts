import { getClient } from './client';

// Common field definitions
const listingFields = `
  _id,
  name,
  "slug": slug.current,
  description_short,
  category,
  "city": city->name,
  "primaryImage": primaryImage,
  "ecoTags": eco_focus_tags[]->name,
  "digital_nomad_features": digital_nomad_features[]->name,
  last_verified_date
`;

async function getAllListings(preview = false) {
  const sanityClient = getClient(preview);

  const query = `*[_type == "listing"] {
    ${listingFields}
  }`;

  return await sanityClient.fetch(query);
}

async function getListingBySlug(slug: string, preview = false) {
  const sanityClient = getClient(preview);

  const query = `*[_type == "listing" && slug.current == $slug][0] {
    ${listingFields},
    descriptionLong,
    galleryImages,
    website,
    addressString,
    openingHours,
    contactInfo,
    ecoNotesDetailed,
    sourceUrls,
    "reviews": *[_type == "review" && references(^._id)]{
      _id,
      rating,
      comment,
      author->{name}
    },
    ...select(
      category == 'coworking' => {
        "coworkingDetails": {
          operatingHours,
          pricingPlans,
          specificAmenities: specificAmenities_coworking
        }
      },
      category == 'cafe' => {
        "cafeDetails": {
          operatingHours,
          priceIndication,
          menuHighlights: menu_highlights_cafe,
          wifiReliabilityNotes
        }
      },
      category == 'accommodation' => {
        "accommodationDetails": {
          accommodationType: accommodation_type,
          pricePerNightRange: price_per_night_thb_range,
          roomTypesAvailable: room_types_available,
          specificAmenities: specific_amenities_accommodation
        }
      }
    )
  }`;

  return await sanityClient.fetch(query, { slug });
}

async function getListingsByCategory(category: string, preview = false) {
  const sanityClient = getClient(preview);

  const query = `*[_type == "listing" && category == $category] {
    ${listingFields}
  }`;

  return await sanityClient.fetch(query, { category });
}

async function getListingsByCity(cityName: string, preview = false) {
  const sanityClient = getClient(preview);

  const query = `*[_type == "listing" && city->name == $cityName] {
    ${listingFields}
  }`;

  return await sanityClient.fetch(query, { cityName });
}

// Get all available cities for filtering
async function getAllCities(preview = false) {
  const sanityClient = getClient(preview);

  const query = `*[_type == "city"] {
    _id,
    title,
    "slug": slug.current,
    country,
    description,
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
    }
  }`;

  return await sanityClient.fetch(query);
}

// Get all eco focus tags for filtering
async function getAllEcoTags(preview = false) {
  const sanityClient = getClient(preview);

  const query = `*[_type == "ecoTag"] {
    _id,
    name,
    "slug": slug.current,
    description
  }`;

  return await sanityClient.fetch(query);
}

// Search listings
async function searchListings(searchTerm: string, preview = false) {
  const sanityClient = getClient(preview);

  const query = `*[_type == "listing" && (
    name match $searchTerm ||
    descriptionShort match $searchTerm ||
    descriptionLong match $searchTerm ||
    ecoNotesDetailed match $searchTerm
  )] {
    ${listingFields}
  }`;

  return await sanityClient.fetch(query, { searchTerm: `*${searchTerm}*` });
}

// Get latest blog posts
async function getLatestBlogPosts(limit = 3, preview = false) {
  const sanityClient = getClient(preview);

  const query = `*[_type == "blogPost"] | order(_createdAt desc)[0...$limit] {
    _id,
    title,
    "slug": slug.current,
    excerpt,
    mainImage,
    _createdAt,
    "author": author->name
  }`;

  return await sanityClient.fetch(query, { limit: limit - 1 });
}

// Get featured listings for home page
async function getFeaturedListings(preview = false) {
  const sanityClient = getClient(preview);

  const query = `*[_type == "listing" && moderation.featured == true] {
    ${listingFields},
    description_short,
    "reviews": count(*[_type == "review" && references(^._id)])
  }`;

  return await sanityClient.fetch(query);
}

async function getRelatedListings(listingId: string, category: string, cityName: string, limit = 3) {
  const query = `*[_type == "listing" && _id != $listingId && (category == $category || city->name == $cityName)][0...${limit}]{
    ${listingFields}
  }`

  return await getClient().fetch(query, { listingId, category, cityName })
}

// Export all functions
export {
  getAllCities,
  getAllEcoTags,
  getAllListings,
  getFeaturedListings,
  getLatestBlogPosts,
  getListingBySlug,
  getListingsByCategory,
  getListingsByCity,
  searchListings
};

// Additional alias export
export const getCity = getListingBySlug
