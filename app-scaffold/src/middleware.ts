import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { withAuth } from './lib/auth/withAuth';
import { updateSessionActivity } from './middleware/session';
import { createServerTiming } from './middleware/server-timing';

export async function middleware(request: NextRequest) {
  // Update session activity for all requests
  await updateSessionActivity(request);

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
