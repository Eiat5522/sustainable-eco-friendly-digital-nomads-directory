export const dynamic = 'force-dynamic';

import { NextResponse, type NextRequest } from 'next/server';

import { recordListingView } from '@/lib/metrics/listing-views';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
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
        console.warn('[listing-view] Failed to parse request body', error);
      }
    }

    await recordListingView(slug, viewedAt ?? new Date());

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[listing-view] POST failed', error);
    return NextResponse.json({ error: 'Failed to record view' }, { status: 500 });
  }
}
