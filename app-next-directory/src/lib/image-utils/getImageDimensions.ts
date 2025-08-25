import type { SanityImage } from '@/types/sanity.types';

export type ImageDimensions = {
  width?: number;
  height?: number;
  aspectRatio?: number;
};

/**
 * Safely extract dimensions from a Sanity image object without assuming metadata is present.
 * Returns undefined fields when dimensions are missing.
 */
export function getImageDimensions(image?: SanityImage | null): ImageDimensions {
  if (!image || !image.asset) return {};
  const maybeMeta = (image.asset as any).metadata;
  if (maybeMeta && maybeMeta.dimensions && typeof maybeMeta.dimensions.width === 'number') {
    const width = maybeMeta.dimensions.width as number;
    const height = maybeMeta.dimensions.height as number | undefined;
    const aspectRatio = height && height > 0 ? width / height : undefined;
    return { width, height, aspectRatio };
  }
  return {};
}
