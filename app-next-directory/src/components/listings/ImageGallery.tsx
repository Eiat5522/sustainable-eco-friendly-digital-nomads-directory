"use client";

import React from 'react';
import Image from 'next/image';
import { urlFor } from '@/lib/sanity/image'; // Assuming this path is correct

interface ImageGalleryProps {
  images?: SanityImage[];
  listingName: string;
}

interface SanityImage {
  asset?: {
    _id: string;
    // other asset properties if needed
  };
  // other image fields like alt text if available on the image object itself
  alt?: string; 
}

const ImageGallery = ({ images, listingName }: ImageGalleryProps) => {
  if (!images || images.length === 0) {
    return null;
  }

  const [previewImage, setPreviewImage] = React.useState<SanityImage>(images[0]);

  const handleImageSelect = (image: SanityImage) => {
    setPreviewImage(image);
  };

  const mainPreviewUrl = previewImage?.asset?._id
    ? urlFor(previewImage.asset._id)?.width(800)?.height(600)?.url() ?? '/placeholder-city.jpg'
    : '/placeholder-city.jpg';
  
  const mainPreviewAlt = previewImage?.alt || `Preview of ${listingName}`;

  return (
    <div className="mt-8">
      <h3 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-white">Image Gallery</h3>
      
      {/* Main Preview Image */}
      <div className="relative w-full h-80 md:h-96 mb-4 overflow-hidden rounded-lg shadow-lg bg-gray-200 dark:bg-gray-700">
        <Image
          src={mainPreviewUrl}
          alt={mainPreviewAlt}
          fill
          className="object-contain" // Changed to contain to show full image, or use 'cover'
          priority // If this is the primary content image after main listing image
        />
      </div>
      
      {/* Thumbnails */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
        {images.map((image, index) => {
          const imageAsset = image.asset;
          let thumbnailUrl: string | undefined | null = null; // Explicitly type
          if (imageAsset?._id) {
            thumbnailUrl = urlFor(imageAsset._id)?.width(200)?.height(150)?.url();
          }

          if (!thumbnailUrl) { // This check handles null or undefined
             return null; // Skip if URL can't be generated
          }

          const thumbnailAlt = image.alt || `${listingName} gallery image ${index + 1}`;

          return (
            <button
              key={imageAsset?._id || index}
              onMouseEnter={() => handleImageSelect(image)}
              onClick={() => handleImageSelect(image)} // Good for touch devices
              className={`relative w-full h-20 md:h-24 overflow-hidden rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-gray-800
                          ${previewImage.asset?._id === imageAsset?._id ? 'ring-2 ring-green-500 ring-offset-2 dark:ring-offset-gray-800' : ''}`}
            >
              <Image
                src={thumbnailUrl}
                alt={thumbnailAlt}
                fill
                className="object-cover hover:opacity-75 transition-all duration-150"
                sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1024px) 20vw, 16vw"
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ImageGallery;
