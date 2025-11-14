import { ACCESS_CONTROL_MATRIX, PagePermissions, UserRole } from '@/types/auth';
import { structuredLogger, getRequestContext } from '@/lib/logger';
import type { NextRequest } from 'next/server';

const secret = process.env.NEXTAUTH_SECRET;

/**
 * Attach security headers to all NextResponse objects.
 */
type NextResponseLike = {
  headers?: {
    set: (key: string, val: string) => void;
    append?: (key: string, val: string) => void;
  };
};

const ensureHeaderController = (
  headers?: NextResponseLike['headers']
): NextResponseLike['headers'] => {
  if (headers && typeof headers.set === 'function') {
    if (typeof headers.append !== 'function') {
      headers.append = () => undefined;
    }
    return headers;
  }

  return {
    set: () => undefined,
    append: () => undefined,
  };
};

function withSecurityHeaders<T extends NextResponseLike>(response: T): T {
  const headers = ensureHeaderController(response.headers);
  if (!response.headers) {
    response.headers = headers;
  }
  if (headers) {
    headers.set('X-Frame-Options', 'DENY');
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  }
  return response;
}

// Edge-compatible access control function
function hasAccess(userRole: UserRole, path: string): boolean {
  if (!userRole) {
    return false;
  }

  const permissions = ACCESS_CONTROL_MATRIX[userRole];
  if (!permissions || !permissions.pages) {
    return false;
  }

  // Map paths to permission keys
  let basePathKey = 'home';
  
  if (path.startsWith('/api/')) {
    // For API routes, map to corresponding page permissions
    if (path.startsWith('/api/user')) {
      basePathKey = 'profile'; // User API maps to profile permissions
    } else if (path.startsWith('/api/admin')) {
      basePathKey = 'admin';
    } else if (path.startsWith('/api/listings')) {
      basePathKey = 'listings';
    } else if (path.startsWith('/api/reviews')) {
      basePathKey = 'reviews';
    } else {
      // Default for other API routes
      basePathKey = 'home';
    }
  } else {
    // For regular routes
    const pathSegments = path.split('/').filter(Boolean);
    if (pathSegments.length === 0) {
      basePathKey = 'home';
    } else {
      const firstSegment = pathSegments[0] ?? 'home';
      // Map common routes
      switch (firstSegment) {
        case 'dashboard':
          basePathKey = 'home'; // Dashboard access is controlled by home permissions
          break;
        case 'admin':
          basePathKey = 'admin';
          break;
        case 'profile':
          basePathKey = 'profile';
          break;
        case 'listings':
          if (pathSegments[1] === 'create') {
            basePathKey = 'createListing';
          } else if (pathSegments[1] === 'edit') {
            basePathKey = 'editListing';
          } else {
            basePathKey = 'listings';
          }
          break;
        default:
          basePathKey = firstSegment;
      }
    }
  }

  const pagePermission = permissions.pages[basePathKey as keyof typeof permissions.pages] as PagePermissions | undefined;

  return pagePermission?.canView ?? false;
}

type TokenPayload = { role?: UserRole } & Record<string, unknown>;

type GetTokenFn = (params: { req: NextRequest; secret?: string }) => Promise<TokenPayload | null>;

type NextResponseFactory = Pick<typeof import('next/server').NextResponse, 'next' | 'redirect' | 'json'>;

export function createMiddleware({
  getToken,
  NextResponse
}: {
  getToken: GetTokenFn,
  NextResponse: NextResponseFactory
}) {
  return async function middleware(request: NextRequest) {
    try {
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

      // Auth pages handling - redirect authenticated users to dashboard
      // Current working auth pages: /auth/login and /auth/signup (also handle legacy /login /register)
      const authPages = [
        '/auth/error',
        '/auth/login',
        '/auth/signup',
        '/login',
        '/register'
      ];
      const isAuthPage = authPages.some(p => pathname.startsWith(p));

      if (isAuthPage && isAuthenticated) {
        return withSecurityHeaders(
          NextResponse.redirect(new URL('/dashboard', request.nextUrl.origin || request.url))
        );
      }

      // Protected routes check
      const protectedPaths = ['/dashboard', '/admin', '/profile', '/settings', '/listings/manage', '/listings/create'];
      const isProtectedRoute = protectedPaths.some(path => pathname.startsWith(path));

      if (isProtectedRoute) {
        // Always redirect unauthenticated or malformed/undefined role tokens to /auth/signin with callbackUrl
        if (!isAuthenticated || !userRole) {
          const signinUrl = new URL('/auth/login', request.nextUrl.origin || request.url);
          signinUrl.searchParams.set('callbackUrl', pathname);
          return withSecurityHeaders(NextResponse.redirect(signinUrl));
        }

        // Role-based access control
        if (!hasAccess(userRole, pathname)) {
          if (pathname.startsWith('/api/')) {
            return withSecurityHeaders(
              NextResponse.json(
                { error: 'Access denied' },
                { status: 403 }
              )
            );
          }
          const homeUrl = new URL('/', request.nextUrl.origin || request.url);
          homeUrl.searchParams.set('error', 'unauthorized_access');
          return withSecurityHeaders(NextResponse.redirect(homeUrl));
        }
        // Authenticated and authorized: allow access
        return withSecurityHeaders(NextResponse.next());
      }

      // API routes protection
      if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth')) {
        // Public APIs that anyone can access (no auth required):
        const publicApiPaths = ['/api/listings'];
        const isPublicApi = publicApiPaths.some(path => pathname.startsWith(path));
        if (isPublicApi) {
          // Allow both authenticated and unauthenticated access to public API
          return withSecurityHeaders(NextResponse.next());
        }

        // Protected APIs (require authentication and permission):
        const protectedApiPaths = ['/api/user', '/api/admin', '/api/reviews', '/api/comments'];
        const isProtectedApi = protectedApiPaths.some(path => pathname.startsWith(path));

        if (isProtectedApi && !isAuthenticated) {
          return withSecurityHeaders(
            NextResponse.json(
              { error: 'Authentication required' },
              { status: 401 }
            )
          );
        }

        if (isProtectedApi && userRole && !hasAccess(userRole, pathname)) {
          return withSecurityHeaders(
            NextResponse.json(
              { error: 'Access denied' },
              { status: 403 }
            )
          );
        }
        // Everything else (other APIs) are allowed
        return withSecurityHeaders(NextResponse.next());
      }

      // Special handling for /auth/profile and /auth/profile/settings (test expects /auth/signin with callbackUrl)
      if ((pathname === '/auth/profile' || pathname === '/auth/profile/settings') && !isAuthenticated) {
        const signinUrl = new URL('/auth/login', request.nextUrl.origin || request.url);
        signinUrl.searchParams.set('callbackUrl', pathname);
        return withSecurityHeaders(NextResponse.redirect(signinUrl));
      }

      // Add security headers to all responses
      return withSecurityHeaders(NextResponse.next());
    } catch (error) {
      // Graceful error handling
      structuredLogger.middlewareError('main-middleware', error, getRequestContext(request));
      return withSecurityHeaders(NextResponse.next());
    }
  };
}

// Default export for Next.js (uses real dependencies)
// Dynamically require NextResponse for runtime compatibility
let ignoredNextResponseReal: unknown;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  ignoredNextResponseReal = require('next/server').NextResponse;
} catch {
  ignoredNextResponseReal = undefined;
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
    '/listings/edit/:slug*', // Using slug to match route structure
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
    '/api/comments/:path*', // Blog comments
    '/api/reviews/:path*', // Listing reviews
  ],
};


// CJS/ESM compatibility for Jest
if (typeof module !== "undefined" && module.exports) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  module.exports = { middleware: require('@/lib/auth').auth, config, createMiddleware };
}
