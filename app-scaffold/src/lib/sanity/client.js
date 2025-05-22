/**
 * Sanity client configuration for the frontend
 */
import imageUrlBuilder from '@sanity/image-url'
import { createClient } from 'next-sanity'

export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
export const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2023-05-03'

// Create a client for fetching data with preview mode support
export const getClient = (preview = false) => {
  const client = createClient({
    projectId,
    dataset,
    apiVersion,
    useCdn: !preview && process.env.NODE_ENV === 'production',
    // Disable stega for now as we're not using visual editing
    stega: {
      enabled: false
    },
    perspective: preview ? 'previewDrafts' : 'published',
    token: preview ? process.env.SANITY_API_TOKEN : undefined,
  })
  return client
}

// Create the default client for general use
export const client = getClient()

// Create an image URL builder to optimize and transform images
const builder = imageUrlBuilder(client)

/**
 * Helper function to build optimized image URLs
 * @param {Object} source - The image source object from Sanity
 * @returns {Function} - Image URL builder function
 */
export function urlForImage(source) {
  return builder.image(source)
}

/**
 * Helper function to get an optimized image URL with default settings
 * @param {Object} source - The image source object from Sanity
 * @returns {string} - Optimized image URL as string
 */
export function getImageUrl(source) {
  return builder.image(source).auto('format').fit('max').url()
}

/**
 * Helper function for generating responsive image URLs with various widths
 */
export function responsiveImageUrl(source, width = 800) {
  const imageUrl = urlForImage(source)
  if (!imageUrl) {
    return null
  }
  return imageUrl.width(width).auto('format').url()
}

/**
 * Generate a complete set of responsive image URLs for srcSet
 */
export function generateImageSrcSet(source) {
  const widths = [400, 600, 800, 1200, 1600, 2000]
  if (!source?.asset?._ref) {
    return null
  }

  const baseImageUrl = urlForImage(source).auto('format')

  // Generate an array of URLs with different widths
  const srcSet = widths.map(width => ({
    url: baseImageUrl.width(width).url(),
    width: width,
  }))

  return srcSet
    .map(({ url, width }) => `${url} ${width}w`)
    .join(', ')
}
