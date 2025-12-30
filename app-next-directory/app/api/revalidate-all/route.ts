import type { NextRequest } from 'next/server';
import { getRequestContext, structuredLogger } from '@/lib/logger';
import { REVALIDATE_ALL_ROUTES, revalidatePaths } from '@/lib/revalidation';
import { ApiResponseHandler } from '@/utils/api-response';
import { validateRevalidationToken } from '@/utils/revalidation-token';

type RevalidateFn = (path: string) => void;

const isTestEnv = process.env.NODE_ENV === 'test';

type RevalidateAllTestControl = {
  revalidatePathOverride?: RevalidateFn;
};

const _testControl: RevalidateAllTestControl | undefined = isTestEnv
  ? {
      revalidatePathOverride: undefined,
    }
  : undefined;

if (process.env.NODE_ENV === 'test') {
  (module.exports as Record<string, unknown>)._testControl = _testControl;
}

export async function POST(request: NextRequest) {
  try {
    // Parse search params from request URL to avoid nextUrl.searchParams prerender bailout
    const url = new URL(request.url);
    const token = url.searchParams.get('token');

    // Validate the revalidation token
    if (!validateRevalidationToken(token)) {
      return ApiResponseHandler.error('Invalid token', 401);
    }

    const routesToRevalidate = [...REVALIDATE_ALL_ROUTES];

    const revalidate = _testControl?.revalidatePathOverride;
    revalidatePaths(routesToRevalidate, revalidate);

    // Access Date.now() after reading uncached data (revalidatePath) to avoid prerender bailout
    return ApiResponseHandler.success({
      revalidated: true,
      routes: routesToRevalidate,
      now: Date.now(),
    });
  } catch (error) {
    structuredLogger.error('Error revalidating all paths', error, {
      ...getRequestContext(request),
      component: 'api/revalidate-all',
    });
    return ApiResponseHandler.error('Error revalidating', 500);
  }
}

// Add rate limiting to prevent abuse
// MIGRATED: Removed `export const runtime` and `maxDuration` (incompatible with cacheComponents).
