import { revalidateTag } from 'next/cache';
import type { NextRequest } from 'next/server';
import { connection } from 'next/server';
import { structuredLogger } from '@/lib/logger';
import { ApiResponseHandler } from '@/utils/api-response';
import { validateRevalidationToken } from '@/utils/revalidation-token';

type SanityWebhookPayload = {
  _type?: string;
  type?: string;
  document?: { _type?: string; slug?: { current?: string } };
  ids?: { created?: string[]; updated?: string[]; deleted?: string[] };
};

const TAGS_BY_TYPE: Record<string, string[]> = {
  listing: ['featured-listings'],
  city: ['cities'],
  ecoTag: ['eco-tags'],
};

export async function POST(request: NextRequest) {
  await connection();

  let payload: SanityWebhookPayload | null = null;
  try {
    payload = (await request.json()) as SanityWebhookPayload;
    const token = request.headers.get('x-sanity-webhook-token');

    if (!validateRevalidationToken(token)) {
      return ApiResponseHandler.error('Invalid token', 401);
    }

    const docType = payload?._type ?? payload?.document?._type ?? payload?.type ?? null;
    const tags = new Set<string>(['home']);

    if (docType && TAGS_BY_TYPE[docType]) {
      TAGS_BY_TYPE[docType].forEach(tag => tags.add(tag));
    }

    // Attempt to revalidate listing-specific tags if payload provides slugs/ids
    const listingSlugs: string[] = [];
    if (docType === 'listing') {
      const docSlug = payload?.document?.slug?.current;
      if (typeof docSlug === 'string' && docSlug.length > 0) listingSlugs.push(docSlug);
      const ids = [
        ...(payload?.ids?.created ?? []),
        ...(payload?.ids?.updated ?? []),
        ...(payload?.ids?.deleted ?? []),
      ];
      for (const idOrSlug of ids) {
        if (typeof idOrSlug === 'string' && idOrSlug.length > 0) listingSlugs.push(idOrSlug);
      }
    }

    tags.forEach(tag => revalidateTag(tag, 'max'));
    for (const s of Array.from(new Set(listingSlugs))) {
      try {
        revalidateTag(`listing-${s}`, 'max');
      } catch {}
    }

    return ApiResponseHandler.success({
      revalidated: true,
      tags: Array.from(tags),
      docType,
      now: Date.now(),
    });
  } catch (error) {
    structuredLogger.error('Error handling Sanity webhook', error, {
      route: '/api/sanity/webhook',
      method: request.method,
      docType: payload?._type ?? payload?.document?._type ?? payload?.type ?? undefined,
    });

    return ApiResponseHandler.error('Error revalidating', 500);
  }
}
