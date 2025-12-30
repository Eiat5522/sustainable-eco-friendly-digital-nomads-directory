/**
 * Next.js Proxy Entry Point
 *
 * In Next.js 16, middleware was renamed to proxy.
 * This file must exist at src/proxy.ts for Next.js to recognize and execute the proxy.
 * The actual proxy implementation is in ./proxy/index.ts
 *
 * @see https://nextjs.org/docs/app/building-your-application/routing/middleware
 */

export { createProxy, default } from './proxy/index';

// Next.js proxy configuration
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
