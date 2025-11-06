import { NextResponse } from 'next/server';
import { mockListings } from '@/tests/helpers/test-data';

export async function GET() {
  return NextResponse.json(mockListings);
}
