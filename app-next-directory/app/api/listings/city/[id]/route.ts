import { NextRequest } from 'next/dist/server/web/spec-extension/request';
import { NextResponse } from 'next/dist/server/web/spec-extension/response';
import { getListingsByCityId } from '@/lib/data/city';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const listings = await getListingsByCityId(id);
    return NextResponse.json({ success: true, listings });
  } catch (error) {
    console.error('[ERROR] listings/city/[id] API:', error);
    return NextResponse.json({ error: 'Failed to fetch listings' }, { status: 500 });
  }
}

