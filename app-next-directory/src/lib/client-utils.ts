/**
 * Client-safe utility functions
 * These can be safely imported in both client and server components
 */

/**
 * Get a user-facing error message from an unknown error
 */
export function getUserFacingMessage(
  error: unknown,
  fallback = 'Something went wrong. Please try again.'
): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return fallback;
}
