/**
 * Sanity Client Configuration
 * 
 * Updated for Schema & TypeScript Refactoring Plan R.3 (Codegen) and R.5 (Image Model)
 * Dual compatibility for Jest (CommonJS) and ES modules with error handling
 */

import * as SanityClient from '@sanity/client';
import SanityImageUrl from '@sanity/image-url';

// This robustly handles CJS/ESM module interop issues, which is the cause of the Jest error.
// It attempts to use the named export from the namespace, which works in ESM,
// and falls back to the `default` property if it's wrapped by a CJS environment like Jest.
export const createClient = SanityClient.createClient || (SanityClient as any).default?.createClient;

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'projectId';
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'dataset';
const token = process.env.SANITY_API_READ_TOKEN || process.env.SANITY_API_TOKEN || process.env.SANITY_TOKEN;

const clientConfig = {
  projectId,
  dataset,
  apiVersion: '2024-01-01',
  useCdn: false, // Ensure fresh data for server-side logic
  ...(token
    ? { token, ignoreBrowserTokenWarning: true }
    : {}),
};

export const client = createClient(clientConfig);

// This robustly handles CJS/ESM module interop issues, which is the cause of the Jest error.
// It attempts to use the 'default' export, falling back to the root module object.
// When using a direct default import, we need to check if the imported value is the function
// itself or an object with a `default` property (which can happen with some bundlers/transpilers).
const imageUrlBuilder = (SanityImageUrl as any).default || SanityImageUrl;

export const builder = imageUrlBuilder(client);

// Create a urlFor function for easier usage - supports centralized image model
export const urlFor = (source: any) => builder.image(source);

// Default export for broader compatibility
export default {
  createClient,
  client,
  builder,
  urlFor
};
