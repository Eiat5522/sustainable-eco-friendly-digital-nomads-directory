/**
 * Sanity Client Configuration
 *
 * Provides a configured Sanity client for querying content and building image URLs.
 * Handles ESM/CJS module interoperability for compatibility with both Jest (CommonJS)
 * and modern ES modules.
 *
 * Updated for Schema & TypeScript Refactoring Plan R.3 (Codegen) and R.5 (Image Model)
 *
 * @module sanity/client
 *
 * @example
 * ```typescript
 * import { client, urlFor } from '@/lib/sanity/client';
 *
 * // Query content
 * const listings = await client.fetch('*[_type == "listing"][0...10]');
 *
 * // Build image URLs
 * const imageUrl = urlFor(listing.image).width(800).height(600).url();
 * ```
 */

import type { ClientConfig, ClientPerspective } from '@sanity/client';
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

/**
 * Sanity client factory function.
 *
 * Robustly handles CJS/ESM module interop issues, which can cause Jest errors.
 * Attempts to use the named export from the namespace (works in ESM),
 * and falls back to the `default` property if wrapped by a CJS environment like Jest.
 */
export const createClient = resolvedCreateClient;

// FORTEST: Use placeholder values when env vars are missing and DISABLE_SANITY is true
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'placeholder-project-id';
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'placeholder-dataset';
const token =
  process.env.SANITY_API_READ_TOKEN || process.env.SANITY_API_TOKEN || process.env.SANITY_TOKEN;

const clientConfig: ClientConfig = {
  projectId,
  dataset,
  apiVersion: '2024-01-01',
  useCdn: false, // Ensure fresh data for server-side logic
  // IMPORTANT: Disable retries during build to prevent HangingPromiseRejectionError.
  // When DISABLE_SANITY is true, the stub client is used anyway, but set to 0 for consistency.
  // In production, allow retries for transient network failures.
  maxRetries:
    process.env.DISABLE_SANITY_DURING_BUILD === '1' ||
    process.env.DISABLE_SANITY_DURING_BUILD === 'true'
      ? 0
      : 3,
  ...(token ? { token, ignoreBrowserTokenWarning: true } : {}),
};

const previewClientConfig = {
  ...clientConfig,
  useCdn: false,
  perspective: 'previewDrafts',
  ...(process.env.SANITY_PREVIEW_TOKEN
    ? { token: process.env.SANITY_PREVIEW_TOKEN, ignoreBrowserTokenWarning: true }
    : {}),
} satisfies ClientConfig & { perspective: ClientPerspective };

// Allow short-circuiting Sanity network calls during build/prerender.
const DISABLE_SANITY =
  process.env.DISABLE_SANITY_DURING_BUILD === '1' ||
  process.env.DISABLE_SANITY_DURING_BUILD === 'true';

let _client: ReturnType<typeof createClient> | null = null;
if (!DISABLE_SANITY) {
  _client = createClient(clientConfig);
}
let _previewClient: ReturnType<typeof createClient> | null = null;
if (!DISABLE_SANITY) {
  _previewClient = createClient(previewClientConfig);
}

// Minimal typed interface for the Sanity client surface that this codebase uses.
type FetchFn = <T = unknown>(query: string, params?: Record<string, unknown>) => Promise<T | null>;

type ChainablePatch = {
  set: (patch: unknown) => ChainablePatch;
  setIfMissing: (patch: unknown) => ChainablePatch;
  append: (path: string, items: unknown[]) => ChainablePatch;
  commit: <T = unknown>(opts?: Record<string, unknown>) => Promise<T>;
};

interface SanityClientLike {
  fetch: FetchFn;
  getDocument: <T = unknown>(id: string) => Promise<T | null>;
  createIfNotExists: <T = unknown>(doc: T) => Promise<T>;
  patch: (id: string) => ChainablePatch;
  transaction: () => {
    patch: (id: string, cb?: (patch: { set: (value: unknown) => unknown }) => unknown) => void;
    commit: <T = unknown>(opts?: Record<string, unknown>) => Promise<T>;
  };
  delete?: (id: string) => Promise<void>;
  withConfig?: (config: Partial<ClientConfig>) => SanityClientLike;
  [key: string]: unknown;
}

const stubClient: SanityClientLike = {
  fetch: async <T = unknown>(
    _query: string,
    _params?: Record<string, unknown>
  ): Promise<T | null> => {
    return null;
  },
  getDocument: async <T = unknown>(_id: string): Promise<T | null> => null,
  createIfNotExists: async <T = unknown>(doc: T): Promise<T> => doc,
  patch: (_id: string) => ({
    set: (_: unknown) => stubClient.patch(_id),
    setIfMissing: (_: unknown) => stubClient.patch(_id),
    append: (_path: string, _items: unknown[]) => stubClient.patch(_id),
    commit: async <T = unknown>() => null as unknown as T,
  }),
  transaction: () => ({
    patch: (_id: string, _cb?: (patch: { set: (value: unknown) => unknown }) => unknown) =>
      undefined,
    commit: async <T = unknown>(_opts?: Record<string, unknown>) => null as unknown as T,
  }),
  delete: async (_id: string) => undefined,
  withConfig: (_config: Partial<ClientConfig>) => stubClient,
};

export const client: SanityClientLike = DISABLE_SANITY
  ? stubClient
  : (_client as unknown as SanityClientLike);

export const previewClient: SanityClientLike = DISABLE_SANITY
  ? stubClient
  : (_previewClient as unknown as SanityClientLike);

// CMS-only alias: export a clearly named client for Sanity CMS operations.
// IMPORTANT: This client must NOT be used for authentication or role checks.
export const cmsClient = client;

type ImageUrlBuilderModule = typeof SanityImageUrl & {
  default?: typeof SanityImageUrl;
};

const imageUrlModule = SanityImageUrl as ImageUrlBuilderModule;
const imageUrlBuilderFactory = imageUrlModule.default ?? imageUrlModule;

/**
 * Image URL builder for Sanity images.
 *
 * Provides a fluent API for building optimized image URLs from Sanity image references.
 *
 * @see {@link urlFor} for a more convenient wrapper function
 */
// Provide safe fallbacks for the image builder when Sanity is disabled.

type ImageUrlBuilder = {
  image: (source: SanityImageSource) => ImageUrlBuilder;
  width: (width: number) => ImageUrlBuilder;
  height: (height: number) => ImageUrlBuilder;
  format: (format: 'jpg' | 'pjpg' | 'png' | 'webp' | string) => ImageUrlBuilder;
  quality: (quality: number) => ImageUrlBuilder;
  fit: (fit: 'clip' | 'crop' | 'fill' | 'fillmax' | 'max' | 'scale' | 'min') => ImageUrlBuilder;
  auto: (auto: 'format') => ImageUrlBuilder;
  url: () => string;
};

let builder: ImageUrlBuilder;
let urlFor: (source: SanityImageSource) => ImageUrlBuilder;

if (DISABLE_SANITY) {
  builder = {
    image: () => builder,
    width: () => builder,
    height: () => builder,
    format: () => builder,
    quality: () => builder,
    fit: () => builder,
    auto: () => builder,
    url: () => '',
  };

  urlFor = (_source: SanityImageSource) => builder;
} else {
  builder = imageUrlBuilderFactory(
    client as unknown as Parameters<typeof imageUrlBuilderFactory>[0]
  ) as ImageUrlBuilder;
  urlFor = (source: SanityImageSource) => builder.image(source);
}

export { builder, urlFor };

/**
 * Default export for broader compatibility.
 *
 * Provides all exported members as a single object for environments
 * that prefer default imports.
 */
export function getClient(usePreview = false) {
  return usePreview ? previewClient : client;
}
const sanityClientExports = {
  createClient,
  client,
  previewClient,
  getClient,
  builder,
  urlFor,
  sanityFetch,
};

export default sanityClientExports;

// Convenience helper for manual caching + revalidation control.
// Use this for pages where you need to control Next.js caching behaviour
// (time-based, tag-based, or path-based revalidation).
export async function sanityFetch<const QueryString extends string>({
  query,
  params = {},
  revalidate = 60,
  tags = [],
}: {
  query: QueryString;
  params?: Record<string, unknown>;
  revalidate?: number | false;
  tags?: string[];
}) {
  // The underlying client.fetch accepts a third options argument which Next.js
  // will interpret for ISR when using the `next` option. Our local typed client
  // surface doesn't include it, so we cast to any for this call.
  const anyClient = client as unknown as {
    fetch: (
      q: string,
      p?: Record<string, unknown>,
      opts?: Record<string, unknown>
    ) => Promise<unknown>;
  };

  const nextOpts: Record<string, unknown> = {
    next: {
      revalidate: tags.length ? false : revalidate,
      tags,
    },
  };

  return anyClient.fetch(query, params, nextOpts) as Promise<unknown>;
}
