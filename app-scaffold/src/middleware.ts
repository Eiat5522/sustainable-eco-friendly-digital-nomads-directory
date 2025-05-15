import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { withAuth } from './lib/auth/withAuth';

export async function middleware(request: NextRequest) {
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
    // This is a catch-all for any API routes that should be authenticated
    return withAuth(request);
  }
  
  // Continue with the request if no protection needed
  return NextResponse.next();
}

// Configure which paths should be protected by this middleware
export const config = {
  matcher: [
    '/admin/:path*',
    '/profile/:path*',
    '/listings/manage/:path*',
    '/api/restricted/:path*',
  ],
};
