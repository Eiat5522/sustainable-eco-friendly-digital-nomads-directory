import * as SanityClient from '@sanity/client';
import SanityImageUrl from '@sanity/image-url';

// This robustly handles CJS/ESM module interop issues, which is the cause of the Jest error.
// It attempts to use the named export from the namespace, which works in ESM,
// and falls back to the `default` property if it's wrapped by a CJS environment like Jest.
export const createClient = SanityClient.createClient || (SanityClient as any).default?.createClient;

export const client = createClient({
  // Fallback to dummy values if env vars are not set, which is common in test environments
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'projectId',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'dataset',
  apiVersion: '2024-01-01',
  useCdn: false, // Typically false for tests and server-side logic
});

// This robustly handles CJS/ESM module interop issues, which is the cause of the Jest error.
// It attempts to use the 'default' export, falling back to the root module object.
// When using a direct default import, we need to check if the imported value is the function
// itself or an object with a `default` property (which can happen with some bundlers/transpilers).
const imageUrlBuilder = (SanityImageUrl as any).default || SanityImageUrl;

export const builder = imageUrlBuilder(client);