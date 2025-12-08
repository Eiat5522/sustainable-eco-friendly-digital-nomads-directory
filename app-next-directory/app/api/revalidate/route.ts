import { revalidatePath } from 'next/cache';
import type { NextRequest } from 'next/server';
import { structuredLogger } from '@/lib/logger';
import { ApiResponseHandler } from '@/utils/api-response';
import { validateRevalidationToken } from '@/utils/revalidation-token';

// MIGRATED: Removed route-segment exports (`dynamic`, `revalidate`, `runtime`) to be
// compatible with `nextConfig.cacheComponents`. Use `use cache` / `cacheLife()`
// or server-only handlers for dynamic behaviors where needed.

export async function GET(request: NextRequest) {
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
