import React from 'react';

interface LightboxProps {
  images: { src: string; alt: string }[];
  currentIndex: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}

export const Lightbox: React.FC<LightboxProps> = ({
  images,
  currentIndex,
  onClose,
  onNext,
  onPrev,
}) => {
  if (!images || images.length === 0) return null;

  const currentImage = images[currentIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <div className="relative">
        <button
          className="absolute top-2 right-2 text-white text-2xl z-10"
          onClick={onClose}
          aria-label="Close gallery"
        >
          &times;
        </button>
        <button
          className="absolute left-2 top-1/2 transform -translate-y-1/2 text-white text-4xl z-10"
          onClick={onPrev}
          aria-label="Previous image"
        >
          &lt;
        </button>
        <button
          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white text-4xl z-10"
          onClick={onNext}
          aria-label="Next image"
        >
          &gt;
        </button>
        <img
          src={currentImage.src}
          alt={currentImage.alt}
          className="max-w-full max-h-screen object-contain"
        />
        <div className="absolute bottom-4 left-0 right-0 text-center text-white text-lg">
          {currentIndex + 1} / {images.length}
        </div>
      </div>
    </div>
  );
};