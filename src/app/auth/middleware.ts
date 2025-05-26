\
// File: d:/Eiat_Folder/MyProjects/MyOtherProjects/sustainable-eco-friendly-digital-nomads-directory/app-next-directory/src/app/auth/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  // This middleware is placed in src/app/auth/middleware.ts.
  // According to Next.js conventions, it will run for routes under /auth.
  // The matcher below further refines this to only /auth/profile.

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    // User is not authenticated, redirect to login page.
    // Assuming login page is at /auth/login.
    const loginUrl = new URL('/auth/login', request.url);
    // Pass the original URL as a callbackUrl query parameter.
    loginUrl.searchParams.set('callbackUrl', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // User is authenticated, allow the request to proceed.
  return NextResponse.next();
}

export const config = {
  // This matcher ensures the middleware runs *only* for the /auth/profile path.
  // Paths are relative to the app\'s root.
  matcher: ['/auth/profile'],
};
