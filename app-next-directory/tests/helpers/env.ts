/**
 * Retrieves a required environment variable for the test suite.
 * Throws an error with a helpful message if the value is missing or empty.
 */
export function getRequiredTestEnvVar(key: string, options?: { description?: string }): string {
  const rawValue = process.env[key];

  if (typeof rawValue === 'string' && rawValue.length > 0) {
    return rawValue;
  }

  const hint = options?.description ? ` (${options.description})` : '';

  throw new Error(`Missing required test environment variable "${key}"${hint}.`);
}

/**
 * Returns an environment variable or a fallback value when it is not provided.
 */
export function getOptionalTestEnvVar(key: string, fallback: string): string {
  const rawValue = process.env[key];
  return typeof rawValue === 'string' && rawValue.length > 0 ? rawValue : fallback;
}
