// Handles decoding of callback URLs and prevents double-encoding issues in authentication flows.

import { NextRequest, NextResponse } from 'next/server';

/**
 * Decodes callback URLs and prevents double-encoding.
 * Use as middleware or utility in auth flows.
 */
export function handleAuthCallbackUrl(req: NextRequest): string | null {
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