'use client';

import { OptimizedImage, generateImageSizes } from '@/components/OptimizedImage';

// Sample image data (mock Sanity image reference)
const sampleImages = [
  {
    _type: 'image',
    asset: {
      _ref: 'image-sample1',
      _type: 'reference'
    }
  },
  // External image URLs for testing
  {
    url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80'
  },
  {
    url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80'
  }
];

export default function ImageOptimizationTest() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          🖼️ Image Optimization Test
        </h1>

        {/* Test Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">

          {/* Test 1: Standard optimized image */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="h-48 relative">
              <OptimizedImage
                image={null} // This will show placeholder
                alt="Test placeholder image"
                fill={true}
                className="rounded-t-lg"
                placeholder="eco"
                sizes={generateImageSizes({ 768: 100, 1024: 50, 1200: 33 })}
              />
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-gray-900">Eco Placeholder</h3>
              <p className="text-sm text-gray-600">Shows eco-friendly SVG placeholder</p>
            </div>
          </div>

          {/* Test 2: External image with blur placeholder */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="h-48 relative">
              {/* This would need proper Sanity image object in real implementation */}
              <div className="h-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
                <span className="text-white font-semibold">Sanity Image Test</span>
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-gray-900">Sanity Integration</h3>
              <p className="text-sm text-gray-600">Ready for Sanity CMS images</p>
            </div>
          </div>

          {/* Test 3: Responsive sizing test */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="h-48 relative">
              <div className="h-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
                <span className="text-white font-semibold">Responsive Test</span>
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-gray-900">Responsive Images</h3>
              <p className="text-sm text-gray-600">Multiple breakpoint optimization</p>
            </div>
          </div>
        </div>

        {/* Configuration Display */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            ⚙️ Next.js Image Configuration
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-700 mb-2">Image Formats</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>✅ AVIF (best compression)</li>
                <li>✅ WebP (fallback)</li>
                <li>✅ Original format (final fallback)</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-gray-700 mb-2">Optimization Features</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>✅ Automatic format selection</li>
                <li>✅ Lazy loading with Intersection Observer</li>
                <li>✅ Responsive image sizes</li>
                <li>✅ 30-day cache TTL</li>
                <li>✅ Sharp image processing</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 p-4 bg-green-50 rounded-lg">
            <h4 className="font-medium text-green-800 mb-2">🎯 Performance Benefits</h4>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Reduced bandwidth usage (30-80% smaller files)</li>
              <li>• Faster page load times</li>
              <li>• Better Core Web Vitals scores</li>
              <li>• Improved SEO rankings</li>
              <li>• Enhanced user experience</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
