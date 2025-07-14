import { NextResponse } from 'next/dist/server/web/spec-extension/response';

export async function POST() {
  // Temporarily return success without MongoDB interaction
  return NextResponse.json({ success: true });
}
