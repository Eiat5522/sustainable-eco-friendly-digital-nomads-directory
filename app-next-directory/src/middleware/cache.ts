import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define cache duration options
const CACHE_DURATIONS = {
  DEFAULT: 60 * 60, // 1 hour
  LISTING: 60 * 30, // 30 minutes
  CITY: 60 * 60 * 24, // 24 hours
  CATEGORY: 60 * 60 * 12, // 12 hours
} as const;

interface CacheConfig {
  maxAge: number;
  staleWhileRevalidate?: number;
  isPrivate?: boolean;
}

/**
 * Determines if a request should be cached based on various conditions
 */
function shouldCache(request: NextRequest): boolean {
  // Don't cache if it's a preview request
  if (request.cookies.has('__previewMode')) {
    return false;
  }

  // Don't cache non-GET requests
  if (request.method !== 'GET') {
    return false;
  }

  // Don't cache API routes except specific ones
  if (request.nextUrl.pathname.startsWith('/api/') &&
      !request.nextUrl.pathname.match(/^\/api\/(listings|cities|categories)$/)) {
    return false;
  }

  return true;
}

/**
 * Gets cache configuration based on request path
 */
function getCacheConfig(request: NextRequest): CacheConfig {
  const path = request.nextUrl.pathname;

  // Listing pages
  if (path.match(/^\/listings\/[^/]+$/)) {
    return {
      maxAge: CACHE_DURATIONS.LISTING,
      staleWhileRevalidate: 60, // 1 minute
    };
  }

  // City pages
  if (path.match(/^\/city\/[^/]+$/)) {
    return {
      maxAge: CACHE_DURATIONS.CITY,
      staleWhileRevalidate: 60 * 5, // 5 minutes
    };
  }

  // Category pages
  if (path.match(/^\/category\/[^/]+$/)) {
    return {
      maxAge: CACHE_DURATIONS.CATEGORY,
      staleWhileRevalidate: 60 * 5, // 5 minutes
    };
  }

  // Default cache config
  return {
    maxAge: CACHE_DURATIONS.DEFAULT,
    staleWhileRevalidate: 60, // 1 minute
  };
}

/**
 * Generates cache control header value
 */
function getCacheControlValue(config: CacheConfig): string {
  const directives = [
    config.isPrivate ? 'private' : 'public',
    `max-age=${config.maxAge}`,
  ];

  if (config.staleWhileRevalidate) {
    directives.push(`stale-while-revalidate=${config.staleWhileRevalidate}`);
  }

  return directives.join(', ');
}

/**
 * Cache middleware for non-preview content
 */
export async function cacheMiddleware(
  request: NextRequest,
  response: NextResponse
): Promise<NextResponse> {
  // Check if request should be cached
  if (!shouldCache(request)) {
    response.headers.set('Cache-Control', 'no-store');
    return response;
  }

  // Get cache configuration
  const cacheConfig = getCacheConfig(request);

  // Set cache headers
  response.headers.set(
    'Cache-Control',
    getCacheControlValue(cacheConfig)
  );

  // Set Surrogate-Control for CDN
  response.headers.set(
    'Surrogate-Control',
    `max-age=${cacheConfig.maxAge}`
  );

  // Add Vary header to ensure proper caching
  response.headers.append('Vary', 'Cookie');

  return response;
}

/**
 * Helper function to invalidate cache for a specific path
 */
export async function invalidateCache(path: string): Promise<void> {
  try {
    // Revalidate the path using Next.js revalidation
    await fetch(`/api/revalidate?path=${encodeURIComponent(path)}`);
  } catch (error) {
    console.error(`Failed to invalidate cache for path: ${path}`, error);
  }
}

/**
 * Helper function to purge entire cache
 */
export async function purgeCache(): Promise<void> {
  try {
    await fetch('/api/revalidate-all');
  } catch (error) {
    console.error('Failed to purge cache', error);
  }
}
