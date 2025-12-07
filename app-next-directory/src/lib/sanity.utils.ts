import { createClient } from 'next-sanity';

// FORTEST: Lazy initialization to prevent module-scope errors during build
const disableSanity = process.env.DISABLE_SANITY_DURING_BUILD === '1' || process.env.DISABLE_SANITY_DURING_BUILD === 'true';

let _client: ReturnType<typeof createClient> | null = null;
let _previewClient: ReturnType<typeof createClient> | null = null;

function createStubClient() {
  return {
    fetch: async () => null,
  } as unknown as ReturnType<typeof createClient>;
}

function initClient() {
  if (_client) return _client;
  
  if (disableSanity) {
    _client = createStubClient();
    return _client;
  }
  
  _client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
    apiVersion: '2025-05-15',
    useCdn: process.env.NODE_ENV === 'production',
  });
  
  return _client;
}

function initPreviewClient() {
  if (_previewClient) return _previewClient;
  
  if (disableSanity) {
    _previewClient = createStubClient();
    return _previewClient;
  }
  
  _previewClient = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
    apiVersion: '2025-05-15',
    useCdn: false,
    perspective: 'previewDrafts',
  });
  
  return _previewClient;
}

export const client = new Proxy({} as ReturnType<typeof createClient>, {
  get(_target, prop) {
    return Reflect.get(initClient(), prop);
  },
});

export const previewClient = new Proxy({} as ReturnType<typeof createClient>, {
  get(_target, prop) {
    return Reflect.get(initPreviewClient(), prop);
  },
});

export function getClient(preview = false) {
  return preview ? initPreviewClient() : initClient();
}

export function validatePreviewToken(token: string | null): boolean {
  return token === process.env.SANITY_PREVIEW_SECRET;
}

import { cachedClient } from './sanity/cached-client';

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
    const client = getClient(true);
    return client.fetch(FETCH_BY_SLUG_QUERY, { type, slug });
  }
  return cachedClient.fetch(FETCH_BY_SLUG_QUERY, { type, slug });
}

// GraphQL configuration
export const config = {
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  apiVersion: '2025-05-15',
  useCdn: process.env.NODE_ENV === 'production',
};
