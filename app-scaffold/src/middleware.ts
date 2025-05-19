import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { withAuth } from './lib/auth/withAuth';

export async function middleware(request: NextRequest) {
  // Update session activity for non-static, non-API routes
  if (
    !request.nextUrl.pathname.startsWith('/_next') &&
    !request.nextUrl.pathname.startsWith('/api') &&
    !request.nextUrl.pathname.startsWith('/static')
  ) {
    try {
      const sessionUpdateUrl = new URL('/api/session', request.url);
      await fetch(sessionUpdateUrl, {
        method: 'POST',
        headers: {
          'Cookie': request.headers.get('cookie') || '',
          'User-Agent': request.headers.get('user-agent') || '',
          'X-Forwarded-For': request.headers.get('x-forwarded-for') || request.ip || '',
        },
      });
    } catch (error) {
      console.error('Session update failed:', error);
    }
  }

  const pathname = request.nextUrl.pathname;

  // Admin routes protection
  if (pathname.startsWith('/admin')) {
    return withAuth(request, ['admin']);
  }

  // Venue management routes protection
  if (pathname.startsWith('/listings/manage')) {
    return withAuth(request, ['admin', 'venueOwner']);
  }

  // Profile routes protection
  if (pathname.startsWith('/profile')) {
    return withAuth(request);
  }

  // API routes that need protection
  if (pathname.startsWith('/api/restricted')) {
    return withAuth(request);
  }

  return NextResponse.next();
}

// Configure which paths should be protected by this middleware
export const config = {
  matcher: [
    '/admin/:path*',
    '/profile/:path*',
    '/listings/manage/:path*',
    '/api/restricted/:path*',
    // Add more paths that need session tracking
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
