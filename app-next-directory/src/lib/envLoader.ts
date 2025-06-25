// Centralized, schema-validated environment variable loader.

import { z } from 'zod';

const envSchema = z.object({
  TEST_MONGODB_URI: z.string().url().nonempty(),
  // Add other env vars as needed, with validation.
});

type EnvVars = z.infer<typeof envSchema>;

let cachedEnv: EnvVars | null = null;

/**
 * Loads and validates environment variables once.
 */
function loadEnv(): EnvVars {
  if (cachedEnv) return cachedEnv;
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(
      'Invalid environment variables: ' +
        JSON.stringify(parsed.error.format())
    );
  }
  cachedEnv = parsed.data;
  return cachedEnv;
}

/**
 * Gets the validated test MongoDB URI from environment.
 */
export function getTestDbUri(): string {
  return loadEnv().TEST_MONGODB_URI;
}