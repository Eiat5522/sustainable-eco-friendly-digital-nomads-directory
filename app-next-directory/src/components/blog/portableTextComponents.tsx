import Image from 'next/image';
import type { PortableTextComponents } from '@portabletext/react';
import { imageOrFallback } from '@/lib/dto-transformer';

interface PortableTextImageValue {
  asset?: {
    url?: string | null;
    metadata?: {
      dimensions?: {
        width?: number | null;
        height?: number | null;
      } | null;
    } | null;
  } | null;
  alt?: unknown;
  caption?: unknown;
}

const DEFAULT_WIDTH = 1200;
const DEFAULT_HEIGHT = 800;

const getDimensions = (value?: PortableTextImageValue) => {
  const rawWidth = value?.asset?.metadata?.dimensions?.width ?? undefined;
  const rawHeight = value?.asset?.metadata?.dimensions?.height ?? undefined;
  const width = Number.isFinite(rawWidth) ? Math.round(rawWidth) : DEFAULT_WIDTH;
  const height = Number.isFinite(rawHeight) ? Math.round(rawHeight) : DEFAULT_HEIGHT;
  return { width, height };
};

const getText = (value: PortableTextImageValue | undefined) => {
  const alt = typeof value?.alt === 'string' ? value.alt.trim() : '';
  const caption = typeof value?.caption === 'string' ? value.caption.trim() : '';
  return {
    altText: alt || caption || 'Blog illustration',
    caption: caption || null,
  };
};

export const blogPortableTextComponents: PortableTextComponents = {
  types: {
    image: ({ value }) => {
      const imageValue = (value ?? undefined) as PortableTextImageValue | undefined;
      const { width, height } = getDimensions(imageValue);
      const { altText, caption } = getText(imageValue);
      const src = imageOrFallback(imageValue, width, height);

      return (
        <figure className="my-10 flex flex-col items-center gap-3">
          <div className="relative w-full overflow-hidden rounded-xl border border-black/10 bg-neo-surface">
            <Image
              src={src}
              alt={altText}
              width={width}
              height={height}
              sizes="(min-width: 1024px) 800px, 100vw"
              className="h-auto w-full object-cover"
            />
          </div>
          {caption ? (
            <figcaption className="text-sm text-neo-text-secondary">{caption}</figcaption>
          ) : null}
        </figure>
      );
    },
  },
};
