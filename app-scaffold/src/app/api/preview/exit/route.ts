// API route for disabling preview mode
import { draftMode } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  // Disable draft mode
  draftMode().disable();

  // Redirect back to the homepage or referrer
  const { searchParams } = new URL(req.url);
  const redirectTo = searchParams.get('redirect') || '/';

  return NextResponse.redirect(new URL(redirectTo, req.url));
}
