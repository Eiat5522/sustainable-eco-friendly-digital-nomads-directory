import { NextResponse } from 'next/dist/server/web/spec-extension/response';
import { mockListings } from '@/tests/helpers/test-data';

export async function GET() {
  return NextResponse.json(mockListings);
}
