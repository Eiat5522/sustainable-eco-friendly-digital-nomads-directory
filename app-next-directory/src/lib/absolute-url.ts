// app-next-directory/src/lib/absolute-url.ts
import 'server-only';
import { headers } from 'next/headers';
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
  // If headers are explicitly provided, use them. This is for dynamic server components.
  if (headersParam) {
    const first = (v?: string | null) => v?.split(',')[0]?.trim() ?? null;
    const isSafeHost = (host: string) => /^[a-z0-9.-]+(?::\d+)?$/i.test(host);
    const proto = first(headersParam.get('x-forwarded-proto')) ?? 'http';
    const xfHost = first(headersParam.get('x-forwarded-host'));
    const host = process.env.VERCEL ? (xfHost ?? headersParam.get('host')) : headersParam.get('host');
    if (host && isSafeHost(host)) return `${proto}://${host}`;
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
    // If envUrl is invalid or missing, default to localhost for development
    return process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://example.com';
  }
}
