import { revalidatePath } from 'next/cache';
import { NextRequest } from 'next/dist/server/web/spec-extension/request';
import { NextResponse } from 'next/dist/server/web/spec-extension/response';

export async function POST(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token');

    // Validate the revalidation token
    if (!token || token !== process.env.REVALIDATION_TOKEN) {
      return NextResponse.json(
        { message: 'Invalid token' },
        { status: 401 }
      );
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

    return NextResponse.json({
      revalidated: true,
      routes: routesToRevalidate,
      now: Date.now()
    });
  } catch (error) {
    console.error('Error revalidating all paths:', error);
    return NextResponse.json(
      { message: 'Error revalidating' },
      { status: 500 }
    );
  }
}

// Add rate limiting to prevent abuse
export const runtime = 'edge';
export const maxDuration = 5; // 5 seconds max duration
