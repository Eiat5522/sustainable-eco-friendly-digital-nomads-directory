// app-next-directory/src/lib/absolute-url.ts
import 'server-only';
import { headers } from 'next/headers';

/**
 * Resolve the absolute base URL for server-side fetches.
 * Falls back to env when request headers are unavailable.
 */
export async function getBaseUrl(
  hParam?: { get(name: string): string | null | undefined } | null
): Promise<string> {
  try {
    const h = hParam ?? (await headers());
    const first = (v?: string | null) => v?.split(',')[0]?.trim() ?? null;
    const isSafeHost = (host: string) => /^[a-z0-9.-]+(?::\d+)?$/i.test(host);
    const proto = first(h.get('x-forwarded-proto')) ?? 'http';
    const xfHost = first(h.get('x-forwarded-host'));
    // Only trust x-forwarded-host on Vercel; otherwise prefer raw Host
    const host = process.env.VERCEL ? (xfHost ?? h.get('host')) : h.get('host');
    if (host && isSafeHost(host)) return `${proto}://${host}`;
  } catch {
    // headers() not available outside request context; fall through to env
  }

  const envUrl =
    process.env.NEXT_PUBLIC_FRONTEND_URL?.trim() ||
    process.env.NEXTAUTH_URL?.trim() ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '');
  try {
    return new URL(envUrl).origin;
  } catch {
    return 'http://localhost:3000';
  }
}
