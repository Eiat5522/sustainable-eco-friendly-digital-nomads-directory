import { type NextRequest, NextResponse } from 'next/server';

import logger from '@/lib/logger';
import { recordListingView } from '@/lib/metrics/listing-views';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    if (!slug || typeof slug !== 'string') {
      return NextResponse.json({ error: 'Listing slug is required' }, { status: 400 });
    }

    let viewedAt: Date | undefined;
    if (request.headers.get('content-type')?.includes('application/json')) {
      try {
        const payload = await request.json();
        if (payload?.viewedAt) {
          const candidate = new Date(payload.viewedAt);
          if (!Number.isNaN(candidate.getTime())) {
            viewedAt = candidate;
          }
        }
      } catch (error) {
        logger.warn('Failed to parse listing view request body', {
          component: 'api/listings/[slug]/views',
          slug,
          parseError: error instanceof Error ? error.message : undefined,
        });
      }
    }

    await recordListingView(slug, viewedAt ?? new Date());

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Failed to record listing view', error, {
      component: 'api/listings/[slug]/views',
    });
    return NextResponse.json({ error: 'Failed to record view' }, { status: 500 });
  }
}
