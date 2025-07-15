import { NextResponse } from 'next/server';
import { NextRequest } from 'next/dist/server/web/spec-extension/request';
import { auth } from '@/lib/auth';

export async function withAuth(
  request: NextRequest,
  requiredRoles?: string[]
) {
  const pathname = request.nextUrl.pathname;

  const session = await auth();

  // If no session and trying to access protected route
  if (!session) {
    // Create redirect URL with return path
    const url = new URL('/auth/signin', request.url);
    url.searchParams.set('callbackUrl', encodeURI(pathname));
    
    return NextResponse.redirect(url);
  }

  // If roles are specified, check if user has required role
  if (requiredRoles && requiredRoles.length > 0) {
    const userRole = session?.user?.role as string || 'user';
    
    if (!requiredRoles.includes(userRole)) {
      // User doesn't have required role, redirect to unauthorized page
      const url = new URL('/auth/unauthorized', request.url);
      return NextResponse.redirect(url);
    }
  }

  // User is authenticated and has required role
  return NextResponse.next();
}

// Helper to protect API routes
export async function withAuthApi(
  request: NextRequest,
  requiredRoles?: string[]
) {
  const session = await auth();

  // If no session
  if (!session) {
    return new NextResponse(
      JSON.stringify({ error: 'Unauthorized - Authentication required' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // If roles are specified, check if user has required role
  if (requiredRoles && requiredRoles.length > 0) {
    const userRole = session?.user?.role as string || 'user';
    
    if (!requiredRoles.includes(userRole)) {
      return new NextResponse(
        JSON.stringify({ 
          error: 'Forbidden - Insufficient permissions',
          requiredRoles,
          userRole
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  // User is authenticated and has required role
  return NextResponse.next();
}
