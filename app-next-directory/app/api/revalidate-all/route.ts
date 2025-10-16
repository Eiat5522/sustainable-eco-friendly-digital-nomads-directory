import { revalidatePath } from 'next/cache';
import { NextRequest } from 'next/server';
import { ApiResponseHandler } from '@/utils/api-response';

type RevalidateFn = (path: string) => void;
type TokenFn = () => string | undefined;

export const testControl = {
  revalidatePathOverride: undefined as RevalidateFn | undefined,
  tokenOverride: undefined as TokenFn | undefined,
};

export async function POST(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token');
    const expectedToken = testControl.tokenOverride ? testControl.tokenOverride() : process.env.revalidationToken;

    // Validate the revalidation token
    if (!token || token !== expectedToken) {
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
    const revalidate = testControl.revalidatePathOverride ?? revalidatePath;
    for (const route of routesToRevalidate) {
      revalidate(route);
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
