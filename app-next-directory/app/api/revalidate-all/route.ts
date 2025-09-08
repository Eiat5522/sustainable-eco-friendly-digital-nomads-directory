import { revalidatePath } from 'next/cache';
import { NextRequest } from 'next/server';
import { ApiResponseHandler } from '@/utils/api-response';

export async function POST(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token');

    // Validate the revalidation token
    if (!token || token !== process.env.revalidationToken) {
      return ApiResponseHandler.error('Invalid token', 401);
    }

    // Revalidate all dynamic routes
    const routesToRevalidate = [
      '/',
      '/listings',
      '/category',
      '/city'
    ];

    // Revalidate each route
    for (const route of routesToRevalidate) {
      revalidatePath(route);
    }

    return ApiResponseHandler.success({
      revalidated: true,
      routes: routesToRevalidate,
      now: Date.now()
    });
  } catch (error) {
    console.error('Error revalidating all paths:', error);
    return ApiResponseHandler.error('Error revalidating', 500);
  }
}

// Add rate limiting to prevent abuse
export const runtime = 'edge';
export const maxDuration = 5; // 5 seconds max duration
