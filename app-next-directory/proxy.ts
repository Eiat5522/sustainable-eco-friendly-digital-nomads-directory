import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

// Define protected admin routes
const adminRoutes = ['/admin'];

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Check if the route is an admin route
  const isAdminRoute = adminRoutes.some(route => path.startsWith(route));

  if (isAdminRoute) {
    // For admin routes, check authentication via session cookie
    // Using optimistic check from cookie only (no database lookup for performance)
    try {
      const session = await auth();
      const userRole = session?.user?.role;

      // Redirect if not admin or superAdmin
      if (userRole !== 'admin' && userRole !== 'superAdmin') {
        return NextResponse.redirect(
          new URL('/auth/login?callbackUrl=' + encodeURIComponent(path), request.url)
        );
      }
    } catch (error) {
      // If auth check fails, redirect to login
      return NextResponse.redirect(
        new URL('/auth/login?callbackUrl=' + encodeURIComponent(path), request.url)
      );
    }
  }

  return NextResponse.next();
}

// Configure which routes proxy should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
