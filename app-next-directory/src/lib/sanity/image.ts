import { builder } from './client';
import type { SanityImageSource } from '@sanity/image-url/lib/types/types';

export function urlFor(source: SanityImageSource) {
  // Gracefully handle null or undefined sources
  if (!source || !source.asset || !source.asset._ref) {
    return undefined;
  }
  return builder.image(source);
}