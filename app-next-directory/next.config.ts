// <reference types="webpack" />

// Enforce the var on Vercel Preview/Production
if (
  process.env.VERCEL &&
  process.env.NODE_ENV !== 'development' &&
  !process.env.NEXT_PUBLIC_API_URL
) {
  throw new Error('NEXT_PUBLIC_API_URL must be set for Preview/Production environments.');
}

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import withBundleAnalyzer from '@next/bundle-analyzer';
import type { NextConfig } from 'next';
import type { Configuration, RuleSetRule } from 'webpack';
import { createRequire } from 'node:module';

const APP_DIR =
  typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));
const TURBOPACK_ROOT = path.join(APP_DIR, '..');
const require = createRequire(import.meta.url);

const isAnalyze = /^(1|true|yes)$/i.test(process.env.ANALYZE ?? '');
const withAnalyzer = withBundleAnalyzer({ enabled: isAnalyze });

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  turbopack: {
    // Point Turbopack to the monorepo root so shared workspace packages resolve correctly
    root: TURBOPACK_ROOT,
  },
  cacheComponents: true,
  productionBrowserSourceMaps: process.env.ENABLE_SOURCE_MAPS === 'true',
  serverExternalPackages: ['pino', 'pino-pretty', 'thread-stream'],
  // Transpile shared workspace packages so Turbopack/Next can consume uncompiled TS/ESM code
  transpilePackages: ['framer-motion', 'sustainable-nomads'],
  compiler: {
    styledComponents: true,
  },
  reactStrictMode: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL ||
      (process.env.NODE_ENV === 'development'
        ? 'http://localhost:3000'
        : process.env.NEXT_PUBLIC_API_URL),
  },
  experimental: {
    // Enable filesystem caching for `next dev`
    turbopackFileSystemCacheForDev: true,
  },
  async redirects() {
    return [
      { source: '/contact', destination: '/contact-us', permanent: true },
      { source: '/city/:slug', destination: '/cities/:slug', permanent: true },
      { source: '/venues/ko-hub', destination: '/venues/koh-hub', permanent: true },
      { source: '/cities/:slug/', destination: '/cities/:slug', permanent: true },
      // Handle trailing slash directly to avoid an extra hop
      { source: '/city/:slug/', destination: '/cities/:slug', permanent: true },
    ];
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
    deviceSizes: [640, 768, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
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
        // Use the active Vercel deployment host to allow previews and production without over-broad wildcards
        protocol: 'https',
        hostname: process.env.VERCEL_URL || 'your-app.vercel.app',
        pathname: '/**',
      },
    ],
  },
  webpack(config: Configuration, { dev, isServer }) {
    // Ensure @ alias resolves to this app's src directory
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@': path.resolve(APP_DIR, 'src'),
    };

    config.module = config.module || {};
    config.module.rules = config.module.rules || [];

    // Use hidden source maps only for client prod builds
    if (!dev && !isServer) {
      config.devtool = 'hidden-source-map';
    }

    // Allow importing CSV data
    const csvRule: RuleSetRule = {
      test: /\.csv$/i,
      use: [
        {
          loader: require.resolve('csv-loader'),
          options: { dynamicTyping: true, skipEmptyLines: true },
        },
      ],
    };
    config.module.rules.push(csvRule);

    // Fix Framer Motion compatibility with Next.js 16 App Router
    config.module.rules.push({
      test: /\.m?js$/,
      include: /[\\/]node_modules[\\/](framer-motion)[\\/]/,
      resolve: { fullySpecified: false },
    });

    // Exclude SVGs from the existing asset loader
    const fileLoaderRule = config.module.rules.find(
      rule =>
        typeof rule === 'object' &&
        rule &&
        'test' in rule &&
        rule.test instanceof RegExp &&
        rule.test.test?.('.svg')
    ) as RuleSetRule | undefined;

    if (fileLoaderRule) {
      fileLoaderRule.exclude = /\.svg$/i;
    }

    // Add SVGR for React components and asset/resource for `?url`
    config.module.rules.push(
      {
        test: /\.svg$/i,
        issuer: /\.[jt]sx?$/,
        resourceQuery: { not: [/url/] },
        use: ['@svgr/webpack'],
      },
      {
        test: /\.svg$/i,
        resourceQuery: /url/,
        type: 'asset/resource',
      }
    );

    return config;
  },
};

export default isAnalyze ? withAnalyzer(nextConfig) : nextConfig;
