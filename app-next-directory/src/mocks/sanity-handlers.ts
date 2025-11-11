import { http, HttpResponse } from 'msw'
import { createTestData } from '@/tests/helpers/test-data'
import type { Listing } from '@/types/sanity'

const data = createTestData()

/**
 * MSW handlers for Sanity API requests
 * These intercept requests to https://{projectId}.api.sanity.io/*
 */
export const sanityHandlers = [
  // Sanity query endpoint - handles GROQ queries
  http.get('https://:projectId.api.sanity.io/v:apiVersion/data/query/:dataset', ({ request }) => {
    const url = new URL(request.url)
    const query = url.searchParams.get('query') || ''
    
    
    // Parse the GROQ query to determine what to return
    // For search queries, return listings
    if (query.includes('_type == "listing"')) {
      // Check if it's a count query
      if (query.includes('count(')) {
        return HttpResponse.json({
          ms: 10,
          query,
          result: data.listings.length
        })
      }
      
      // Return listing results
      const results = data.listings.map((listing: Listing) => ({
        _id: listing._id,
        name: listing.name,
        slug: { current: listing.slug?.current },
        category: listing.category || listing.type,
        city: {
          _id: listing.city._id,
          name: listing.city.name,
          slug: { current: listing.city.slug?.current },
          country: listing.city.country
        },
        priceRange: listing.priceRange || 'medium',
        moderation: { status: 'published' },
        shortDescription: listing.description,
        longDescription: listing.description,
        ecoFeatures: listing.ecoFeatures || [],
        amenityNames: listing.amenities || []
      }))
      
      return HttpResponse.json({
        ms: 15,
        query,
        result: results
      })
    }
    
    // Default: return empty result
    return HttpResponse.json({
      ms: 5,
      query,
      result: []
    })
  }),
  
  // Sanity mutations endpoint (POST)
  http.post('https://:projectId.api.sanity.io/v:apiVersion/data/mutate/:dataset', () => {
    return HttpResponse.json({
      transactionId: 'mock-transaction-id',
      results: []
    })
  }),
]

export default sanityHandlers
