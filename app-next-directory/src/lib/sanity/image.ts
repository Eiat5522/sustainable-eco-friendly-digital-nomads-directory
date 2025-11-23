import type { SanityImageSource } from '../../types/external/sanity-image';
import { builder } from './client';

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
  return builder.image(source);
}
