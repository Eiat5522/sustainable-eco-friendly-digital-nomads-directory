"use client";

import React, { useState } from "react";
import Image from "next/image";

type Props = {
  images: string[];
  fallback?: string;
};

export default function GalleryGrid({ images, fallback = "/placeholder_image.png" }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const hasValidImages = Array.isArray(images) && images.length > 0;
  const cleanImages = hasValidImages ? images.filter((src) => src && src !== fallback) : [];
  // If all images are the fallback (or none), don't render the gallery to avoid showing the cartoon placeholder
  if (cleanImages.length === 0) return null;

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {toShow.map((src, idx) => (
          <button
            key={idx}
            onClick={() => setOpenIndex(idx)}
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setOpenIndex(null)}
        >
          <div className="relative max-w-[90vw] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setOpenIndex(null)}
              className="absolute right-2 top-2 z-20 rounded bg-white/90 p-1"
              aria-label="Close preview"
            >
              ✕
            </button>
            <div className="w-full h-[70vh] relative bg-black">
              <Image
                src={toShow[openIndex] || fallback}
                alt={`Preview ${openIndex + 1}`}
                fill
                className="object-contain"
                loading="eager"
                onError={(e) => {
                  e.currentTarget.src = fallback;
                }}
              />
            </div>

            {/* Prev / Next */}
            <div className="mt-2 flex justify-between">
              <button
                onClick={() => setOpenIndex((i) => (i === null ? null : (i - 1 + toShow.length) % toShow.length))}
                className="rounded bg-white/90 px-3 py-1"
                aria-label="Previous image"
              >
                ‹ Prev
              </button>
              <button
                onClick={() => setOpenIndex((i) => (i === null ? null : (i + 1) % toShow.length))}
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
