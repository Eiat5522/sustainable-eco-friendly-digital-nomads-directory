import { builder } from './client';
import type { SanityImageSource } from '@sanity/image-url/lib/types/types';

export function urlFor(source: SanityImageSource) {
  // Gracefully handle null or undefined sources
  if (
    !source ||
    typeof source !== 'object' ||
    !('asset' in source) ||
    !(source as any).asset._ref
  ) {
    return undefined;
  }
  return builder.image(source);
}