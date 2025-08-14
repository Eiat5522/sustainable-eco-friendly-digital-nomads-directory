// <reference types="webpack" />
import type { NextConfig } from 'next'
import withBundleAnalyzer from '@next/bundle-analyzer';
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const APP_DIR = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));
import type { Configuration } from 'webpack'

const isAnalyze = /^(1|true|yes)$/i.test(process.env.ANALYZE ?? '')
const withAnalyzer = withBundleAnalyzer({ enabled: isAnalyze })

const nextConfig: NextConfig = {
  productionBrowserSourceMaps: true,
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack(config: Configuration) {
    // Ensure @ alias resolves to this app's src directory
    config.resolve = config.resolve || {}
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@': path.resolve(APP_DIR, 'src'),
    }

    config.module.rules.push({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      use: ['@svgr/webpack'],
    })

    return config
  },
};

export default (isAnalyze ? withAnalyzer(nextConfig) : nextConfig);
