import React from 'react';

interface HighlightOptions {
  className?: string;
  caseSensitive?: boolean;
}

const defaultOptions: HighlightOptions = {
  className: 'bg-yellow-100 dark:bg-yellow-900/50',
  caseSensitive: false,
};

export function highlightText(text: string, searchQuery: string, options: HighlightOptions = defaultOptions) {
  if (!searchQuery.trim()) return text;

  const flags = options.caseSensitive ? 'g' : 'gi';
  const escapedQuery = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escapedQuery})`, flags));

  return parts.map((part, i) => {
    const matches = part.toLowerCase() === searchQuery.toLowerCase();
    if (!matches) return part;
    return (
      <mark
        key={`${part}-${i}`}
        className={options.className}
      >
        {part}
      </mark>
    );
  });
}

export function getHighlightedText(text: string, searchQuery: string, options?: HighlightOptions) {
  if (!text || !searchQuery) return text;
  return highlightText(text, searchQuery, options);
}
