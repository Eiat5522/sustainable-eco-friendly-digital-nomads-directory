import { NextResponse } from 'next/server';

export async function POST() {
  // Temporarily return success without MongoDB interaction
  return NextResponse.json({ success: true });
}
