import { NextResponse } from 'next/server';
import { NextRequest } from 'next/dist/server/web/spec-extension/request';
import { getToken } from 'next-auth/jwt';

export async function withAuth(
  request: NextRequest,
  requiredRoles?: string[]
) {
  const pathname = request.nextUrl.pathname;

  // Get the token from the request
  const token = await getToken({ 
    req: request, 
    secret: process.env.NEXTAUTH_SECRET 
  });

  // If no token and trying to access protected route
  if (!token) {
    // Create redirect URL with return path
    const url = new URL('/auth/signin', request.url);
    url.searchParams.set('callbackUrl', encodeURI(pathname));
    
    return NextResponse.redirect(url);
  }

  // If roles are specified, check if user has required role
  if (requiredRoles && requiredRoles.length > 0) {
    const userRole = token?.role as string || 'user';
    
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
  const token = await getToken({ 
    req: request, 
    secret: process.env.NEXTAUTH_SECRET 
  });

  // If no token
  if (!token) {
    return new NextResponse(
      JSON.stringify({ error: 'Unauthorized - Authentication required' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // If roles are specified, check if user has required role
  if (requiredRoles && requiredRoles.length > 0) {
    const userRole = token?.role as string || 'user';
    
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
