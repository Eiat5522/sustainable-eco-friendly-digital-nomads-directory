/**
 * Next.js Middleware Entry Point
 *
 * This file must exist at src/middleware.ts for Next.js to recognize and execute middleware.
 * The actual middleware implementation is in ./middleware/index.ts
 * 
 * @see https://nextjs.org/docs/app/building-your-application/routing/middleware
 */

export { createMiddleware } from './middleware/index';
export { default } from './middleware/index';

// Next.js middleware configuration
// Note: This must be defined directly in this file and cannot be re-exported
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
