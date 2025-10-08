import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function mergeTailwindFallback(value: string): string {
  if (!value) {
    return '';
  }

  const tokens = value
    .split(/\s+/)
    .map(token => token.trim())
    .filter(Boolean);

  if (tokens.length <= 1) {
    return tokens.join(' ');
  }

  const seen = new Set<string>();
  const deduped: string[] = [];

  for (let index = tokens.length - 1; index >= 0; index -= 1) {
    const token = tokens[index];
    if (!seen.has(token)) {
      seen.add(token);
      deduped.push(token);
    }
  }

  return deduped.reverse().join(' ');
}

export function cn(...inputs: ClassValue[]) {
  const base = clsx(...inputs);
  const merged = twMerge(base);

  if (merged === base) {
    return mergeTailwindFallback(base);
  }

  return merged;
}
