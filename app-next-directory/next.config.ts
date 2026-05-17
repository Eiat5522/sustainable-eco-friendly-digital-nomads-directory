import path from 'node:path';
import { fileURLToPath } from 'node:url';
import withBundleAnalyzer from '@next/bundle-analyzer';
import type { NextConfig } from 'next';

const APP_DIR =
  typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));
const TURBOPACK_ROOT = path.resolve(APP_DIR, '..');

const isAnalyze = /^(1|true|yes)$/i.test(process.env.ANALYZE ?? '');
const withAnalyzer = withBundleAnalyzer({ enabled: isAnalyze });

if (
  process.env.VERCEL &&
  process.env.NODE_ENV !== 'development' &&
  !process.env.NEXT_PUBLIC_API_URL
) {
  throw new Error('NEXT_PUBLIC_API_URL must be set for Preview/Production environments.');
}

const nextConfig: NextConfig = {
  cacheComponents: true, // For Next.js 16.x-canary.x
  logging: {
    fetches: {
      fullUrl: true,
      hmrRefreshes: true,
    },
  },
  typedRoutes: true,
  experimental: {
    authInterrupts: true,
    turbopackFileSystemCacheForDev: true,
    turbopackFileSystemCacheForBuild: true,
    serverComponentsHmrCache: true,
  },
  transpilePackages: ['framer-motion', 'sustainable-nomads', 'sanity'],
  serverExternalPackages: [
    'pino',
    'pino-pretty',
    'thread-stream',
    '@swc/core',
    'autoprefixer',
    'postcss',
    'mongodb',
    'mongoose',
    'bcrypt',
    'playwright',
    'prettier',
    'typescript',
    'webpack',
  ],
  productionBrowserSourceMaps: process.env.ENABLE_SOURCE_MAPS === 'true',
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: process.env.NODE_ENV === 'development',
  },
  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL ||
      (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : undefined),
  },
  async redirects() {
    return [
      { source: '/contact', destination: '/contact-us', permanent: true },
      { source: '/venues/ko-hub', destination: '/venues/koh-hub', permanent: true },
      { source: '/cities/:slug/', destination: '/cities/:slug', permanent: true },
      { source: '/city/:slug/', destination: '/cities/:slug', permanent: true },
      { source: '/city/:slug', destination: '/cities/:slug', permanent: true },
      { source: '/category', destination: '/categories', permanent: true },
      { source: '/category/:slug', destination: '/categories/:slug', permanent: true },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: process.env.VERCEL_URL || 'localhost',
        pathname: '/**',
      },
    ],
  },
  cacheLife: {
    instant: {
      stale: 0,
      revalidate: 60,
      expire: 60 * 60,
    },
    short: {
      stale: 30,
      revalidate: 60,
      expire: 60 * 5,
    },
    medium: {
      stale: 300,
      revalidate: 600,
      expire: 60 * 60,
    },
    long: {
      stale: 60 * 60 * 24 * 7,
      revalidate: 60 * 60 * 24,
      expire: 60 * 60 * 24 * 7,
    },
  },
  turbopack: {
    root: TURBOPACK_ROOT,
    resolveAlias: {
      'thread-stream': './src/shims/thread-stream-shim',
      'thread-stream/test': './src/shims/empty-thread-stream',
      'prettier/standalone': './src/shims/prettier-standalone-shim',
      'prettier/plugins/html': './src/shims/prettier-plugins-html-shim',
    },
  },
  // Webpack config for non-Turbopack builds only
  // Note: For SVG imports, use next-image or inline SVG components instead
  // This is only applied when not using Turbopack
  webpack(config, _options) {
    // Ensure @ alias resolves to this app's src directory
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@': path.resolve(APP_DIR, 'src'),
    };

    // SVG handling - only for webpack builds
    // For Turbopack, SVGs should be imported as React components or use next/image
    if (!config.name || config.name !== 'server') {
      config.module.rules.push({
        test: /\.svg$/i,
        issuer: /\.[jt]sx?$/,
        use: ['@svgr/webpack'],
      });
    }

    return config;
  },
};

export default isAnalyze ? withAnalyzer(nextConfig) : nextConfig;
