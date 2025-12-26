import { revalidateTag } from 'next/cache';
import { connection } from 'next/server';
import type { NextRequest } from 'next/server';
import { structuredLogger } from '@/lib/logger';
import { ApiResponseHandler } from '@/utils/api-response';
import { validateRevalidationToken } from '@/utils/revalidation-token';

type SanityWebhookPayload = {
  _type?: string;
  type?: string;
  document?: { _type?: string };
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

    tags.forEach(tag => revalidateTag(tag));

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
