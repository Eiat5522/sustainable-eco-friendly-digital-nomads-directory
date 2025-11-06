import { logger } from '@/lib/logger';
import { ApiResponseHandler } from '@/utils/api-response';

export type ErrorContext = {
  scope: string;
  action?: string;
  userId?: string;
  component?: string;
  details?: Record<string, unknown>;
};

function normalizeError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }
  if (typeof error === 'string') {
    return new Error(error);
  }
  return new Error('Unknown error');
}

export function logError(error: unknown, context: ErrorContext): void {
  const normalized = normalizeError(error);
  logger.error({
    err: normalized,
    scope: context.scope,
    action: context.action,
    userId: context.userId,
    component: context.component,
    details: context.details,
  }, normalized.message);
}

export function createRouteError(
  error: unknown,
  context: ErrorContext,
  fallbackMessage: string,
  status = 500
): Response {
  logError(error, context);
  return ApiResponseHandler.error(fallbackMessage, status);
}

export function getUserFacingMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return fallback;
}
