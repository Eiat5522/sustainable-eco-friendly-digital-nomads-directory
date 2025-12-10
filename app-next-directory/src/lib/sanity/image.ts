import type { SanityImageSource } from '@sanity/image-url/lib/types/types';

export function urlFor(source: SanityImageSource) {
  // Gracefully handle null or undefined sources
  if (
    !source ||
    typeof source !== 'object' ||
    !('asset' in source) ||
    !(source as { asset?: { _ref?: string } }).asset?._ref
  ) {
    return undefined;
  }
  // Dynamic require to avoid circular dependency
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { builder } = require('./client');
  return builder.image(source);
}
