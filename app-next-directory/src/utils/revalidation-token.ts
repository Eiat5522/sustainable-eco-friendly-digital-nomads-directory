/**
 * Centralized revalidation token helper with fail-fast behavior.
 * 
 * This module provides a single source of truth for the revalidation token,
 * normalizing environment variable casing and validating token presence at startup.
 * 
 * The helper checks for both REVALIDATION_TOKEN (conventional uppercase) and
 * revalidationToken (legacy lowercase) for backward compatibility.
 */

let cachedToken: string | null = null;
let tokenInitialized = false;

/**
 * Gets the revalidation token from environment variables.
 * Checks REVALIDATION_TOKEN first (conventional naming), then falls back to revalidationToken.
 * 
 * @param options - Configuration options
 * @param options.required - If true, throws an error when token is not found (default: true in production)
 * @returns The revalidation token or null if not required and not found
 * @throws Error if token is required but not found
 */
export function getRevalidationToken(options?: { required?: boolean }): string | null {
  // Default: require token in production, optional in test/development
  const isRequired = options?.required ?? process.env.NODE_ENV === 'production';
  
  // Return cached token if already initialized
  if (tokenInitialized) {
    if (isRequired && !cachedToken) {
      throw new Error(
        'REVALIDATION_TOKEN is required but not configured. ' +
        'Set REVALIDATION_TOKEN environment variable to enable ISR cache revalidation.'
      );
    }
    return cachedToken;
  }

  // Check both naming conventions (uppercase first, then lowercase for backward compatibility)
  const token = process.env.REVALIDATION_TOKEN || process.env.revalidationToken || null;
  
  cachedToken = token;
  tokenInitialized = true;

  if (isRequired && !cachedToken) {
    throw new Error(
      'REVALIDATION_TOKEN is required but not configured. ' +
      'Set REVALIDATION_TOKEN environment variable to enable ISR cache revalidation.'
    );
  }

  return cachedToken;
}

/**
 * Validates if a provided token matches the configured revalidation token.
 * 
 * @param token - The token to validate
 * @returns true if the token is valid, false otherwise
 */
export function validateRevalidationToken(token: string | null | undefined): boolean {
  if (!token) {
    return false;
  }

  const expectedToken = getRevalidationToken({ required: false });
  
  // If no token is configured, reject all attempts
  if (!expectedToken) {
    return false;
  }

  // Case-sensitive comparison
  return token === expectedToken;
}

/**
 * Resets the cached token (for testing purposes only).
 * @internal
 */
export function _resetTokenCache(): void {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('_resetTokenCache can only be called in test environment');
  }
  cachedToken = null;
  tokenInitialized = false;
}
