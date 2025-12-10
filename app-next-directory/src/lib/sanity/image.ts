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
  const { builder } = require('./client');
  return builder.image(source);
}
