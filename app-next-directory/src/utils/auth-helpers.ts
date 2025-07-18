import type { Session } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { auth } from '@/lib/auth';
import { ApiResponseHandler } from './api-response';

export async function requireAuth() {
  const session = await auth();

  if (!session) {
    throw new Error('UNAUTHORIZED');
  }

  return session;
}

export async function requireRole(allowedRoles: string[]): Promise<Session> {
  const session = await requireAuth();
  // If allowedRoles is empty, always forbidden
  if (!Array.isArray(allowedRoles) || allowedRoles.length === 0) {
    throw new Error('FORBIDDEN');
  }
  // If session.user.role is missing, forbidden
  if (!session.user || typeof session.user.role !== 'string') {
    throw new Error('FORBIDDEN');
  }
  // Case-sensitive match
  if (!allowedRoles.includes(session.user.role)) {
    throw new Error('FORBIDDEN');
  }
  return session;
}

export function handleAuthError(error: unknown) {
  const message = (error && typeof error === 'object' && 'message' in error && typeof (error as any).message === 'string')
    ? (error as any).message
    : '';

  if (message === 'UNAUTHORIZED') {
    return ApiResponseHandler.unauthorized();
  }
  if (message === 'FORBIDDEN') {
    return ApiResponseHandler.forbidden();
  }
  // For all other errors, return a generic authentication error
  return ApiResponseHandler.error('Authentication error');
}
