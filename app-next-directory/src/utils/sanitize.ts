// Utility helpers for sanitizing user input for GROQ queries and general usage
// Remove control characters and trim, and optionally limit length
export function sanitizeBasic(input: string, maxLen = 200): string {
  if (typeof input !== 'string') return '';
  // biome-ignore lint/suspicious/noControlCharactersInRegex: Intentionally removing control characters for security
  const trimmed = input.replace(/[\u0000-\u001F\u007F]/g, '').trim();
  return trimmed.length > maxLen ? trimmed.slice(0, maxLen) : trimmed;
}

// Escape for use inside GROQ string literals (equality checks)
// Escape for use inside GROQ string literals (equality checks)
export function escapeGroqLiteral(input: string): string {
  if (typeof input !== 'string') return '';
  // JSON-escape to safely embed as a GROQ string literal (drop surrounding quotes).
  return JSON.stringify(input).slice(1, -1);
}
// Escape for GROQ match patterns (wildcards used by match). We will add any wildcards ourselves,
// so escape user-supplied specials. Keep @ and ! unescaped per tests.
export function escapeGroqMatch(input: string): string {
  if (typeof input !== 'string') return '';
  // First JSON-escape to be safe inside a GROQ string literal.
  const jsonEscaped = JSON.stringify(input).slice(1, -1);
  // Then escape GROQ/regex special chars, including user-supplied * and ?.
  return jsonEscaped.replace(/([.*+?^${}()|[\]\\])/g, '\\$1');
}

// Normalize array-like query params, sanitize, and drop empties/dupes
export function sanitizeStringArray(
  value: string | string[] | undefined,
  opts?: { maxLen?: number }
): string[] {
  const maxLen = opts?.maxLen ?? 100;
  const arr = Array.isArray(value) ? value : value ? [value] : [];
  const out = arr.map(v => sanitizeBasic(String(v), maxLen)).filter(v => v.length > 0);
  // De-duplicate while preserving order
  return Array.from(new Set(out));
}

export function clampInt(
  n: number,
  { min = 1, max = 100 }: { min?: number; max?: number } = {}
): number {
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, Math.trunc(n)));
}
