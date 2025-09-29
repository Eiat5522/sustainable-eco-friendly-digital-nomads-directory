import { NextResponse, type NextRequest } from 'next/server';

type RouteContext = { params: Promise<Record<string, never>> };

const notImplemented = () =>
  NextResponse.json({ error: 'Admin analyze content API not implemented.' }, { status: 501 });

export async function POST(_request: NextRequest, _context: RouteContext) {
  return notImplemented();
}

export async function GET(_request: NextRequest, _context: RouteContext) {
  return notImplemented();
}
