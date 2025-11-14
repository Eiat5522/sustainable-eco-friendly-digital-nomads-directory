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

  const getVariantAndUtility = (token: string): { variant: string; utility: string } => {
    const segments = token.split(':');
    if (segments.length === 1) {
      return { variant: '', utility: token };
    }

    const utility = segments.pop() ?? '';
    return {
      variant: segments.join(':'),
      utility,
    };
  };

  const getUtilityKey = (token: string): string => {
    const { variant, utility } = getVariantAndUtility(token);
    const negative = utility.startsWith('-');
    const stripped = negative ? utility.slice(1) : utility;
    const parts = stripped.split('-').filter(Boolean);

    let base = stripped;
    if (parts.length > 1) {
      const lastPart = parts[parts.length - 1] ?? '';
      const trimmedBase = parts.slice(0, -1).join('-');
      // Only strip the last part if it's a number, arbitrary value, or size
      // Keep named values like 'ring' in 'ring-ring' or 'blue' in 'bg-blue'
      if (/^\d+$/.test(lastPart) || /^\[.+\]$/.test(lastPart) || 
          ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl', '7xl', '8xl', '9xl'].includes(lastPart)) {
        const fallbackPart = parts[0] ?? stripped;
        base = trimmedBase || fallbackPart;
      }
    }

    if (negative && base) {
      base = `-${base}`;
    }

    return variant ? `${variant}:${base}` : base;
  };

  const result = [...tokens];
  const positions = new Map<string, number>();

  tokens.forEach((token, index) => {
    const key = getUtilityKey(token);
    const existingIndex = positions.get(key);

    if (existingIndex !== undefined) {
      result[existingIndex] = token;
      result[index] = '';
    } else {
      positions.set(key, index);
    }
  });

  return result.filter(Boolean).join(' ');
}

export function cn(...inputs: ClassValue[]) {
  const base = clsx(...inputs);
  const merged = twMerge(base);

  if (merged === base) {
    return mergeTailwindFallback(base);
  }

  return merged;
}
