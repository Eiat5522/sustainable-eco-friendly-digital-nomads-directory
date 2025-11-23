import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { ApiResponseHandler } from './api-response';

export async function requireAuth() {
  const session = await getServerSession(authOptions);

  if (!session) {
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

export function handleAuthError(error: Error) {
  if (error.message === 'UNAUTHORIZED') {
    return ApiResponseHandler.unauthorized();
  }
  if (error.message === 'FORBIDDEN') {
    return ApiResponseHandler.forbidden();
  }
  return ApiResponseHandler.error('Authentication error');
}
