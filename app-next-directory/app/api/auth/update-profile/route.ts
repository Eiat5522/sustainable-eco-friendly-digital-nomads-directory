import { NextResponse, type NextRequest } from 'next/server';

type RouteContext = { params: Promise<Record<string, never>> };

const notImplemented = () =>
  NextResponse.json({ error: 'Profile update endpoint not implemented.' }, { status: 501 });

export async function PATCH(_request: NextRequest, _context: RouteContext) {
  return notImplemented();
}

export async function POST(_request: NextRequest, _context: RouteContext) {
  return notImplemented();
}

export async function GET(_request: NextRequest, _context: RouteContext) {
  return NextResponse.json({ message: 'Use PATCH to update the profile.' }, { status: 405 });
}
