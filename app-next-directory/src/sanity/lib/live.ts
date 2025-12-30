import { defineLive } from 'next-sanity/live';
import { client as baseClient } from '@/lib/sanity/client';

// Create a live-enabled client wrapper. This will be used for Visual Editing
// and the Live Content API. The README recommends exposing `SanityLive` and
// a `sanityFetch` from this module.

export const { sanityFetch, SanityLive } = defineLive({
  client: baseClient.withConfig ? baseClient.withConfig({ apiVersion: 'v2024-08-01' }) : baseClient,
  serverToken: process.env.SANITY_API_READ_TOKEN,
  browserToken: process.env.SANITY_API_READ_TOKEN,
});

export default sanityFetch;
