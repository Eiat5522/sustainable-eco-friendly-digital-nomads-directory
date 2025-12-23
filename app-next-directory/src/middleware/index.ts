/**
 * Main Middleware File
 *
 * This is the main middleware entry point that combines all middleware functionality.
 * NOTE: Do not import NextRequest/NextResponse from 'next/server' in utility files for Next.js 14+ middleware compatibility.
 */

import { getToken } from '@/lib/auth';
import { getRequestContext, structuredLogger } from '@/lib/logger';
import { ACCESS_CONTROL_MATRIX } from '@/types/auth';

// Compatible types for Next.js 14+ middleware
type NextRequestLike = {
  nextUrl: { pathname: string; origin: string; searchParams: URLSearchParams };
  url: string;
  method: string;
  headers: Map<string, string>;
};

type NextResponseLike = {
  headers: {
    set: (key: string, value: string) => void;
    append: (key: string, value: string) => void;
  };
  next: () => NextResponseLike;
  redirect: (url: URL) => NextResponseLike;
  json: (body: unknown, init?: { status?: number }) => NextResponseLike;
};

// Security headers to be added to all responses
const securityHeaders = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
} as const;

interface MiddlewareOptions {
  getToken: (request: NextRequestLike) => Promise<unknown>;
  NextResponse: {
    next: () => NextResponseLike;
    redirect: (url: URL) => NextResponseLike;
    json: (body: unknown, init?: { status?: number }) => NextResponseLike;
  };
}

// RequestContext is used by getRequestContext but not directly in this file
// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface RequestContext {
  traceId: string;
}

// Helper to check if path should bypass middleware
function shouldBypass(pathname: string): boolean {
  return (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/api/auth/') ||
    pathname.includes('.')
  );
}

// Helper to get route type
function getRouteType(pathname: string): 'public' | 'protected' | 'admin' | 'auth' | 'api' {
  if (pathname.startsWith('/api/admin/')) return 'api';
  if (pathname.startsWith('/admin/')) return 'admin';
  if (pathname.startsWith('/api/')) return 'api';
  if (pathname.startsWith('/auth/')) return 'auth';
  if (
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/profile') ||
    pathname.startsWith('/listings/create') ||
    pathname.startsWith('/listings/edit')
  )
    return 'protected';
  return 'public';
}

// Helper to check user permissions
function hasPermission(
  user: Record<string, unknown> | null | undefined,
  routeType: string
): boolean {
  if (!user) {
    return false;
  }

  const role = user.role as string;
  if (!role || !ACCESS_CONTROL_MATRIX[role as keyof typeof ACCESS_CONTROL_MATRIX]) {
    return false;
  }

  const matrix = ACCESS_CONTROL_MATRIX[role as keyof typeof ACCESS_CONTROL_MATRIX];

  switch (routeType) {
    case 'protected': {
      // Protected routes include dashboard, profile, listings/create, listings/edit
      // Check if user can create listings (covers /listings/create)
      const protectedResult = matrix.pages?.createListing?.canView ?? false;
      return protectedResult;
    }
    case 'admin': {
      const adminResult = matrix.pages?.admin?.canView ?? false;
      return adminResult;
    }
    case 'api': {
      // API admin routes require admin role
      const apiResult = role === 'admin';
      return apiResult;
    }
    default:
      return true;
  }
}

// Main middleware function
export function createMiddleware(options: MiddlewareOptions) {
  return async (request: NextRequestLike): Promise<NextResponseLike> => {
    const { pathname } = request.nextUrl;

    try {
      // Get request context for logging (used implicitly by logger)
      getRequestContext(request);

      // Bypass for Next.js internals and static files
      if (shouldBypass(pathname)) {
        return options.NextResponse.next();
      }

      // Get route type
      const routeType = getRouteType(pathname);

      // Get user token
      const tokenResult = await options.getToken(request);
      const token =
        tokenResult && typeof tokenResult === 'object'
          ? (tokenResult as Record<string, unknown>)
          : null;

      // Handle auth pages (redirect authenticated users away)
      if (routeType === 'auth' && token) {
        const redirectUrl = new URL('/dashboard', request.nextUrl.origin);
        const response = options.NextResponse.redirect(redirectUrl);

        // Add security headers
        Object.entries(securityHeaders).forEach(([key, value]) => {
          response.headers.set(key, value);
        });

        return response;
      }

      // Handle protected routes (require authentication)
      if (routeType === 'protected' && !token) {
        const signinUrl = new URL('/auth/login', request.nextUrl.origin);
        signinUrl.searchParams.set('callbackUrl', pathname);
        const response = options.NextResponse.redirect(signinUrl);

        // Add security headers
        Object.entries(securityHeaders).forEach(([key, value]) => {
          response.headers.set(key, value);
        });

        return response;
      }

      // Handle protected routes with permission check (user is authenticated but may lack permissions)
      if (routeType === 'protected' && token && !hasPermission(token, routeType)) {
        const homeUrl = new URL('/', request.nextUrl.origin);
        homeUrl.searchParams.set('error', 'unauthorized_access');
        const response = options.NextResponse.redirect(homeUrl);

        // Add security headers
        Object.entries(securityHeaders as Record<string, string>).forEach(([key, value]) => {
          response.headers.set(key, value);
        });

        return response;
      }

      // Handle admin routes (require admin role)
      if ((routeType === 'admin' || routeType === 'api') && !hasPermission(token, routeType)) {
        if (routeType === 'api') {
          const response = options.NextResponse.json(
            { error: 'Unauthorized' },
            { status: token ? 403 : 401 }
          );

          // Add security headers
          Object.entries(securityHeaders as Record<string, string>).forEach(([key, value]) => {
            response.headers.set(key, value);
          });

          return response;
        } else {
          const signinUrl = new URL('/auth/login', request.nextUrl.origin);
          signinUrl.searchParams.set('callbackUrl', pathname);
          if (token) {
            signinUrl.searchParams.set('error', 'unauthorized_access');
          }
          const response = options.NextResponse.redirect(signinUrl);

          // Add security headers
          Object.entries(securityHeaders).forEach(([key, value]) => {
            response.headers.set(key, value);
          });

          return response;
        }
      }

      // Allow request for public routes or authorized users
      const response = options.NextResponse.next();

      // Add security headers to all responses
      Object.entries(securityHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });

      return response;
    } catch (error) {
      // Log error and allow request to continue
      structuredLogger.middlewareError('main-middleware', error, {
        traceId: getRequestContext(request)?.traceId,
        pathname,
      });

      const response = options.NextResponse.next();

      // Add security headers even on error
      Object.entries(securityHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });

      return response;
    }
  };
}

// Default middleware export for Next.js
export default function middleware(request: NextRequestLike): Promise<NextResponseLike> {
  const authOptions: MiddlewareOptions = {
    getToken: async (req: NextRequestLike) => {
      try {
        return await getToken({
          req: req as unknown as Request,
          secret: process.env.NEXTAUTH_SECRET,
        });
      } catch {
        return null;
      }
    },
    NextResponse: {
      next: () => ({}) as NextResponseLike,
      redirect: (_url: URL) => ({}) as NextResponseLike,
      json: (_body: unknown, _init?: { status?: number }) => ({}) as NextResponseLike,
    },
  };

  const middlewareFn = createMiddleware(authOptions);
  return middlewareFn(request);
}

// Next.js middleware configuration
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};
