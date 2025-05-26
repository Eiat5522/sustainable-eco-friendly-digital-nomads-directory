import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function updateSessionActivity(request: NextRequest) {
  // Temporarily disabled session tracking
  return NextResponse.next();
}
