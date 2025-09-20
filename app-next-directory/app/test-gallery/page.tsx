import React from 'react';
import GalleryGrid from '@/components/listings/GalleryGrid';

// Test page to isolate gallery functionality issues
export default function TestGalleryPage(): JSX.Element {
  // Create mock gallery images with varied amounts to test overlap issues
  // Using different placeholder images to avoid filtering issues
// Use Picsum seed URLs to make images deterministic and unique across test runs.
// This prevents flaky visual/layout tests caused by `?random` returning duplicates.
const fewImages = [
  "https://picsum.photos/seed/1/400/300",
  "https://picsum.photos/seed/2/400/300",
  "https://picsum.photos/seed/3/400/300",
];

// For the larger set, offset seeds by +4 so they don't collide with the seeds used in `fewImages`.
const manyImages = Array.from({ length: 12 }, (_, i) => 
  `https://picsum.photos/seed/${i + 4}/400/300`
);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Gallery Test Page</h1>
        
        <div className="space-y-12">
          <section>
            <h2 className="text-2xl font-semibold mb-4">Gallery with Few Images (3 images)</h2>
            <GalleryGrid images={fewImages} />
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Gallery with Many Images (12 images) - Testing Overlap Issue</h2>
            <GalleryGrid images={manyImages} />
          </section>

          {/* Test component below gallery to check for overlap */}
          <section className="bg-blue-50 p-8 rounded-lg border-2 border-blue-200">
            <h2 className="text-2xl font-semibold mb-4 text-blue-800">Component Below Gallery</h2>
            <p className="text-blue-700">
              This component is placed below the gallery to test if the gallery images overlap with it.
              If you can see this text clearly without any overlap, the gallery is working correctly.
              If this text is covered or partially hidden by gallery images, then we have the overlap issue
              mentioned in the problem statement.
            </p>
            <div className="mt-4 p-4 bg-blue-100 rounded">
              <h3 className="font-semibold text-blue-800">Test Content</h3>
              <p className="text-blue-600">
                This is additional content to make the section more substantial for overlap testing.
                The gallery should not interfere with this content at all.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}