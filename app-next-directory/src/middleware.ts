import { ACCESS_CONTROL_MATRIX, PagePermissions, UserRole } from '@/types/auth';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const secret = process.env.NEXTAUTH_SECRET;

// Edge-compatible access control function
function hasAccess(userRole: UserRole, path: string): boolean {
  if (!userRole) {
    return false;
  }

  const permissions = ACCESS_CONTROL_MATRIX[userRole];
  if (!permissions || !permissions.pages) {
    return false;
  }

  // Extract base path for permission checking
  const pathSegments = path.split('/').filter(Boolean);
  let basePathKey = pathSegments.length > 0 ? pathSegments[0] : 'home';

  const pagePermission = permissions.pages[basePathKey as keyof typeof permissions.pages] as PagePermissions | undefined;

  return pagePermission?.canView ?? false;
}

export async function middleware(request: NextRequest) {
  try {
    // Get JWT token (Edge Runtime compatible)
    const token = await getToken({ req: request, secret });
    const { pathname } = request.nextUrl;
    const isAuthenticated = !!token;
    const userRole = token?.role as UserRole | undefined;

    // Skip middleware for static files and internal Next.js routes
    if (
      pathname.startsWith('/_next') ||
      pathname.startsWith('/api/auth') ||
      pathname.includes('.') // Skip files with extensions
    ) {
      return NextResponse.next();
    }

    // Auth pages handling
    const authPages = ['/auth/signin', '/auth/signup', '/auth/error'];
    const isAuthPage = authPages.some(p => pathname.startsWith(p));

    if (isAuthPage && isAuthenticated) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Protected routes check
    const protectedPaths = ['/dashboard', '/admin', '/profile', '/settings', '/listings/manage', '/listings/create'];
    const isProtectedRoute = protectedPaths.some(path => pathname.startsWith(path));

    if (isProtectedRoute) {
      if (!isAuthenticated) {
        const signInUrl = new URL('/auth/signin', request.url);
        signInUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(signInUrl);
      }

      // Role-based access control
      if (userRole && !hasAccess(userRole, pathname)) {
        if (pathname.startsWith('/api/')) {
          return NextResponse.json(
            { error: 'Access denied' },
            { status: 403 }
          );
        }
        const homeUrl = new URL('/', request.url);
        homeUrl.searchParams.set('error', 'unauthorized_access');
        return NextResponse.redirect(homeUrl);
      }
    }

    // API routes protection
    if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth')) {
      const protectedApiPaths = ['/api/user', '/api/admin', '/api/listings'];
      const isProtectedApi = protectedApiPaths.some(path => pathname.startsWith(path));

      if (isProtectedApi && !isAuthenticated) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      if (isProtectedApi && userRole && !hasAccess(userRole, pathname)) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }
    }

    // Add security headers
    const response = NextResponse.next();
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    return response;
  } catch (error) {
    console.error('Middleware error:', error);
    return NextResponse.next();
  }
}

// Refined matcher configuration
export const config = {
  matcher: [
    // UI Routes that require auth and/or role checks
    '/dashboard/:path*',
    '/admin/:path*',
    '/profile/:path*',
    '/settings/:path*',
    '/listings/manage/:path*',
    '/listings/create',
    '/listings/edit/:id*', // Assuming edit takes an ID
    '/analytics/:path*',

    // Auth Pages (to handle redirect if already logged in or to allow access)
    '/login',
    '/register',

    // API Routes - list specific top-level protected API segments
    // The hasAccess function will grant/deny based on UserRole and specific API endpoint if needed
    '/api/user/:path*',
    '/api/editor/:path*',
    '/api/venue-owner/:path*',
    '/api/admin/:path*',
    '/api/superadmin/:path*',
    '/api/protected/:path*', // Generic protected API
    '/api/session', // For session updates
  ],
};
