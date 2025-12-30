import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getUserById } from '@/lib/auth/dal';
import { structuredLogger } from '@/lib/logger';
import type { UserRole } from '@/types/auth';

const secret = process.env.NEXTAUTH_SECRET;

/**
 * Attach security headers to all NextResponse objects.
 */
function withSecurityHeaders<T extends NextResponse>(response: T): T {
  const headers = response.headers;
  if (headers) {
    headers.set('X-Frame-Options', 'DENY');
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  }
  return response;
}

// Define protected routes
const adminRoutes = ['/admin'];
const protectedRoutes = [
  '/dashboard',
  '/admin',
  '/profile',
  '/settings',
  '/listings/manage',
  '/listings/create',
];
const authPages = ['/auth/error', '/auth/login', '/auth/signup', '/login', '/register'];

export async function proxy(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl;

    // Skip middleware for static files, Next.js internals, and auth API
    if (
      pathname.startsWith('/_next') ||
      pathname.startsWith('/api/auth') ||
      pathname.includes('.') // Skip files with extensions
    ) {
      return NextResponse.next();
    }

    // Get token for role-based checks
    const token = await getToken({ req: request, secret });
    const isAuthenticated = !!token;
    let userRole = token?.role as UserRole | undefined;

    // If token exists and has an id, revalidate role and tokenVersion against MongoDB
    if (token?.id) {
      try {
        const dbUser = await getUserById(String(token.id));
        if (dbUser) {
          // If tokenVersion mismatch, treat as unauthenticated to force re-login
          const tokenVersionInToken = (token as unknown as { tokenVersion?: number }).tokenVersion;
          if (
            typeof tokenVersionInToken === 'number' &&
            typeof dbUser.tokenVersion === 'number' &&
            tokenVersionInToken !== dbUser.tokenVersion
          ) {
            // Force re-login by treating token as absent
            return withSecurityHeaders(
              NextResponse.redirect(new URL('/auth/login', request.nextUrl.origin || request.url))
            );
          }

          // Use DB role as canonical
          userRole = dbUser.role as UserRole;
        }
      } catch (err) {
        structuredLogger.warn('[proxy] failed to revalidate token/user', err, {
          pathname: request.nextUrl.pathname,
        });
      }
    }

    // Auth pages handling - redirect authenticated users to dashboard
    const isAuthPage = authPages.some(p => pathname.startsWith(p));
    if (isAuthPage && isAuthenticated) {
      return withSecurityHeaders(
        NextResponse.redirect(new URL('/dashboard', request.nextUrl.origin || request.url))
      );
    }

    // Protected routes check
    const isProtectedRoute = protectedRoutes.some(path => pathname.startsWith(path));

    if (isProtectedRoute) {
      // Always redirect unauthenticated users to /auth/login with callbackUrl
      if (!isAuthenticated || !userRole) {
        const loginUrl = new URL('/auth/login', request.nextUrl.origin || request.url);
        loginUrl.searchParams.set('callbackUrl', pathname);
        return withSecurityHeaders(NextResponse.redirect(loginUrl));
      }

      // Admin route access control
      const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route));
      if (isAdminRoute) {
        // Only admin and superAdmin can access admin routes
        if (userRole !== 'admin' && userRole !== 'superAdmin') {
          const forbiddenUrl = new URL('/auth/unauthorized', request.nextUrl.origin || request.url);
          return withSecurityHeaders(NextResponse.redirect(forbiddenUrl));
        }
      }

      // Listing management routes require venueOwner or admin roles
      const isListingManagementRoute =
        pathname.startsWith('/dashboard/listings') || pathname.startsWith('/listings/manage');
      if (isListingManagementRoute) {
        const canManageListings =
          userRole === 'venueOwner' || userRole === 'admin' || userRole === 'superAdmin';
        if (!canManageListings) {
          const forbiddenUrl = new URL('/auth/unauthorized', request.nextUrl.origin || request.url);
          return withSecurityHeaders(NextResponse.redirect(forbiddenUrl));
        }
      }

      // Authenticated and authorized: allow access
      return withSecurityHeaders(NextResponse.next());
    }

    // API routes protection (non-auth API)
    if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth')) {
      // Public APIs that anyone can access (no auth required):
      const publicApiPaths = ['/api/listings'];
      const isPublicApi = publicApiPaths.some(path => pathname.startsWith(path));
      if (isPublicApi) {
        return withSecurityHeaders(NextResponse.next());
      }

      // Protected APIs (require authentication):
      const protectedApiPaths = ['/api/user', '/api/admin', '/api/reviews', '/api/comments'];
      const isProtectedApi = protectedApiPaths.some(path => pathname.startsWith(path));

      if (isProtectedApi) {
        if (!isAuthenticated) {
          return withSecurityHeaders(
            NextResponse.json({ error: 'Authentication required' }, { status: 401 })
          );
        }

        // Admin API access control
        if (pathname.startsWith('/api/admin')) {
          if (userRole !== 'admin' && userRole !== 'superAdmin') {
            return withSecurityHeaders(
              NextResponse.json({ error: 'Admin access required' }, { status: 403 })
            );
          }
        }
      }

      // Everything else (other APIs) are allowed
      return withSecurityHeaders(NextResponse.next());
    }

    // Special handling for profile routes (test expects /auth/login with callbackUrl)
    if (
      (pathname === '/auth/profile' || pathname === '/auth/profile/settings') &&
      !isAuthenticated
    ) {
      const loginUrl = new URL('/auth/login', request.nextUrl.origin || request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return withSecurityHeaders(NextResponse.redirect(loginUrl));
    }

    // Add security headers to all responses
    return withSecurityHeaders(NextResponse.next());
  } catch (error) {
    // Graceful error handling
    structuredLogger.error('[proxy] error', error, { pathname: request.nextUrl.pathname });
    return withSecurityHeaders(NextResponse.next());
  }
}

// Configure which routes proxy should run on
export const config = {
  matcher: [
    // UI Routes that require auth and/or role checks
    '/dashboard/:path*',
    '/admin/:path*',
    '/profile/:path*',
    '/settings/:path*',
    '/listings/manage/:path*',
    '/listings/create',
    '/listings/edit/:slug*',
    '/analytics/:path*',

    // Auth Pages (to handle redirect if already logged in)
    '/login',
    '/register',
    '/auth/:path*',

    // API Routes - list specific protected API segments
    '/api/user/:path*',
    '/api/editor/:path*',
    '/api/venue-owner/:path*',
    '/api/admin/:path*',
    '/api/superadmin/:path*',
    '/api/protected/:path*',
    '/api/session',
    '/api/comments/:path*',
    '/api/reviews/:path*',
  ],
};
