import { draftMode } from 'next/headers';
import { redirect } from 'next/navigation';
import { validatePreviewToken } from '@/lib/sanity.utils';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  const slug = searchParams.get('slug');
  const type = searchParams.get('type');

  // Check the secret and next parameters
  // This secret should be only known to this route handler and the CMS
  if (!validatePreviewToken(secret)) {
    return new Response('Invalid token', { status: 401 });
  }

  if (!slug) {
    return new Response('No slug in the request', { status: 400 });
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(slug)) {
    return new Response('Invalid slug format', { status: 400 });
  }

  if (!type) {
    return new Response('No type in the request', { status: 400 });
  }

  const allowedTypes = ['listing', 'city'] as const;
  const isAllowedType = (t: unknown): t is (typeof allowedTypes)[number] =>
    typeof t === 'string' && (allowedTypes as readonly string[]).includes(t);

  if (!isAllowedType(type)) {
    return new Response('Invalid type parameter', { status: 400 });
  }

  // Enable Draft Mode by setting the cookie
  (await draftMode()).enable();
  // Redirect to the path from the fetched post
  // We don't redirect to searchParams.slug as that might lead to open redirect vulnerabilities
  const pathPrefixMap: Record<(typeof allowedTypes)[number], string> = {
    listing: 'listings',
    city: 'cities',
  };
  const pathPrefix = pathPrefixMap[type];

  const redirectPath = `/${pathPrefix}/${slug}`;
  redirect(redirectPath);
}
