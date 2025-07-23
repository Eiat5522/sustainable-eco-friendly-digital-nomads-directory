import { draftMode, headers } from 'next/headers';
import { redirect } from 'next/navigation';

export async function GET() {
  (await draftMode()).disable();

  // Get the referer header which contains the path of the current page
  const referer = (await headers()).get('referer');
  const path = referer ? new URL(referer).pathname : '/';

  // Redirect to the current path without preview mode
  redirect(path);
}
