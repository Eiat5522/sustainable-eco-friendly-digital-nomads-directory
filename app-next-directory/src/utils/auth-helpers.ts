import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { ApiResponseHandler } from './api-response';

export async function requireAuth() {
  const session = await getServerSession(authOptions);

  if (!session) {
    ApiResponseHandler.unauthorized(); // Ensure unauthorized handler is called
    throw new Error('UNAUTHORIZED');
  }

  return session;
}

export async function requireRole(allowedRoles: string[]) {
  const session = await requireAuth();

  if (!allowedRoles.includes(session.user.role)) {
    throw new Error('FORBIDDEN');
  }

  return session;
}

export function handleAuthError(error: unknown) {
  // Accepts error as unknown, handles all possible error shapes
  const message =
    (typeof error === 'object' && error !== null && 'message' in error && typeof (error as any).message === 'string')
      ? (error as any).message
      : '';

  if (message === 'UNAUTHORIZED') {
    return ApiResponseHandler.unauthorized();
  }
  if (message === 'FORBIDDEN') {
    return ApiResponseHandler.forbidden();
  }
  // For all other cases (including null, undefined, or objects without message)
  return ApiResponseHandler.error('Authentication error');
}
