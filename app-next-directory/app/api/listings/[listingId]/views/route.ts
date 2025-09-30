import { NextResponse } from 'next/server';

// Deprecated route - use the slug-based endpoint instead
export async function POST() {
  return NextResponse.json({
    error: 'Deprecated: use /api/listings/[slug]/views',
  }, { status: 410 });
}
