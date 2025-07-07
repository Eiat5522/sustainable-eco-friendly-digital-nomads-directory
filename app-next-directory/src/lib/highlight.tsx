import React from 'react';

interface HighlightOptions {
  className?: string;
  caseSensitive?: boolean;
}

const defaultOptions: HighlightOptions = {
  className: 'bg-yellow-100 dark:bg-yellow-900/50',
  caseSensitive: false,
};

export function highlightText(
  text: string | null | undefined,
  searchQuery: string | null | undefined,
  options?: HighlightOptions | null
): string | React.ReactNode {
  // Always return a string for empty/null/undefined text
  if (text == null || text === '') return '';
  // If searchQuery is null/undefined/empty, return text as string
  if (searchQuery == null || searchQuery === '' || typeof searchQuery !== 'string' || !searchQuery.trim()) {
    return String(text);
  }
  // Defensive: handle options null/undefined
  const opts = options == null ? defaultOptions : options;

  const flags = opts.caseSensitive ? 'g' : 'gi';
  const escapedQuery = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const strText = String(text);
  const parts = strText.split(new RegExp(`(${escapedQuery})`, flags));

  // If no match, return original string
  if (parts.length === 1) return strText;

  // Only return an array if highlighting is needed
  return parts.map((part, i) => {
    const matches = opts.caseSensitive
      ? part === searchQuery
      : part.toLowerCase() === searchQuery.toLowerCase();
    if (!matches) return part;
    return (
      <mark
        key={`${part}-${i}`}
        className={opts.className}
      >
        {part}
      </mark>
    );
  });
}

export function getHighlightedText(
  text: string | null | undefined,
  searchQuery: string | null | undefined,
  options?: HighlightOptions | null
) {
  // Defensive: match highlightText signature
  return highlightText(text, searchQuery, options);
}
