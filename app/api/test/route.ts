import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: 'Test API root. Use /api/test/users and /api/test/listings' });
}
