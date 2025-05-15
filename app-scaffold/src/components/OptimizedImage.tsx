import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useInView } from 'react-intersection-observer'
import { imageUrlBuilder } from '@sanity/image-url'
import { getClient } from '@/lib/sanity.utils'

interface OptimizedImageProps {
  image: any // Sanity image reference
  alt: string
  width?: number
  height?: number
  sizes?: string
  priority?: boolean
  className?: string
  quality?: number
  loading?: 'lazy' | 'eager'
  placeholder?: 'blur' | 'empty'
  onLoad?: () => void
  fill?: boolean
}

const builder = imageUrlBuilder(getClient())

export function OptimizedImage({
  image,
  alt,
  width,
  height,
  sizes = '100vw',
  priority = false,
  className = '',
  quality = 85,
  loading = 'lazy',
  placeholder = 'empty',
  onLoad,
  fill = false,
}: OptimizedImageProps) {
  const [loaded, setLoaded] = useState(false)
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0,
  })

  const imageUrl = builder.image(image).url()
  const blurDataUrl = builder.image(image).width(10).quality(20).blur(50).url()

  useEffect(() => {
    if (inView && !loaded) {
      const img = new window.Image()
      img.src = imageUrl
      img.onload = () => {
        setLoaded(true)
        onLoad?.()
      }
    }
  }, [inView, imageUrl, loaded, onLoad])

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden ${className}`}
      style={fill ? { width: '100%', height: '100%' } : undefined}
    >
      {inView && (
        <Image
          src={imageUrl}
          alt={alt}
          width={width}
          height={height}
          sizes={sizes}
          priority={priority}
          quality={quality}
          loading={loading}
          className={`transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          placeholder={placeholder}
          blurDataURL={placeholder === 'blur' ? blurDataUrl : undefined}
          fill={fill}
          style={{
            objectFit: fill ? 'cover' : undefined,
          }}
        />
      )}
    </div>
  )
}

// Helper function to generate responsive image sizes
export function generateImageSizes(breakpoints: { [key: string]: number }) {
  return Object.entries(breakpoints)
    .map(([breakpoint, size]) => `(min-width: ${breakpoint}px) ${size}px`)
    .join(', ')
}

// Example usage:
// const imageSizes = generateImageSizes({
//   320: 100,   // 100% width on mobile
//   768: 50,    // 50% width on tablet
//   1024: 33.3, // 33.3% width on desktop
// })
