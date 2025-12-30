import type { SanityClient } from '@sanity/client';
import { defineLive } from 'next-sanity/live';
import { client as baseClient } from '@/lib/sanity/client';

const sanityClient = baseClient as unknown as SanityClient;
const configuredClient =
  typeof sanityClient.withConfig === 'function'
    ? sanityClient.withConfig({ apiVersion: 'v2024-08-01' })
    : sanityClient;

// Create a live-enabled client wrapper. This will be used for Visual Editing
// and the Live Content API. The README recommends exposing `SanityLive` and
// a `sanityFetch` from this module.

export const { sanityFetch, SanityLive } = defineLive({
  client: configuredClient,
  serverToken: process.env.SANITY_API_READ_TOKEN,
  browserToken: process.env.SANITY_API_READ_TOKEN,
});

export default sanityFetch;
