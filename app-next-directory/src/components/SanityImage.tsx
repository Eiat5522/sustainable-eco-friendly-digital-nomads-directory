import Image from 'next/image';
// ImageProps is not exported from next/image in Next.js 13+.
// Use React.ComponentProps<typeof Image> for type safety.
export type ImageProps = React.ComponentProps<typeof Image>;
import { urlFor } from '../lib/sanity/image';
import type { SanityImageSource } from '@sanity/image-url/lib/types/types';

export type SanityImageProps = Omit<ImageProps, 'src' | 'alt'> & {
  image?: SanityImageSource | null;
  alt?: string | null;
  width?: number;
  height?: number;
  fallbackSrc?: string;
  fallbackAlt?: string;
};

export function SanityImage({
  image,
  alt,
  width = 400,
  height = 300,
  fallbackSrc = '/images/fallback.png',
  fallbackAlt = 'Image unavailable',
  ...rest
}: SanityImageProps) {
  const src = image ? urlFor(image)?.width(width).height(height).url() : fallbackSrc;
  const validAlt = alt && alt.trim() ? alt : fallbackAlt;

  // Extract onError and fill from rest props
  const { onError: userOnError, fill, ...imageProps } = rest;
  
  return (
    <Image
      src={src || fallbackSrc}
      alt={validAlt}
      {...imageProps}
      {...(fill ? { fill } : { width, height })}
      onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
        if (e.currentTarget.src !== fallbackSrc) {
          e.currentTarget.src = fallbackSrc;
        }
        if (typeof userOnError === 'function') {
          userOnError(e);
        }
      }}
    />
  );
}
export default SanityImage;
