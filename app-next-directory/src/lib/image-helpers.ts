import { SanityImage } from '@/types/appView';

// Default placeholder images
export const PLACEHOLDER_IMAGES = {
  listing: '/images/sustainable_nomads.png',
  city: '/placeholder-city.jpg',
  fallback: '/images/fallback.png'
} as const;

/**
 * Get image URL or fallback placeholder
 */
export function getImageUrlOrPlaceholder(
  image: SanityImage | null | undefined,
  type: keyof typeof PLACEHOLDER_IMAGES = 'fallback'
): string {
  if (!image?.asset?.url) {
    return PLACEHOLDER_IMAGES[type];
  }
  return image.asset.url;
}

/**
 * Check if a Sanity image has a valid asset URL
 */
export function hasValidImageUrl(image: SanityImage | null | undefined): boolean {
  return Boolean(image?.asset?.url);
}

/**
 * Get LQIP (Low Quality Image Placeholder) from Sanity image metadata
 */
export function getLqipFromImage(image: SanityImage | null | undefined): string | undefined {
  return image?.asset?.metadata?.lqip;
}