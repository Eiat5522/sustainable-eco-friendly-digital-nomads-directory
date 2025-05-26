import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useInView } from 'react-intersection-observer'
import imageUrlBuilder from '@sanity/image-url'
import { getClient } from '@/lib/sanity.utils'
import { motion, AnimatePresence } from 'framer-motion'

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
  placeholder?: 'blur' | 'empty' | 'eco'
  onLoad?: () => void
  fill?: boolean
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down'
  fadeInDuration?: number
}

// Size presets for responsive images
export function generateImageSizes(breakpointWidths: { [breakpoint: number]: number }) {
  const sizes = Object.entries(breakpointWidths)
    .map(([breakpoint, width]) => `(max-width: ${breakpoint}px) ${width}vw`)
    .join(', ');
  
  return sizes || '100vw';
}

const builder = imageUrlBuilder(getClient())

// SVG eco-friendly placeholder generator
const generateEcoPlaceholder = () => {
  const leafPattern = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="400" height="300">
      <rect width="400" height="300" fill="#e6f5ec"/>
      <path d="M80,90 C120,40 160,180 200,120 S280,60 320,150" stroke="#4ade80" fill="none" stroke-width="2" opacity="0.3"/>
      <g transform="translate(100, 100)" opacity="0.5">
        <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 2,11.5 2,13.5C2,15.5 3.75,17.25 3.75,17.25C7,8 17,8 17,8Z" fill="#22c55e"/>
      </g>
      <g transform="translate(250, 150)" opacity="0.5">
        <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 2,11.5 2,13.5C2,15.5 3.75,17.25 3.75,17.25C7,8 17,8 17,8Z" fill="#22c55e"/>
      </g>
    </svg>
  `
  
  return `data:image/svg+xml;base64,${Buffer.from(leafPattern).toString('base64')}`;
}

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
  objectFit = 'cover',
  fadeInDuration = 0.5,
}: OptimizedImageProps) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
    rootMargin: '200px',
  })

  // Generate optimized image URL with proper format negotiation
  const imageUrl = image ? builder
    .image(image)
    .auto('format')
    .fit(objectFit)
    .quality(quality)
    .url() : null;
  
  // Generate low-quality placeholder
  const blurDataUrl = image ? builder
    .image(image)
    .width(20)
    .height(fill && width && height ? Math.floor((20 * height) / width) : 15)
    .quality(20)
    .blur(10)
    .url() : null;

  // Eco-friendly placeholder SVG
  const ecoPlaceholder = generateEcoPlaceholder();

  // Handle different placeholder strategies
  const getPlaceholderData = () => {
    if (placeholder === 'blur' && blurDataUrl) {
      return { placeholder: 'blur', blurDataURL: blurDataUrl };
    } else if (placeholder === 'eco') {
      return { placeholder: 'blur', blurDataURL: ecoPlaceholder };
    }
    return {};
  };

  const handleImageLoad = () => {
    setLoaded(true);
    if (onLoad) {
      onLoad();
    }
  };

  const handleImageError = () => {
    setError(true);
  };

  // Download image when in viewport
  useEffect(() => {
    if (inView && !loaded && imageUrl) {
      const img = new window.Image()
      img.src = imageUrl
      img.onload = handleImageLoad
      img.onerror = handleImageError
    }
  }, [inView, imageUrl, loaded])

  if (!image && !imageUrl) {
    return (
      <div 
        className={`bg-gray-200 flex items-center justify-center ${className}`}
        style={{ width: width || '100%', height: height || '100%', position: fill ? 'absolute' : 'relative' }}
      >
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-gray-400">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    )
  }

  if (error) {
    return (
      <div 
        className={`bg-gray-100 flex flex-col items-center justify-center ${className}`}
        style={{ width: width || '100%', height: height || '100%', position: fill ? 'absolute' : 'relative' }}
      >
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-gray-400 mb-2">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <span className="text-xs text-gray-500">Failed to load image</span>
      </div>
    )
  }

  return (
    <div ref={ref} className="relative w-full h-full">
      {inView && (
        <AnimatePresence>
          <motion.div
            className="w-full h-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: loaded ? 1 : 0 }}
            transition={{ duration: fadeInDuration }}
          >
            <Image
              src={imageUrl || ''}
              alt={alt || 'Image'}
              width={fill ? undefined : width}
              height={fill ? undefined : height}
              {...getPlaceholderData()}
              sizes={sizes}
              priority={priority}
              loading={loading}
              className={`${className} ${objectFit === 'cover' ? 'object-cover' : objectFit === 'contain' ? 'object-contain' : ''}`}
              fill={fill}
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
          </motion.div>
        </AnimatePresence>
      )}
      
      {/* Show eco-friendly placeholder until image loads */}
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          {placeholder === 'eco' ? (
            <div
              className="w-full h-full bg-cover bg-center"
              style={{ backgroundImage: `url('${ecoPlaceholder}')` }}
            />
          ) : placeholder === 'blur' && blurDataUrl ? (
            <div
              className="w-full h-full bg-cover bg-center blur-sm"
              style={{ backgroundImage: `url('${blurDataUrl}')` }}
            />
          ) : (
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          )}
        </div>
      )}
    </div>
  )
}
