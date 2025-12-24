// app-next-directory/src/lib/absolute-url.ts
import 'server-only';
import { headers as nextHeaders } from 'next/headers';
import type { HeadersLike } from '@/types/request';

/**
 * Resolve the absolute base URL for server-side fetches.
 * Falls back to env when request headers are unavailable.
 *
 * @param headersParam - Optional headers object from request context.
 *   Pass `await headers()` from server components to avoid implicit
 *   headers() calls in cached scopes.
 */
export async function getBaseUrl(headersParam?: HeadersLike | null): Promise<string> {
  // Try to derive host from provided headers or `headers()` helper.
  let headersObj: HeadersLike | null | undefined = headersParam ?? null;
  if (!headersObj) {
    try {
      // headers() throws when called outside of a request context (e.g., build)
      headersObj = await nextHeaders();
    } catch {
      headersObj = null;
    }
  }

  if (headersObj) {
    const first = (v?: string | null) => v?.split(',')[0]?.trim() ?? null;
    const isSafeHost = (host: string) => /^[a-z0-9.-]+(?::\d+)?$/i.test(host);
    const proto = first(headersObj.get('x-forwarded-proto')) ?? 'http';
    const xfHost = first(headersObj.get('x-forwarded-host'));
    const host = process.env.VERCEL
      ? (xfHost ?? headersObj.get('host'))
      : headersObj.get('host');
    if (host && isSafeHost(host)) {
      return `${proto}://${host}`;
    }
  }

  // Fallback to environment variables for static contexts or if headers are unavailable
  const envUrl =
    process.env.NEXT_PUBLIC_FRONTEND_URL?.trim() ||
    process.env.NEXTAUTH_URL?.trim() ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '');
  try {
    const url = new URL(envUrl);
    // Ensure that if it's localhost and in development, we use http
    if (url.hostname === 'localhost' && process.env.NODE_ENV === 'development') {
      return `http://${url.host}`;
    }
    return url.origin;
  } catch {
    // If envUrl is invalid or missing, default to localhost in dev/test and example.com in production
    const env = process.env.NODE_ENV;
    const devLike = !env || env === 'development' || env === 'test';
    return devLike ? 'http://localhost:3000' : 'https://example.com';
  }
}
