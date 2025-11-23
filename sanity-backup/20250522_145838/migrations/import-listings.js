/**
 * Data Migration Script for Sanity CMS
 * 
 * This script imports existing listings from listings.json into the Sanity CMS.
 * Run this script with:
 * node sanity/migrations/import-listings.js
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@sanity/client'
import { v4 as uuidv4 } from 'uuid'

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Sanity client configuration
const client = createClient({
  projectId: 'your-project-id', // Replace with your Sanity project ID
  dataset: 'production',
  token: process.env.SANITY_TOKEN, // Set this in your environment variables
  apiVersion: '2023-05-03',
  useCdn: false
})

// Read the listings JSON file
const listingsPath = path.join(__dirname, '../../src/data/listings.json')
const listings = JSON.parse(fs.readFileSync(listingsPath, 'utf8'))

console.log(`Found ${listings.length} listings to import...`)

// Function to create slug from string
const createSlug = str => 
  str.toLowerCase()
     .replace(/\s+/g, '-')
     .replace(/[^a-z0-9-]/g, '')
     .replace(/-+/g, '-')
     .replace(/^-|-$/g, '')

// Function to create cities in Sanity
const createCities = async () => {
  console.log('Creating cities...')
  
  // Get unique cities from listings
  const cities = [...new Set(listings.map(listing => listing.city))]
  
  const cityDocs = []
  
  for (const cityName of cities) {
    // Check if city already exists
    const existingCity = await client.fetch(
      `*[_type == "city" && name == $cityName][0]`,
      { cityName }
    )
    
    if (!existingCity) {
      const cityDoc = {
        _type: 'city',
        name: cityName,
        slug: {
          _type: 'slug',
          current: createSlug(cityName)
        }
      }
      
      const createdCity = await client.create(cityDoc)
      cityDocs.push(createdCity)
      console.log(`Created city: ${cityName}`)
    } else {
      cityDocs.push(existingCity)
      console.log(`City already exists: ${cityName}`)
    }
  }
  
  return cityDocs
}

// Function to create eco tags in Sanity
const createEcoTags = async () => {
  console.log('Creating eco tags...')
  
  // Get unique eco tags from listings
  const allTags = listings.flatMap(listing => listing.eco_focus_tags || [])
  const uniqueTags = [...new Set(allTags)]
  
  const tagDocs = []
  
  for (const tagName of uniqueTags) {
    // Check if tag already exists
    const existingTag = await client.fetch(
      `*[_type == "ecoTag" && name == $tagName][0]`,
      { tagName }
    )
    
    if (!existingTag) {
      const tagDoc = {
        _type: 'ecoTag',
        name: tagName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        slug: {
          _type: 'slug',
          current: tagName
        }
      }
      
      const createdTag = await client.create(tagDoc)
      tagDocs.push(createdTag)
      console.log(`Created eco tag: ${tagName}`)
    } else {
      tagDocs.push(existingTag)
      console.log(`Eco tag already exists: ${tagName}`)
    }
  }
  
  return tagDocs
}

// Function to create nomad features in Sanity
const createNomadFeatures = async () => {
  console.log('Creating digital nomad features...')
  
  // Get unique nomad features from listings
  const allFeatures = listings.flatMap(listing => listing.digital_nomad_features || [])
  const uniqueFeatures = [...new Set(allFeatures)]
  
  const featureDocs = []
  
  for (const featureName of uniqueFeatures) {
    // Check if feature already exists
    const existingFeature = await client.fetch(
      `*[_type == "nomadFeature" && name == $featureName][0]`,
      { featureName }
    )
    
    if (!existingFeature) {
      const featureDoc = {
        _type: 'nomadFeature',
        name: featureName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        slug: {
          _type: 'slug',
          current: featureName
        }
      }
      
      const createdFeature = await client.create(featureDoc)
      featureDocs.push(createdFeature)
      console.log(`Created nomad feature: ${featureName}`)
    } else {
      featureDocs.push(existingFeature)
      console.log(`Nomad feature already exists: ${featureName}`)
    }
  }
  
  return featureDocs
}

// Main function to run the migration
const migrateData = async () => {
  try {
    // Create supporting content first
    const cities = await createCities()
    const ecoTags = await createEcoTags()
    const nomadFeatures = await createNomadFeatures()
    
    // Create a map for looking up references
    const cityMap = new Map(cities.map(city => [city.name, { _type: 'reference', _ref: city._id }]))
    const ecoTagMap = new Map(ecoTags.map(tag => [
      tag.slug.current,
      { _type: 'reference', _ref: tag._id }
    ]))
    const nomadFeatureMap = new Map(nomadFeatures.map(feature => [
      feature.slug.current,
      { _type: 'reference', _ref: feature._id }
    ]))
    
    console.log('Importing listings...')
    
    // Process each listing
    for (const listing of listings) {
      // Generate a slug if the id is a placeholder
      const slugBase = listing.id.includes('generate-uuid-for')
        ? listing.name
        : listing.id
      
      // Transform the listing to Sanity format
      const sanityListing = {
        _type: 'listing',
        name: listing.name,
        slug: {
          _type: 'slug',
          current: createSlug(slugBase)
        },
        category: listing.category,
        city: cityMap.get(listing.city),
        addressString: listing.address_string,
        // Add coordinates if available
        ...(listing.coordinates.latitude && listing.coordinates.longitude) && {
          coordinates: {
            _type: 'geopoint',
            lat: listing.coordinates.latitude,
            lng: listing.coordinates.longitude
          }
        },
        descriptionShort: listing.description_short,
        descriptionLong: [
          {
            _type: 'block',
            style: 'normal',
            _key: uuidv4(),
            markDefs: [],
            children: [
              {
                _type: 'span',
                text: listing.description_long,
                _key: uuidv4(),
                marks: []
              }
            ]
          }
        ],
        // Add eco focus tags references
        ecoFocusTags: (listing.eco_focus_tags || [])
          .map(tag => ecoTagMap.get(tag))
          .filter(Boolean),
        ecoNotesDetailed: listing.eco_notes_detailed,
        sourceUrls: listing.source_urls || [],
        // Add digital nomad features references
        digitalNomadFeatures: (listing.digital_nomad_features || [])
          .map(feature => nomadFeatureMap.get(feature))
          .filter(Boolean),
        lastVerifiedDate: listing.last_verified_date
      }
      
      // Add category-specific details
      if (listing.category === 'coworking' && listing.coworking_details) {
        sanityListing.coworkingDetails = {
          operatingHours: listing.coworking_details.operating_hours || '',
          pricingPlans: (listing.coworking_details.pricing_plans || []).map(plan => ({
            _key: uuidv4(),
            type: plan.type,
            priceTHB: plan.price_thb,
            priceNotes: plan.price_notes || ''
          })),
          specificAmenities: listing.coworking_details.specific_amenities_coworking || []
        }
      } else if (listing.category === 'cafe' && listing.cafe_details) {
        sanityListing.cafeDetails = {
          operatingHours: listing.cafe_details.operating_hours || '',
          priceIndication: listing.cafe_details.price_indication || '$',
          menuHighlights: listing.cafe_details.menu_highlights_cafe || [],
          wifiReliabilityNotes: listing.cafe_details.wifi_reliability_notes || ''
        }
      } else if (listing.category === 'accommodation' && listing.accommodation_details) {
        const priceRange = listing.accommodation_details.price_per_night_thb_range;
        
        sanityListing.accommodationDetails = {
          accommodationType: listing.accommodation_details.accommodation_type,
          roomTypesAvailable: listing.accommodation_details.room_types_available || [],
          specificAmenities: listing.accommodation_details.specific_amenities_accommodation || []
        }
        
        // Add price range if available
        if (typeof priceRange === 'object' && priceRange.min && priceRange.max) {
          sanityListing.accommodationDetails.priceRangeThb = {
            min: priceRange.min,
            max: priceRange.max
          }
        }
      }
      
      try {
        // Check if listing already exists
        const existingListing = await client.fetch(
          `*[_type == "listing" && name == $listingName][0]`,
          { listingName: listing.name }
        )
        
        if (!existingListing) {
          // Create the listing in Sanity
          const createdListing = await client.create(sanityListing)
          console.log(`Created listing: ${listing.name}`)
        } else {
          console.log(`Listing already exists: ${listing.name}`)
        }
      } catch (error) {
        console.error(`Error creating listing ${listing.name}:`, error)
      }
    }
    
    console.log('Migration complete!')
  } catch (error) {
    console.error('Migration failed:', error)
  }
}

// Run the migration
migrateData()
