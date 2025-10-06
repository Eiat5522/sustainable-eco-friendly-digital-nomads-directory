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

  const lastIndexByPrefix = new Map<string, number>();

  tokens.forEach((token, index) => {
    const prefix = token.includes('-') ? token.replace(/-[^-]+$/, '') : token;
    lastIndexByPrefix.set(prefix, index);
  });

  const deduped: string[] = [];
  tokens.forEach((token, index) => {
    const prefix = token.includes('-') ? token.replace(/-[^-]+$/, '') : token;
    if (lastIndexByPrefix.get(prefix) === index) {
      deduped.push(token);
    }
  });

  return deduped.join(' ');
}

export function cn(...inputs: ClassValue[]) {
  const base = clsx(...inputs);
  const merged = twMerge(base);

  if (merged === base) {
    return mergeTailwindFallback(base);
  }

  return merged;
}
