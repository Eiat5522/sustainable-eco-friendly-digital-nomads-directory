import { getToken } from 'next-auth/jwt';
import { NextRequest } from 'next/dist/server/web/spec-extension/request';
import { NextResponse } from 'next/server';
import {
    ACCESS_CONTROL_MATRIX,
    hasFeaturePermission,
    hasPagePermission,
    PagePermissions,
    ROLE_HIERARCHY,
    UserRole
} from '../../types/auth';

/**
 * Advanced authentication middleware using the audit-compliant access control matrix
 * @param request - Next.js request object
 * @param page - Page identifier from the access control matrix
 * @param action - Action to check permission for (canView, canCreate, canEdit, canDelete, canManage)
 * @param isApiRoute - Whether this is an API route (returns JSON responses)
 * @param resourceOwnership - Optional: check if user owns the resource for ownership-based permissions
 */
export async function withAuthMatrix(
  request: NextRequest,
  page?: keyof typeof ACCESS_CONTROL_MATRIX[UserRole]['pages'] | null,
  action?: keyof PagePermissions | null,
  isApiRoute: boolean = false,
  resourceOwnership?: { userId: string; resourceOwnerId: string }
) {
  const pathname = request.nextUrl.pathname;

  // Get the token from the request
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  });

  // Determine user role - default to unidentifiedUser if no token
  const userRole: UserRole = (token?.role as UserRole) || 'unidentifiedUser';

  // For API routes, return JSON responses
  if (isApiRoute) {
    if (!token) {
      return new NextResponse(
        JSON.stringify({
          error: 'Authentication required',
          code: 'AUTH_REQUIRED',
          timestamp: new Date().toISOString()
        }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            'WWW-Authenticate': 'Bearer'
          }
        }
      );
    }

    // For API routes without specific page/action checks, just verify authentication
    if (!page || !action) {
      return NextResponse.next();
    }

    const hasPermission = hasPagePermission(userRole, page, action);

    if (!hasPermission) {
      return new NextResponse(
        JSON.stringify({
          error: 'Insufficient permissions',
          code: 'PERMISSION_DENIED',
          requiredPermission: `${page}.${action}`,
          userRole,
          timestamp: new Date().toISOString()
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    return NextResponse.next();
  }

  // For page routes, handle authentication and permissions

  // If no token and accessing protected routes
  if (!token && page && action) {
    const hasPermission = hasPagePermission('unidentifiedUser', page, action);

    if (!hasPermission) {
      // Create redirect URL with return path
      const url = new URL('/auth/signin', request.url);
      url.searchParams.set('callbackUrl', encodeURI(pathname));
      url.searchParams.set('error', 'Authentication required');

      return NextResponse.redirect(url);
    }
  }

  // If we have specific page and action to check
  if (page && action) {
    const hasPermission = hasPagePermission(userRole, page, action);

    // Handle ownership-based permissions for venue owners
    if (!hasPermission && resourceOwnership && userRole === 'venueOwner') {
      // Allow venue owners to manage their own listings
      if (page === 'editListing' || page === 'manageListing') {
        if (resourceOwnership.userId === resourceOwnership.resourceOwnerId) {
          return NextResponse.next();
        }
      }
    }

    if (!hasPermission) {
      // User doesn't have required permission, redirect to unauthorized page
      const url = new URL('/auth/unauthorized', request.url);
      url.searchParams.set('reason', 'insufficient_permissions');
      url.searchParams.set('required', `${page}.${action}`);
      url.searchParams.set('role', userRole);

      return NextResponse.redirect(url);
    }
  }

  // User is authenticated and has required permissions
  return NextResponse.next();
}

/**
 * Enhanced API route protection with feature-level permissions
 * @param request - Next.js request object
 * @param feature - Feature permission to check
 * @param resourceOwnership - Optional: check if user owns the resource
 */
export async function withAuthApiFeature(
  request: NextRequest,
  feature: keyof typeof ACCESS_CONTROL_MATRIX[UserRole]['features'],
  resourceOwnership?: { userId: string; resourceOwnerId: string }
) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  });

  // If no token
  if (!token) {
    return new NextResponse(
      JSON.stringify({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED',
        timestamp: new Date().toISOString()
      }),
      {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'WWW-Authenticate': 'Bearer'
        }
      }
    );
  }

  const userRole: UserRole = (token?.role as UserRole) || 'defaultUser';
  const hasPermission = hasFeaturePermission(userRole, feature);

  // Handle ownership-based permissions
  if (!hasPermission && resourceOwnership) {
    const ownPermissions = ['editOwnListings', 'deleteOwnListings', 'editOwnReviews', 'deleteOwnReviews', 'editOwnProfile'];

    if (ownPermissions.includes(feature) && resourceOwnership.userId === resourceOwnership.resourceOwnerId) {
      return NextResponse.next();
    }
  }

  if (!hasPermission) {
    return new NextResponse(
      JSON.stringify({
        error: 'Insufficient permissions',
        code: 'PERMISSION_DENIED',
        requiredFeature: feature,
        userRole,
        timestamp: new Date().toISOString()
      }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  return NextResponse.next();
}

/**
 * Check if user has minimum required role level
 * @param request - Next.js request object
 * @param requiredRole - Minimum required role
 * @param isApiRoute - Whether this is an API route
 */
export async function withMinimumRole(
  request: NextRequest,
  requiredRole: UserRole,
  isApiRoute: boolean = false
) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  });

  const userRole: UserRole = (token?.role as UserRole) || 'unidentifiedUser';
  const hasMinimumRole = ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];

  if (isApiRoute) {
    if (!token) {
      return new NextResponse(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!hasMinimumRole) {
      return new NextResponse(
        JSON.stringify({
          error: 'Insufficient role level',
          requiredRole,
          userRole,
          timestamp: new Date().toISOString()
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } else {
    if (!token && requiredRole !== 'unidentifiedUser') {
      const url = new URL('/auth/signin', request.url);
      url.searchParams.set('callbackUrl', encodeURI(request.nextUrl.pathname));
      return NextResponse.redirect(url);
    }

    if (!hasMinimumRole) {
      const url = new URL('/auth/unauthorized', request.url);
      url.searchParams.set('reason', 'insufficient_role');
      url.searchParams.set('required', requiredRole);
      url.searchParams.set('current', userRole);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

/**
 * Utility to extract user information from token for use in API routes
 */
export async function getUserFromToken(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  });

  if (!token) {
    return null;
  }

  return {
    id: token.id as string,
    email: token.email as string,
    name: token.name as string,
    role: (token.role as UserRole) || 'defaultUser',
    permissions: ACCESS_CONTROL_MATRIX[(token.role as UserRole) || 'defaultUser']
  };
}

// Legacy compatibility - keep the old withAuth function but mark as deprecated
/** @deprecated Use withAuthMatrix instead for audit compliance */
export async function withAuth(
  request: NextRequest,
  requiredRoles?: string[]
) {
  console.warn('withAuth is deprecated. Use withAuthMatrix for audit compliance.');

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  });

  if (!token) {
    const url = new URL('/auth/signin', request.url);
    url.searchParams.set('callbackUrl', encodeURI(request.nextUrl.pathname));
    return NextResponse.redirect(url);
  }

  if (requiredRoles && requiredRoles.length > 0) {
    const userRole = token?.role as string || 'defaultUser';

    // Map old role names to new ones
    const roleMapping: Record<string, UserRole> = {
      'admin': 'systemAdministrator',
      'editor': 'systemAdministrator',
      'venueOwner': 'venueOwner',
      'user': 'registeredUser'
    };

    const mappedRole = roleMapping[userRole] || 'defaultUser';
    const mappedRequiredRoles = requiredRoles.map(r => roleMapping[r] || r);

    if (!mappedRequiredRoles.includes(mappedRole)) {
      const url = new URL('/auth/unauthorized', request.url);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}
