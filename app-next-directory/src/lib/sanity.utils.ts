import { cachedClient } from './sanity/cached-client';
import { getClient as getSanityClient } from './sanity/client';

export { client, getClient, previewClient } from './sanity/client';

// GROQ query helper
const FETCH_BY_SLUG_QUERY = `*[_type == $type && slug.current == $slug][0]{
  ...,
  "author": author->{name, image},
  "categories": categories[]->{title, slug},
  "related": *[_type == $type && slug.current != $slug][0..2]{
    title,
    slug,
    "imageUrl": primaryImage.asset->url
  }
}`;

export async function fetchBySlug(type: string, slug: string, preview = false) {

  if (preview) {

    const client = await getSanityClient(true);

    return await client.fetch(FETCH_BY_SLUG_QUERY, { type, slug });

  }

  return await cachedClient.fetch(FETCH_BY_SLUG_QUERY, { type, slug });

}

export function validatePreviewToken(token: string | null): boolean {
  return token === process.env.SANITY_PREVIEW_SECRET;
}

// GraphQL configuration
export const config = {
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  apiVersion: '2025-05-15',
  useCdn: process.env.NODE_ENV === 'production',
};
