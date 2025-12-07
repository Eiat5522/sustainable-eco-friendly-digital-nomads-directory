"use client";
import { useState, useEffect } from 'react';
import Image from 'next/image';

interface ImageGalleryProps {
  images: string[];
  alt: string;
}

export function ImageGallery({ images, alt }: ImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set([0]));
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set());

  // Enhanced preload functionality
  useEffect(() => {
    let isMounted = true;
    
    const preloadImages = async () => {
      for (let i = 1; i <= 2; i++) {
        const nextIndex = (selectedImage + i) % images.length;
        if (!loadedImages.has(nextIndex)) {
          try {
            await new Promise<void>((resolve, reject) => {
              if (!isMounted) return;
              const img = new window.Image();
              img.onload = () => resolve();
              img.onerror = () => reject();
              img.src = images[nextIndex];
            });
            if (isMounted) {
              setLoadedImages(prev => new Set([...prev, nextIndex]));
            }
          } catch (error) {
            if (isMounted) {
              console.error(`Failed to preload image at index ${nextIndex}`);
              setFailedImages(prev => new Set([...prev, nextIndex]));
            }
          }
        }
      }
    };

    preloadImages();
    return () => {
      isMounted = false;
    };
  }, [selectedImage, images, loadedImages]);

  // Handle image selection
  const handleImageSelect = (index: number) => {
    setIsLoading(true);
    setSelectedImage(index);
  };

  // Handle empty images array
  if (!images.length) {
    return (
      <div className="relative h-72 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
        <div className="flex items-center justify-center h-full">
          <span className="text-gray-400 dark:text-gray-500">No image available</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div
        className="relative"
        onMouseEnter={() => setIsZoomed(true)}
        onMouseLeave={() => setIsZoomed(false)}
      >
        <div className={`relative h-72 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden transition-transform duration-300 ${
          isZoomed ? 'scale-110' : 'scale-100'
        }`}>
          {/* Loading Shimmer */}
          <div 
            className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent
              ${isLoading ? 'animate-shimmer opacity-100' : 'opacity-0'}`}
            style={{ 
              backgroundSize: '200% 100%'
            }}
          />

          <Image
            src={images[selectedImage]}
            alt={`${alt} - Image ${selectedImage + 1}`}
            fill
            className={`object-cover transition-opacity duration-500 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
            onLoadingComplete={() => {
              setIsLoading(false);
              setLoadedImages(prev => new Set([...prev, selectedImage]));
            }}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            quality={90}
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVigAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDABQODxIPDRQSEBIXFRQdHx0dHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx//2wBDAR0XFyMeIyEeIyMeIyMeIyMeIyMeIyMeIyMeIyMeIyMeIyMeIyMeIyMeIyMeIyMeIyMeIyMeIyMeIyMeIyMeIyP/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
            priority={selectedImage === 0}
          />
        </div>
        
        {/* Zoom Indicator */}
        {!isZoomed && loadedImages.has(selectedImage) && (
          <div className="absolute top-2 right-2 bg-black/60 text-white px-2 py-1 rounded text-sm">
            Hover to zoom
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => handleImageSelect(index)}
              className={`relative w-20 h-20 flex-shrink-0 rounded-md overflow-hidden transition-opacity ${
                selectedImage === index
                  ? 'ring-2 ring-emerald-500 ring-offset-2'
                  : 'opacity-70 hover:opacity-100'
              }`}
              disabled={failedImages.has(index)}
            >
              <Image
                src={image}
                alt={`${alt} - Thumbnail ${index + 1}`}
                fill
                className="object-cover"
                sizes="80px"
                quality={60}
                loading="lazy"
                placeholder="blur"
                blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVigAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDABQODxIPDRQSEBIXFRQdHx0dHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx//2wBDAR0XFyMeIyEeIyMeIyMeIyMeIyMeIyMeIyMeIyMeIyMeIyMeIyMeIyMeIyMeIyMeIyMeIyMeIyMeIyMeIyMeIyP/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
              />
            </button>
          ))}
        </div>
      )}

      <style jsx global>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .animate-shimmer {
          animation: shimmer 1.5s infinite;
        }
      `}</style>
    </div>
  );
}
