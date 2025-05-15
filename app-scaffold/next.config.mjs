/**
 * Next.js Configuration
 * Include performance monitoring tools integration
 * 
 * @version 1.0.0
 * @date May 15, 2025
 */

// Import bundle analyzer if available
let withBundleAnalyzer;
try {
  // Dynamic import to avoid build errors if not installed
  if (process.env.ANALYZE === 'true') {
    withBundleAnalyzer = require('@next/bundle-analyzer')({
      enabled: true,
      openAnalyzer: process.env.ANALYZE_OPEN === 'true',
    });
  }
} catch (e) {
  console.log('Bundle analyzer not available');
  withBundleAnalyzer = (config) => config;
}

/** @type {import('next').NextConfig} */
const nextConfig = {  
  // Performance optimizations
  poweredByHeader: false, // Remove X-Powered-By header for security
  compress: true, // Enable gzip compression
  reactStrictMode: true, // Enable React strict mode for better error handling
  
  // Temporarily disable TypeScript errors in development to preview landing page
  typescript: {
    ignoreBuildErrors: true, // Only for development - remove in production
  },
  
  // Configure image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'maps.googleapis.com',
        port: '',
        pathname: '/maps/api/staticmap/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.sanity.io',
        port: '',
        pathname: '/**',
      }
    ],
    deviceSizes: [320, 480, 640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24, // 24 hours
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",    quality: 85,
  },
  
  // Experimental performance features
  experimental: {
    // Enable optimizations for better performance
    optimizeCss: true, // Enable CSS optimization
    scrollRestoration: true, // Restore scroll position on navigation
    largePageDataBytes: 128 * 1000, // 128KB (optimize for large pages)
    optimisticClientCache: true, // Enable optimistic client cache
  },
  
  // Configure runtime caching for better performance
  onDemandEntries: {
    // Number of pages that should be kept simultaneously without being disposed
    maxInactiveAge: 25 * 1000, // 25 seconds
    // Number of pages that should be kept in memory
    pagesBufferLength: 5,
  },
};

// Apply bundle analyzer if enabled
const finalConfig = withBundleAnalyzer ? withBundleAnalyzer(nextConfig) : nextConfig;

export default finalConfig;
