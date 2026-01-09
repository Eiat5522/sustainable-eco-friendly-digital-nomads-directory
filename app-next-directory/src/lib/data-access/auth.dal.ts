/**
 * Auth Data Access Layer (DAL)
 *
 * Centralizes all authentication-related data fetching with Next.js 16 caching.
 * Uses 'use cache: private' directive for user-specific data that needs
 * access to cookies() and session state.
 *
 * Design principles:
 * - Single source of truth for auth-related data operations
 * - Uses 'use cache: private' for per-user browser caching
 * - Allows cookies() access within cached functions
 * - Type-safe: no `any` types
 * - Testable: can be mocked for unit tests
 */

import 'server-only';

import { cacheLife, cacheTag } from 'next/cache';
import { cookies } from 'next/headers';
import { auth } from '@/lib/auth';
import { structuredLogger as logger } from '@/lib/logger';

// ============================================================================
// Types
// ============================================================================

export interface AuthUser {
  id: string;
  email: string | null;
  name: string | null;
  image: string | null;
  role: 'user' | 'admin' | 'superAdmin' | 'venueOwner' | 'premium';
}

export interface AuthStatus {
  isAuthenticated: boolean;
  isAdmin: boolean;
  user: AuthUser | null;
}

export interface UserDisplayInfo {
  displayName: string;
  shortName: string;
  initials: string;
}
// ============================================================================
// Role & Privilege Helpers
// ============================================================================

const VALID_ROLES = ['user', 'admin', 'superAdmin', 'venueOwner', 'premium'] as const;

export function isValidRole(role: unknown): role is AuthUser['role'] {
  return typeof role === 'string' && VALID_ROLES.includes(role as AuthUser['role']);
}

/**
 * Check if a role has admin access (admin or superAdmin).
 */
export function isUserAdmin(role: string): boolean {
  return isValidRole(role) && (role === 'admin' || role === 'superAdmin');
}

/**
 * Check if a role has a specific privilege.
 */
export function hasPrivilege(role: string, privilege: string): boolean {
  if (!isValidRole(role)) return false;

  // extensible privilege logic
  switch (privilege) {
    case 'admin':
      return isUserAdmin(role);
    default:
      return false;
  }
}

// ============================================================================
// Internal Helpers
// ============================================================================

/**
 * Extract initials from a name string
 */
function getInitials(name: string | null | undefined): string {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  const firstPart = parts[0];
  if (parts.length === 1) {
    return firstPart ? firstPart.slice(0, 2).toUpperCase() : '??';
  }
  const lastPart = parts[parts.length - 1];
  const firstChar = firstPart?.[0] ?? '?';
  const lastChar = lastPart?.[0] ?? '?';
  return (firstChar + lastChar).toUpperCase();
}

/**
 * Extract short name (first name) from full name
 */
function getShortName(name: string | null | undefined): string {
  if (!name || !name.trim()) return '';
  const parts = name.trim().split(/\s+/);
  return parts[0] || '';
}

// ============================================================================
// Public DAL Functions
// ============================================================================

/**
 * Get current user's authentication status
 * Uses 'use cache: private' for per-user browser caching with cookie access
 *
 * @returns AuthStatus object with authentication state
 */
export async function getAuthStatus(): Promise<AuthStatus> {
  'use cache: private';
  cacheLife({ stale: 60 }); // Cache for 60 seconds per user browser

  // Verify session cookie exists
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('authjs.session-token') ||
      cookieStore.get('__Secure-authjs.session-token');

    if (!sessionCookie) {
      return {
        isAuthenticated: false,
        isAdmin: false,
        user: null,
      };
    }
  } catch {
    // cookies() may throw during static generation
    return {
      isAuthenticated: false,
      isAdmin: false,
      user: null,
    };
  }

  try {
    const session = await auth();

    if (!session?.user?.id) {
      return {
        isAuthenticated: false,
        isAdmin: false,
        user: null,
      };
    }

    const userId = session.user.id;
    cacheTag(`user-${userId}-auth`);

    const role = isValidRole(session.user.role) ? session.user.role : 'user';
    const isAdmin = isUserAdmin(role);

    return {
      isAuthenticated: true,
      isAdmin,
      user: {
        id: userId,
        email: session.user.email ?? null,
        name: session.user.name ?? null,
        image: session.user.image ?? null,
        role,
      },
    };
  } catch (error) {
    logger.error('Failed to get auth status', error, {
      component: 'auth.dal',
    });
    return {
      isAuthenticated: false,
      isAdmin: false,
      user: null,
    };
  }
}

/**
 * Get display information for the current user
 * Uses 'use cache: private' for per-user browser caching
 *
 * @param fallbackLabel - Label to use when not authenticated
 * @returns UserDisplayInfo object
 */
export async function getUserDisplayInfo(
  fallbackLabel = 'your account'
): Promise<UserDisplayInfo> {
  'use cache: private';
  cacheLife({ stale: 60 });

  const authStatus = await getAuthStatus();

  if (!authStatus.isAuthenticated || !authStatus.user) {
    return {
      displayName: fallbackLabel,
      shortName: '',
      initials: '??',
    };
  }

  const { name, email } = authStatus.user;
  const displayName = name || email || fallbackLabel;
  const shortName = getShortName(name);
  const initials = getInitials(name);

  return {
    displayName,
    shortName,
    initials,
  };
}

/**
 * Check if the current user has admin privileges
 *
 * @returns boolean indicating admin status
 */
export async function isUserAdmin(): Promise<boolean> {
  const authStatus = await getAuthStatus();
  return authStatus.isAdmin;
}

/**
 * Get current user ID if authenticated
 *
 * @returns User ID string or null if not authenticated
 */
export async function getCurrentUserId(): Promise<string | null> {
  const authStatus = await getAuthStatus();
  return authStatus.user?.id ?? null;
}
