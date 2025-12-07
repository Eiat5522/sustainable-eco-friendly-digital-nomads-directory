/**
 * Common request-related types for Next.js Server Components
 * 
 * These types allow helpers to accept request-scoped data (like headers)
 * without directly calling Next.js runtime APIs, which helps avoid
 * "headers() called in cached scope" errors during prerendering.
 */

/**
 * A headers-like interface that can be satisfied by Next.js headers()
 * or a compatible object with a get() method.
 * 
 * Usage:
 * ```ts
 * function myHelper(headersParam?: HeadersLike) {
 *   const h = headersParam ?? await headers();
 *   const host = h.get('host');
 * }
 * 
 * // In server component:
 * const result = await myHelper(await headers());
 * ```
 */
export type HeadersLike = { get(name: string): string | null | undefined } | Headers;
