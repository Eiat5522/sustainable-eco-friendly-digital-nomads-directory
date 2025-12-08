// <reference types="webpack" />

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import withBundleAnalyzer from '@next/bundle-analyzer';
import type { NextConfig } from 'next';

const APP_DIR =
  typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

import type { Configuration } from 'webpack';

const isAnalyze = /^(1|true|yes)$/i.test(process.env.ANALYZE ?? '');
const withAnalyzer = withBundleAnalyzer({ enabled: isAnalyze });

const nextConfig: NextConfig = {
  cacheComponents: true, // For Next.js 16.x-canary.x
  productionBrowserSourceMaps: process.env.ENABLE_SOURCE_MAPS === 'true',
  reactStrictMode: true,
  // `eslint` is now configured via `eslint.config.mjs`. Remove Next.js `eslint` option.
  turbopack: {},
  typescript: {
    ignoreBuildErrors: process.env.NODE_ENV === 'development',
  },
  async redirects() {
    return [
      { source: '/contact', destination: '/contact-us', permanent: true },
      { source: '/city/:slug', destination: '/cities/:slug', permanent: true },
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
      },
    ],
  },
  webpack(config: Configuration) {
    // Ensure @ alias resolves to this app's src directory
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@': path.resolve(APP_DIR, 'src'),
    };

    config.module.rules.push({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      use: ['@svgr/webpack'],
    });

    return config;
  },
};

export default isAnalyze ? withAnalyzer(nextConfig) : nextConfig;
