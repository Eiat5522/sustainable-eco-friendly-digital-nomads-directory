/**
 * GROQ queries for the listings
 *
 * This file contains all the queries used to fetch listing data from Sanity
 */
import { client } from './client'

// City projection with all necessary fields
const cityProjection = `{
  _id,
  title,
  "slug": slug.current,
  country,
  description,
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
  sustainabilityScore,
  highlights
}`

// Base listing projection with fields needed for listing cards
const listingCardProjection = `{
  _id,
  name,
  "slug": slug.current,
  category,
  "city": city->name,
  descriptionShort,
  "mainImage": mainImage.asset->url,
  "ecoTags": ecoFocusTags[]->name,
  "nomadFeatures": digitalNomadFeatures[]->name
}`

// Full listing projection with all fields
const fullListingProjection = `{
  _id,
  name,
  "slug": slug.current,
  category,
  "city": city->{
    name,
    "slug": slug.current
  },
  addressString,
  descriptionShort,
  descriptionLong,
  "ecoTags": ecoFocusTags[]->{ name, "slug": slug.current },
  ecoNotesDetailed,
  sourceUrls,
  "mainImage": mainImage.asset->url,
  "galleryImages": galleryImages[].asset->url,
  "nomadFeatures": digitalNomadFeatures[]->{ name, "slug": slug.current },
  lastVerifiedDate,
  coworkingDetails,
  cafeDetails,
  accommodationDetails
}`

/**
 * Fetch all listings for the homepage
 */
export async function getAllListings({ limit = 12 } = {}) {
  return client.fetch(
    `*[_type == "listing"] | order(name asc) ${listingCardProjection} [0...${limit}]`
  )
}

/**
 * Fetch listings with optional filtering
 */
export async function getFilteredListings({
  searchQuery,
  category,
  city,
  ecoTags,
  nomadFeatures,
  minRating,
  limit = 50,
  offset = 0
} = {}) {
  // Build the filter conditions
  let filterConditions = ['_type == "listing"']

  if (searchQuery) {
    filterConditions.push(`(name match "*${searchQuery}*" || descriptionShort match "*${searchQuery}*")`)
  }

  if (category) {
    filterConditions.push(`category == "${category}"`)
  }

  if (city) {
    filterConditions.push(`city->slug.current == "${city}"`)
  }

  if (ecoTags && ecoTags.length > 0) {
    const tagConditions = ecoTags.map(tag =>
      `"${tag}" in ecoFocusTags[]->slug.current`
    )
    filterConditions.push(`(${tagConditions.join(' || ')})`)
  }

  if (nomadFeatures && nomadFeatures.length > 0) {
    const featureConditions = nomadFeatures.map(feature =>
      `"${feature}" in digitalNomadFeatures[]->slug.current`
    )
    filterConditions.push(`(${featureConditions.join(' || ')})`)
  }

  if (minRating) {
    filterConditions.push(`averageRating >= ${minRating}`)
  }

  // Combine all filters
  const filter = filterConditions.join(' && ')

  // Pagination
  const paginationParams = `[${offset}...${offset + limit}]`

  return client.fetch(
    `*[${filter}] | order(name asc) ${listingCardProjection} ${paginationParams}`
  )
}

/**
 * Get a single listing by slug
 */
export async function getListingBySlug(slug) {
  return client.fetch(
    `*[_type == "listing" && slug.current == $slug] ${fullListingProjection} [0]`,
    { slug }
  )
}

/**
 * Get a list of all cities
 */
export async function getAllCities() {
  return client.fetch(`*[_type == "city"] | order(title asc) ${cityProjection}`)
}

/**
 * Get all eco tags
 */
export async function getAllEcoTags() {
  return client.fetch(`
    *[_type == "ecoTag"] | order(name asc) {
      _id,
      name,
      "slug": slug.current,
      description
    }
  `)
}

/**
 * Get all digital nomad features
 */
export async function getAllNomadFeatures() {
  return client.fetch(`
    *[_type == "nomadFeature"] | order(name asc) {
      _id,
      name,
      "slug": slug.current,
      description
    }
  `)
}

// Get a single city by slug
export async function getCity(slug) {
  return await client.fetch(
    `*[_type == "city" && slug.current == $slug][0]{
      _id,
      title,
      "slug": slug.current,
      country,
      description,
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
      sustainabilityScore,
      highlights
    }`,
    { slug }
  )
}

// Get listings for a specific city
export async function getListingsByCity(citySlug) {
  return await client.fetch(
    `*[_type == "listing" && references(*[_type == "city" && slug.current == $citySlug]._id)]{
      _id,
      name,
      "slug": slug.current,
      category,
      "city": city->title,
      descriptionShort,
      mainImage {
        asset->{
          _id,
          url
        }
      },
      "ecoTags": ecoFocusTags[]->name,
      "nomadFeatures": digitalNomadFeatures[]->name,
      sustainabilityScore
    }`,
    { citySlug }
  )
}
