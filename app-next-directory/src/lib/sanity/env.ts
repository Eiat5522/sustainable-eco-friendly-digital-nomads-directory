export function isSanityConfigured(): boolean {
  // Allow tests to opt into a "msw" fetch mode where Sanity network
  // calls are intercepted by MSW. This makes it easier for unit tests
  // to simulate Sanity responses without requiring real env vars.
  if (process.env.SANITY_FETCH_MODE === 'msw') return true;

  return Boolean(
    process.env.NEXT_PUBLIC_SANITY_PROJECT_ID && process.env.NEXT_PUBLIC_SANITY_DATASET
  );
}

export function getSanityMissingEnvMessage(): string {
  return 'Sanity environment variables are not configured.';
}
