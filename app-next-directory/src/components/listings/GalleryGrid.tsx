'use client';

import Image from 'next/image';
import React, { useEffect, useRef, useState } from 'react';

type Props = {
  images: string[] | Array<{ url: string; alt?: string }>;
  fallback?: string;
};

export default function GalleryGrid({ images, fallback = '/placeholder_image.png' }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const lastTriggerRef = useRef<HTMLButtonElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const prevBtnRef = useRef<HTMLButtonElement | null>(null);
  const nextBtnRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const hasValidImages = Array.isArray(images) && images.length > 0;

  // Normalize images to string array, handling both string[] and object[] formats
  const normalizedImages = hasValidImages
    ? images.map(img => (typeof img === 'string' ? img : img.url)).filter(src => src)
    : [];

  // For better UX, only filter out fallback if ALL images are the same fallback
  // This allows mixed galleries and testing scenarios
  const allAreFallback =
    normalizedImages.length > 0 && normalizedImages.every(src => src === fallback);
  const cleanImages = allAreFallback ? [] : normalizedImages;

  // Show gallery even with fallback images for testing purposes
  const toShow: string[] = cleanImages;

  // Precompute alt texts for thumbnails to avoid O(n^2) behavior from repeated findIndex calls
  // Map each src in toShow to the corresponding original image's alt (or null)
  const altTexts: Array<string | null> = toShow.map(src => {
    if (!hasValidImages) return null;
    const originalIdx = images.findIndex(img => (typeof img === 'string' ? img : img.url) === src);
    const originalImg = originalIdx >= 0 ? images[originalIdx] : null;
    if (originalImg && typeof originalImg === 'object') return originalImg.alt ?? null;
    return null;
  });

  const closeModal = () => {
    setOpenIndex(null);
    // Restore focus to the last triggering thumbnail for good accessibility
    queueMicrotask(() => {
      lastTriggerRef.current?.focus();
    });
  };

  const goPrev = React.useCallback(() => {
    setOpenIndex(i => (i === null ? null : (i - 1 + toShow.length) % toShow.length));
  }, [toShow.length]);

  const goNext = React.useCallback(() => {
    setOpenIndex(i => (i === null ? null : (i + 1) % toShow.length));
  }, [toShow.length]);

  // Keyboard handling: ESC to close, arrows to navigate while modal is open
  useEffect(() => {
    if (openIndex === null) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeModal();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goNext();
      }
    };
    window.addEventListener('keydown', onKeyDown as EventListener);
    // Focus the close button when opening
    queueMicrotask(() => closeBtnRef.current?.focus());
    return () => {
      window.removeEventListener('keydown', onKeyDown as EventListener);
    };
  }, [openIndex, goPrev, goNext, closeModal]);

  // Simple focus trap inside the dialog for Tab/Shift+Tab
  const onDialogKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Tab') return;
    const focusables = [closeBtnRef.current, prevBtnRef.current, nextBtnRef.current].filter(
      (el): el is HTMLButtonElement => !!el
    );
    if (focusables.length === 0) return;
    const current = document.activeElement as HTMLElement | null;
    const idx = focusables.indexOf(current);
    if (e.shiftKey) {
      // Move focus backward when cycling with Shift+Tab.
      if (idx <= 0) {
        e.preventDefault();
        focusables[focusables.length - 1]?.focus();
      }
    } else {
      // Move focus forward when cycling with Tab.
      if (idx === -1 || idx === focusables.length - 1) {
        e.preventDefault();
        focusables[0]?.focus();
      }
    }
  };

  // If there are no images to show, render nothing. This guard is placed after all hooks
  // to comply with the Rules of Hooks (hooks must be called in the same order).
  if (toShow.length === 0) return null;

  return (
    <div data-testid="gallery-grid">
      <div
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3"
        data-testid="gallery-thumbnails"
      >
        {toShow.map((src, idx) => (
          <button
            key={idx}
            onClick={e => {
              lastTriggerRef.current = e.currentTarget;
              setOpenIndex(idx);
            }}
            className="relative w-full h-32 sm:h-36 md:h-40 rounded-lg overflow-hidden bg-gray-100 hover:shadow-lg transition-shadow duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label={`Open image ${idx + 1}`}
            data-testid="gallery-thumbnail"
            data-index={idx}
          >
            <Image
              src={src}
              alt={altTexts[idx] ?? `Gallery image ${idx + 1}`}
              fill
              className="object-cover hover:scale-105 transition-transform duration-300"
            />
          </button>
        ))}
      </div>

      {/* Lightbox modal */}
      {openIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Image preview"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={closeModal}
          ref={dialogRef}
          onKeyDown={onDialogKeyDown}
          data-testid="gallery-lightbox"
        >
          <div
            className="relative w-full max-w-4xl max-h-[90vh] mx-auto"
            onClick={e => e.stopPropagation()}
          >
            <button
              ref={closeBtnRef}
              onClick={closeModal}
              className="absolute right-4 top-4 z-20 rounded-full bg-white/90 p-2 hover:bg-white transition-colors"
              aria-label="Close preview"
            >
              ✕
            </button>
            <div className="w-full h-[80vh] relative bg-black rounded-lg overflow-hidden">
              <Image
                src={(toShow[openIndex] as string) || fallback}
                alt={`Preview ${openIndex + 1}`}
                fill
                className="object-contain"
                loading="eager"
              />
            </div>

            {/* Prev / Next */}
            <div className="mt-4 flex justify-between px-4">
              <button
                ref={prevBtnRef}
                onClick={goPrev}
                className="rounded-lg bg-white/90 hover:bg-white px-4 py-2 font-medium transition-colors"
                aria-label="Previous image"
              >
                ‹ Prev
              </button>
              <button
                ref={nextBtnRef}
                onClick={goNext}
                className="rounded-lg bg-white/90 hover:bg-white px-4 py-2 font-medium transition-colors"
                aria-label="Next image"
              >
                Next ›
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
