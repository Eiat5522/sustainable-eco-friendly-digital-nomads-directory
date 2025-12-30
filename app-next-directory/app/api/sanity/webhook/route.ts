import { revalidateTag } from 'next/cache';
import type { NextRequest } from 'next/server';
import { connection } from 'next/server';
import { structuredLogger } from '@/lib/logger';
import type { SanityWebhookPayload } from '@/lib/revalidation';
import { resolveSanityRevalidationTargets, revalidateTags } from '@/lib/revalidation';
import { ApiResponseHandler } from '@/utils/api-response';
import { validateRevalidationToken } from '@/utils/revalidation-token';

export async function POST(request: NextRequest) {
  await connection();

  let payload: SanityWebhookPayload | null = null;
  try {
    payload = (await request.json()) as SanityWebhookPayload;
    const token = request.headers.get('x-sanity-webhook-token');

    if (!validateRevalidationToken(token)) {
      return ApiResponseHandler.error('Invalid token', 401);
    }

    const { docType, tags, listingSlugs } = resolveSanityRevalidationTargets(payload);
    revalidateTags(tags, listingSlugs, revalidateTag);

    return ApiResponseHandler.success({
      revalidated: true,
      tags,
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
