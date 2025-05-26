import { createClient } from 'next-sanity'

export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2025-05-15',
  useCdn: process.env.NODE_ENV === 'production',
})

export const previewClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2025-05-15',
  useCdn: false,
  perspective: 'previewDrafts',
})

export function getClient(preview = false) {
  return preview ? previewClient : client
}

export function validatePreviewToken(token: string | null): boolean {
  return token === process.env.SANITY_PREVIEW_SECRET
}

// GROQ query helper
export async function fetchBySlug(type: string, slug: string, preview = false) {
  const client = getClient(preview)
  
  return client.fetch(
    `*[_type == $type && slug.current == $slug][0]{
      ...,
      "author": author->{name, image},
      "categories": categories[]->{title, slug},
      "related": *[_type == $type && slug.current != $slug][0..2]{
        title,
        slug,
        "imageUrl": mainImage.asset->url
      }
    }`,
    { type, slug }
  )
}

// GraphQL configuration
export const config = {
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  apiVersion: '2025-05-15',
  useCdn: process.env.NODE_ENV === 'production',
}
