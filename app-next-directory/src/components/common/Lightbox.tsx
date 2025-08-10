import React from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface LightboxProps {
  images: { src: string; alt: string }[];
  currentIndex: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  onNavigateToIndex?: (index: number) => void;
}

export const Lightbox: React.FC<LightboxProps> = ({
  images,
  currentIndex,
  onClose,
  onNext,
  onPrev,
  onNavigateToIndex,
}) => {
  if (!images || images.length === 0) return null;

  const currentImage = images[currentIndex];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90"
      onClick={onClose}
    >
      <div className="relative max-w-7xl max-h-full p-4" onClick={e => e.stopPropagation()}>
        {/* Close button */}
        <button
          className="absolute top-2 right-2 text-white hover:text-gray-300 z-10 p-2"
          onClick={onClose}
          aria-label="Close gallery"
        >
          <X size={24} />
        </button>
        
        {/* Navigation buttons */}
        {images.length > 1 && (
          <>
            <button
              className="absolute left-2 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 z-10 p-2"
              onClick={onPrev}
              aria-label="Previous image"
            >
              <ChevronLeft size={32} />
            </button>
            <button
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 z-10 p-2"
              onClick={onNext}
              aria-label="Next image"
            >
              <ChevronRight size={32} />
            </button>
          </>
        )}
        
        {/* Main image */}
        <img
          src={currentImage.src}
          alt={currentImage.alt}
          className="max-w-full max-h-screen object-contain rounded-lg"
        />
        
        {/* Image counter and navigation dots */}
        <div className="absolute bottom-4 left-0 right-0 text-center">
          <div className="text-white text-lg mb-2" data-testid="image-counter">
            {currentIndex + 1} / {images.length}
          </div>
          {images.length > 1 && (
            <div className="flex justify-center space-x-2">
              {images.map((_, index) => (
                <button
                  key={index}
                  className={`w-2 h-2 rounded-full ${
                    index === currentIndex ? 'bg-white' : 'bg-white/50'
                  }`}
                  onClick={() => onNavigateToIndex?.(index)}
                  aria-label={`Go to image ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};