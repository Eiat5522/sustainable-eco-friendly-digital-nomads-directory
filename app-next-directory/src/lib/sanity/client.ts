import { createClient } from '@sanity/client';
import imageUrlBuilder from '@sanity/image-url';
import type { SanityImageSource } from '@sanity/image-url/lib/types/types';

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'sc70w3cr';
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';

console.log('Initializing Sanity client with:', { projectId, dataset });

export const client = createClient({
  projectId,
  dataset,
  apiVersion: '2024-05-16',
  useCdn: false,
});

// Set up preview client
export const previewClient = createClient({
  projectId,
  dataset,
  apiVersion: '2024-05-16',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
});

// Helper function to get the correct client
export function getClient(usePreview = false) {
  return usePreview ? previewClient : client;
}

// Set up the image URL builder
const builder = imageUrlBuilder(client);

export function urlFor(source: SanityImageSource) {
  return builder.image(source);
}

export default client;
