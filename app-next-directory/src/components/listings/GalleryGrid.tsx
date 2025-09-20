"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";

type Props = {
  images: string[];
  fallback?: string;
};

export default function GalleryGrid({ images, fallback = "/placeholder_image.png" }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const lastTriggerRef = useRef<HTMLButtonElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const prevBtnRef = useRef<HTMLButtonElement | null>(null);
  const nextBtnRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const hasValidImages = Array.isArray(images) && images.length > 0;
  const cleanImages = hasValidImages ? images.filter((src) => src && src !== fallback) : [];
  // If all images are the fallback (or none), don't render the gallery to avoid showing the cartoon placeholder
  if (cleanImages.length === 0) return null;
  const toShow: string[] = cleanImages;

  const closeModal = () => {
    setOpenIndex(null);
    // Restore focus to the last triggering thumbnail for good accessibility
    queueMicrotask(() => {
      lastTriggerRef.current?.focus();
    });
  };

  const goPrev = () => setOpenIndex((i) => (i === null ? null : (i - 1 + toShow.length) % toShow.length));
  const goNext = () => setOpenIndex((i) => (i === null ? null : (i + 1) % toShow.length));

  // Keyboard handling: ESC to close, arrows to navigate while modal is open
  useEffect(() => {
    if (openIndex === null) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeModal();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      }
    };
    window.addEventListener("keydown", onKeyDown as EventListener);
    // Focus the close button when opening
    queueMicrotask(() => closeBtnRef.current?.focus());
    return () => {
      window.removeEventListener("keydown", onKeyDown as EventListener);
    };
  }, [openIndex]);

  // Simple focus trap inside the dialog for Tab/Shift+Tab
  const onDialogKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Tab") return;
    const focusables = [closeBtnRef.current, prevBtnRef.current, nextBtnRef.current].filter(
      (el): el is HTMLButtonElement => !!el
    );
    if (focusables.length === 0) return;
    const current = document.activeElement as HTMLElement | null;
    const idx = focusables.findIndex((el) => el === current);
    if (e.shiftKey) {
      // backwards
      if (idx <= 0) {
        e.preventDefault();
        focusables[focusables.length - 1]?.focus();
      }
    } else {
      // forwards
      if (idx === -1 || idx === focusables.length - 1) {
        e.preventDefault();
        focusables[0]?.focus();
      }
    }
  };

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {toShow.map((src, idx) => (
          <button
            key={idx}
            onClick={(e) => {
              lastTriggerRef.current = e.currentTarget;
              setOpenIndex(idx);
            }}
            className="relative w-full h-40 rounded overflow-hidden bg-gray-100"
            aria-label={`Open image ${idx + 1}`}
          >
            <Image src={src} alt={`Gallery image ${idx + 1}`} fill className="object-cover" />
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
        >
          <div className="relative max-w-[90vw] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <button
              ref={closeBtnRef}
              onClick={closeModal}
              className="absolute right-2 top-2 z-20 rounded bg-white/90 p-1"
              aria-label="Close preview"
            >
              ✕
            </button>
            <div className="w-full h-[70vh] relative bg-black">
              <Image
                src={(toShow[openIndex] as string) || fallback}
                alt={`Preview ${openIndex + 1}`}
                fill
                className="object-contain"
                loading="eager"
              />
            </div>

            {/* Prev / Next */}
            <div className="mt-2 flex justify-between">
              <button
                ref={prevBtnRef}
                onClick={goPrev}
                className="rounded bg-white/90 px-3 py-1"
                aria-label="Previous image"
              >
                ‹ Prev
              </button>
              <button
                ref={nextBtnRef}
                onClick={goNext}
                className="rounded bg-white/90 px-3 py-1"
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
