// Utility helpers for sanitizing user input for GROQ queries and general usage

// Remove control characters and trim, and optionally limit length
export function sanitizeBasic(input: string, maxLen = 200): string {
  if (typeof input !== 'string') return '';
  const trimmed = input.replace(/[\u0000-\u001F\u007F]/g, '').trim();
  return trimmed.length > maxLen ? trimmed.slice(0, maxLen) : trimmed;
}

// Escape for use inside GROQ string literals (equality checks)
export function escapeGroqLiteral(input: string): string {
  if (typeof input !== 'string') return '';
  // JSON-escape to safely embed as a GROQ string literal.
// Escape for GROQ match patterns (wildcards used by match). We preserve '*' we add, so we escape any user-supplied specials.
export function escapeGroqMatch(input: string): string {
  if (typeof input !== 'string') return '';
  // Escape regex/glob specials and the quote; we'll add any wildcards ourselves.
  return input.replace(/[.*+?^${}()|[\]\\"]/g, '\\  return JSON.stringify(input).slice(1, -1);
}

// Escape for GROQ match patterns (wildcards used by match). We preserve '*' we add, so we escape any user-supplied specials.
export function escapeGroqMatch(input: string): string {
  if (typeof input !== 'string') return '';');
}
  // Escape characters with special meaning to GROQ/regex-like match
  // Keep common punctuation like @ and ! unescaped to preserve user intent in tests
  return input.replace(/[\\"*\[\](){}|&<>=~^$#%]/g, '\\$&');
}

// Normalize array-like query params, sanitize, and drop empties/dupes
export function sanitizeStringArray(value: string | string[] | undefined, opts?: { maxLen?: number }): string[] {
  const maxLen = opts?.maxLen ?? 100;
  const arr = Array.isArray(value) ? value : value ? [value] : [];
  const out = arr
    .map((v) => sanitizeBasic(String(v), maxLen))
    .filter((v) => v.length > 0);
  // De-duplicate while preserving order
  return Array.from(new Set(out));
}

export function clampInt(n: number, { min = 1, max = 100 }: { min?: number; max?: number } = {}): number {
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, Math.trunc(n)));
}


