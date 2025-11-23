/**
 * Centralised authentication configuration helpers.
 * These helpers derive behaviour from environment variables so the rest of
 * the auth layer can remain declarative.
 */

/**
 * Determine whether email verification is required for credentials sign-in.
 *
 * Priority order (first match wins):
 * 1. Explicit `AUTH_REQUIRE_EMAIL_VERIFICATION=true|false` override.
 * 2. Presence of a transactional email API key (e.g. RESEND_API_KEY).
 * 3. Fallback to `false` so local development works without email plumbing.
 */
export function isEmailVerificationRequired(): boolean {
  const override = process.env.AUTH_REQUIRE_EMAIL_VERIFICATION?.trim().toLowerCase();
  if (override === 'true') return true;
  if (override === 'false') return false;

  // If an email provider is configured we assume verification should be enforced.
  if (process.env.RESEND_API_KEY) return true;

  return false;
}

/**
 * Admin email allowlist helpers
 * Configure comma/space separated emails via AUTH_ADMIN_EMAILS, e.g.:
 * AUTH_ADMIN_EMAILS="admin@example.com,owner@example.org"
 */
let cachedAdminEmails: string[] | null = null;

export function getAdminEmails(): string[] {
  if (cachedAdminEmails === null) {
    const raw = process.env.AUTH_ADMIN_EMAILS ?? '';
    cachedAdminEmails = raw
      .split(/[\s,]+/)
      .map(s => s.trim().toLowerCase())
      .filter(s => {
        if (s.length === 0) {
          return false;
        }
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
      });
  }
  return cachedAdminEmails;
}

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const e = email.trim().toLowerCase();
  return getAdminEmails().includes(e);
}
