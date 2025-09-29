import { NextResponse, type NextRequest } from 'next/server';

type RouteContext = { params: Record<string, never> };

const notImplemented = () =>
  NextResponse.json({ error: 'Review moderation API not implemented.' }, { status: 501 });

export async function POST(_request: NextRequest, _context: RouteContext) {
  return notImplemented();
}

export async function GET(_request: NextRequest, _context: RouteContext) {
  return notImplemented();
}
