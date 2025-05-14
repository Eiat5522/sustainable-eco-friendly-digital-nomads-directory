/**
 * Sanity client configuration for the frontend
 */
import { createClient } from 'next-sanity'
import imageUrlBuilder from '@sanity/image-url'
import { draftMode } from 'next/headers'

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
    // Only include stega in development for visual editing
    stega: process.env.NODE_ENV === 'development',
    perspective: preview ? 'previewDrafts' : 'published',
    token: preview ? process.env.SANITY_API_TOKEN : undefined,
  })
  return client
}

// Get the correct client based on preview mode
export const client = getClient(draftMode().isEnabled)

// Set up image URL builder
const builder = imageUrlBuilder(client)

/**
 * Helper function for generating image URLs with automatic width and quality optimizations
 */
export function urlForImage(source) {
  if (!source?.asset?._ref) {
    return null
  }
  return builder.image(source)
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
