// API route for enabling preview mode
import { NextRequest, NextResponse } from 'next/server';
import { draftMode } from 'next/headers';

export async function GET(req: NextRequest) {
  // Parse query parameters from the URL
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get('secret');
  const slug = searchParams.get('slug');
  const documentType = searchParams.get('type') || 'listing';

  // Check the secret and slug parameters
  if (secret !== process.env.SANITY_PREVIEW_SECRET) {
    return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
  }

  if (!slug) {
    return NextResponse.json({ message: 'No slug provided' }, { status: 401 });
  }

  // Enable draft mode
  draftMode().enable();

  // Redirect to the path of the document being previewed
  return NextResponse.redirect(new URL(`/${documentType}s/${slug}`, req.url));
}
