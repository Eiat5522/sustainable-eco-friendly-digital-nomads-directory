// API route for disabling preview mode
import { draftMode } from 'next/headers';
import { NextRequest } from 'next/dist/server/web/spec-extension/request';
import { NextResponse } from 'next/dist/server/web/spec-extension/response';

export async function GET(req: NextRequest) {
  // Disable draft mode
  draftMode().disable();

  // Redirect back to the homepage or referrer
  const { searchParams } = new URL(req.url);
  const redirectTo = searchParams.get('redirect') || '/';

  return NextResponse.redirect(new URL(redirectTo, req.url));
}
