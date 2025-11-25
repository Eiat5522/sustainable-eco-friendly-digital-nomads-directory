import { revalidatePath } from 'next/cache';
import type { NextRequest } from 'next/server';
import { getRequestContext, structuredLogger } from '@/lib/logger';
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
    const token = request.nextUrl.searchParams.get('token');

    // Validate the revalidation token
    if (!validateRevalidationToken(token)) {
      return ApiResponseHandler.error('Invalid token', 401);
    }

    // Revalidate all dynamic routes
    const routesToRevalidate = ['/', '/listings', '/category', '/city'];

    // Revalidate each route
    const revalidate = _testControl?.revalidatePathOverride ?? revalidatePath;
    for (const route of routesToRevalidate) {
      revalidate(route);
    }

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
// MIGRATED: Removed export const runtime = 'edge' (incompatible with Cache Components)
export const maxDuration = 5; // 5 seconds max duration
