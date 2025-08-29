import { headers } from 'next/headers'

/**
 * Resolve the absolute base URL for server-side fetches.
 * Falls back to env when request headers are unavailable.
 */
export function getBaseUrl(): string {
  try {
    const h = headers()
    const proto = h.get('x-forwarded-proto') ?? 'http'
    const host = h.get('x-forwarded-host') ?? h.get('host')
    if (host) return `${proto}://${host}`
  } catch {
    // headers() not available outside request context; fall through to env
  }

  return (
    process.env.NEXT_PUBLIC_FRONTEND_URL?.trim() ||
    process.env.NEXTAUTH_URL?.trim() ||
    'http://localhost:3000'
  )
}

