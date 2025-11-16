import { revalidatePath } from 'next/cache';
import { NextRequest } from 'next/server';
import { ApiResponseHandler } from '@/utils/api-response';
import { structuredLogger } from '@/lib/logger';
import { validateRevalidationToken } from '@/utils/revalidation-token';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  let pathParam: string | null = null;
  try {
    const token = request.nextUrl.searchParams.get('token');
    pathParam = request.nextUrl.searchParams.get('path');
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

    return ApiResponseHandler.success({
      revalidated: true,
      path: targetPath,
      now: Date.now()
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
