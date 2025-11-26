/**
 * Sanity Client Configuration
 *
 * Provides a configured Sanity client for querying content and building image URLs.
 * Handles ESM/CJS module interoperability for compatibility with both Jest (CommonJS)
 * and modern ES modules.
 *
 * Updated for Schema & TypeScript Refactoring Plan R.3 (Codegen) and R.5 (Image Model)
 *
 * @module sanity/client
 *
 * @example
 * ```typescript
 * import { getSanityClient, urlFor } from '@/lib/sanity/client';
 *
 * const client = getSanityClient();
 * // Query content
 * const listings = await client.fetch('*[_type == "listing"][0...10]');
 *
 * // Build image URLs
 * const imageUrl = urlFor(listing.image).width(800).height(600).url();
 * ```
 */

import * as SanityClient from '@sanity/client';
import SanityImageUrl from '@sanity/image-url';
import type { SanityImageSource } from '@sanity/image-url/lib/types/types';

type SanityClientModule = typeof SanityClient & {
  default?: {
    createClient?: typeof SanityClient.createClient;
  };
};

const sanityClientModule = SanityClient as SanityClientModule;
const resolvedCreateClient =
  sanityClientModule.createClient ?? sanityClientModule.default?.createClient;

if (!resolvedCreateClient) {
  throw new Error('Unable to resolve Sanity createClient factory');
}

/**
 * Sanity client factory function.
 *
 * Robustly handles CJS/ESM module interop issues, which can cause Jest errors.
 * Attempts to use the named export from the namespace (works in ESM),
 * and falls back to the `default` property if wrapped by a CJS environment like Jest.
 */
export const createClient = resolvedCreateClient;

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'projectId';
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'dataset';
const token =
  process.env.SANITY_API_READ_TOKEN || process.env.SANITY_API_TOKEN || process.env.SANITY_TOKEN;

const clientConfig = {
  projectId,
  dataset,
  apiVersion: '2024-01-01',
  useCdn: false, // Ensure fresh data for server-side logic
  ...(token ? { token, ignoreBrowserTokenWarning: true } : {}),
};

let cachedClient: ReturnType<typeof createClient> | null = null;

/**
 * Returns a singleton instance of the configured Sanity client.
 * The client is lazily instantiated to prevent premature network connections
 * during module evaluation (e.g., during Next.js prerendering).
 */
export function client() {
  if (!cachedClient) {
    cachedClient = createClient(clientConfig);
  }
  return cachedClient;
}

type ImageUrlBuilderModule = typeof SanityImageUrl & {
  default?: typeof SanityImageUrl;
};

const imageUrlModule = SanityImageUrl as ImageUrlBuilderModule;
const imageUrlBuilderFactory = imageUrlModule.default ?? imageUrlModule;

/**
 * Image URL builder for Sanity images.
 *
 * Provides a fluent API for building optimized image URLs from Sanity image references.
 *
 * @see {@link urlFor} for a more convenient wrapper function
 */
export const builder = imageUrlBuilderFactory(client());

/**
 * Creates an image URL builder for a Sanity image source.
 *
 * Supports the centralized image model and provides a fluent API for transforming images.
 *
 * @param source - Sanity image reference (asset reference, image object, or asset ID)
 * @returns Image URL builder with methods like .width(), .height(), .format(), .url()
 *
 * @example
 * ```typescript
 * // Build a responsive image URL
 * const imageUrl = urlFor(listing.primaryImage)
 *   .width(800)
 *   .height(600)
 *   .format('webp')
 *   .quality(80)
 *   .url();
 *
 * // Simple usage
 * const thumbnail = urlFor(image).width(200).url();
 * ```
 */
export const urlFor = (source: SanityImageSource) => builder.image(source);



