export function isSanityConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SANITY_PROJECT_ID && process.env.NEXT_PUBLIC_SANITY_DATASET);
}

export function getSanityMissingEnvMessage(): string {
  return 'Sanity environment variables are not configured.';
}
