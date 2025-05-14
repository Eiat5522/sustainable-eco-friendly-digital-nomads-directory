import { createClient } from 'next-sanity';
import imageUrlBuilder from '@sanity/image-url';

export const projectId = 'sc70w3cr';
export const dataset = 'production';
export const apiVersion = '2023-05-14';

export const client = createClient({
  projectId,
  dataset,
  apiVersion, // use a UTC date string
  useCdn: process.env.NODE_ENV === 'production', // use CDN in production for better performance
});

// Helper function for image URL generation
const builder = imageUrlBuilder(client);

export function urlFor(source: any) {
  return builder.image(source);
}

// For preview functionality
export const getClient = (usePreview = false) => 
  usePreview 
    ? createClient({
        projectId,
        dataset,
        apiVersion,
        useCdn: false, // During previews, we need fresh content
        token: process.env.SANITY_API_TOKEN, // Needed for preview mode
      })
    : client;
    : client;
