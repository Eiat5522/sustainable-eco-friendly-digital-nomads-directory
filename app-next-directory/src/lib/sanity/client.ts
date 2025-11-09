// Sanity client with ESM/CJS interop helpers. Tests typically mock this module.
/**
 * Sanity Client Configuration
 * 
 * Updated for Schema & TypeScript Refactoring Plan R.3 (Codegen) and R.5 (Image Model)
 * Dual compatibility for Jest (CommonJS) and ES modules with error handling
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

// This robustly handles CJS/ESM module interop issues, which is the cause of the Jest error.
// It attempts to use the named export from the namespace, which works in ESM,
// and falls back to the `default` property if it's wrapped by a CJS environment like Jest.
export const createClient = resolvedCreateClient;

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

type ImageUrlBuilderModule = typeof SanityImageUrl & {
  default?: typeof SanityImageUrl;
};

const imageUrlModule = SanityImageUrl as ImageUrlBuilderModule;
const imageUrlBuilderFactory = imageUrlModule.default ?? imageUrlModule;

export const builder = imageUrlBuilderFactory(client);

// Create a urlFor function for easier usage - supports centralized image model
export const urlFor = (source: SanityImageSource) => builder.image(source);

// Default export for broader compatibility
const sanityClientExports = {
  createClient,
  client,
  builder,
  urlFor
};

export default sanityClientExports;
