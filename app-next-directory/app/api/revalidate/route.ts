import { revalidatePath, revalidateTag } from 'next/cache';
import type { NextRequest } from 'next/server';
import { connection } from 'next/server';
import { structuredLogger } from '@/lib/logger';
import { ApiResponseHandler } from '@/utils/api-response';
import { validateRevalidationToken } from '@/utils/revalidation-token';

// MIGRATED: Removed route-segment exports (`dynamic`, `revalidate`, `runtime`) to be
// compatible with `nextConfig.cacheComponents`. Use `use cache` / `cacheLife()`
// or server-only handlers for dynamic behaviors where needed.

export async function GET(request: NextRequest) {
  // Signal that this route should be dynamically rendered at request time
  await connection();

  let pathParam: string | null = null;
  try {
    // Parse search params from request URL to avoid nextUrl.searchParams prerender bailout
    const url = new URL(request.url);
    const token = url.searchParams.get('token');
    pathParam = url.searchParams.get('path');

    // Validate the revalidation token
    if (!validateRevalidationToken(token)) {
      return ApiResponseHandler.error('Invalid token', 401);
    }

    // Validate path parameter
    if (!pathParam) {
      return ApiResponseHandler.error('Missing path parameter', 400);
    }
    if (pathParam.includes('://') || pathParam.includes('..')) {
      return ApiResponseHandler.error('Invalid path parameter', 400);
    }
    const targetPath = pathParam.startsWith('/') ? pathParam : `/${pathParam}`;

    // Revalidate the specific path
    revalidatePath(targetPath);

    // Access Date.now() after reading uncached data (revalidatePath) to avoid prerender bailout
    return ApiResponseHandler.success({
      revalidated: true,
      path: targetPath,
      now: Date.now(),
    });
  } catch (error) {
    structuredLogger.error('Error revalidating path', error, {
      route: '/api/revalidate',
      method: request.method,
      path: pathParam ?? undefined,
    });

    return ApiResponseHandler.error('Error revalidating', 500);
  }
}

const ALLOWED_REVALIDATION_TAGS = new Set(['featured-listings', 'cities', 'eco-tags', 'home']);
const TAG_PATTERN = /^[a-z0-9:-]+$/i;

export async function POST(request: NextRequest) {
  await connection();

  let tag: string | null = null;
  try {
    const body = (await request.json()) as { token?: string; tag?: string };
    const token = body?.token ?? null;
    tag = body?.tag ?? null;

    if (!validateRevalidationToken(token)) {
      return ApiResponseHandler.error('Invalid token', 401);
    }

    if (!tag) {
      return ApiResponseHandler.error('Missing tag parameter', 400);
    }

    if (!TAG_PATTERN.test(tag) || !ALLOWED_REVALIDATION_TAGS.has(tag)) {
      return ApiResponseHandler.error('Invalid tag parameter', 400);
    }

    revalidateTag(tag, 'max');

    return ApiResponseHandler.success({
      revalidated: true,
      tag,
      now: Date.now(),
    });
  } catch (error) {
    structuredLogger.error('Error revalidating tag', error, {
      route: '/api/revalidate',
      method: request.method,
      tag: tag ?? undefined,
    });

    return ApiResponseHandler.error('Error revalidating', 500);
  }
}
