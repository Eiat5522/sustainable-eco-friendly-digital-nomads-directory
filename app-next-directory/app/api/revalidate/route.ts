import { revalidatePath } from 'next/cache';
import { NextRequest } from 'next/dist/server/web/spec-extension/request';
import { ApiResponseHandler } from '@/utils/api-response';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token');
    const path = request.nextUrl.searchParams.get('path');

    // Validate the revalidation token
    if (!token || token !== process.env.revalidationToken) {
      return ApiResponseHandler.error('Invalid token', 401);
    }

    // Validate path parameter
    if (!path) {
      return ApiResponseHandler.error('Missing path parameter', 400);
    }
    if (path.includes('://') || path.includes('..')) {
      return ApiResponseHandler.error('Invalid path parameter', 400);
    }
    const targetPath = path.startsWith('/') ? path : `/${path}`;

    // Revalidate the specific path
    revalidatePath(targetPath);

    return ApiResponseHandler.success({
      revalidated: true,
      path: targetPath,
      now: Date.now()
    });
  } catch (error) {
    console.error('Error revalidating path:', { path, error });

    return ApiResponseHandler.error('Error revalidating', 500);
  }
}
