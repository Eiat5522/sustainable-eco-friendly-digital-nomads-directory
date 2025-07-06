import { builder } from './client';
import type { SanityImageSource } from '@sanity/image-url/lib/types/types';

export function urlFor(source: SanityImageSource) {
  // Gracefully handle null or undefined sources
  if (!source) {
    return undefined;
  }
  return builder.image(source);
}