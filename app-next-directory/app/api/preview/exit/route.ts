// API route for disabling preview mode
import { draftMode } from 'next/headers';

export async function GET(req: Request) {
  // FORTEST: guard for prerender - draftMode() may fail during prerender
  try {
    // Disable draft mode
    const draft = await draftMode();
    draft.disable();
  } catch (error) {
    // During prerender, draftMode() may not be available
    return new Response('Preview mode unavailable during build', { status: 503 });
  }

  // Redirect back to the homepage or referrer
  const { searchParams } = new URL(req.url);
  const redirectTo = searchParams.get('redirect') || '/';

  return new Response(null, {
    status: 302,
    headers: {
      Location: new URL(redirectTo, req.url).toString(),
    },
  });
}
