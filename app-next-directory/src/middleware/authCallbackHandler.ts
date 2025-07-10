// Handles decoding of callback URLs and prevents double-encoding issues in authentication flows.

// NOTE: Do not import NextRequest/NextResponse from 'next/server' in utility files for Next.js 14+ middleware compatibility.
// Use a compatible type or 'any' for req if needed, or define a minimal interface.

/**
 * Decodes callback URLs and prevents double-encoding.
 * Use as middleware or utility in auth flows.
 */
export function handleAuthCallbackUrl(req: { nextUrl: { searchParams: URLSearchParams } }): string | null {
  const urlParam = req.nextUrl.searchParams.get('callbackUrl');
  if (!urlParam) {
    return null;
  }

  try {
    // Prevent double-encoding: decode until stable
    let decoded = urlParam;
    let prev;
    do {
      prev = decoded;
      decoded = decodeURIComponent(decoded);
    } while (decoded !== prev && /%[0-9A-Fa-f]{2}/.test(decoded));

    return decoded;
  } catch (e) {
    console.error("Error decoding callback URL", e);
    return null;
  }
}