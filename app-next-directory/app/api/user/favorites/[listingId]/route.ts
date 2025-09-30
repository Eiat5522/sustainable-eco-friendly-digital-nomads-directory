import { NextResponse } from 'next/server';

// Deprecated: use the slug-based favorites endpoints at /api/user/favorites/[slug]
export async function POST() {
  return NextResponse.json({ error: 'Deprecated: use /api/user/favorites/[slug]' }, { status: 410 });
}

export async function GET() {
  return NextResponse.json({ favorited: false }, { status: 410 });
}
