/** @type {import('next').NextConfig} */

import type { Configuration } from 'webpack';

const nextConfig = {
  images: {
    domains: [
      'maps.googleapis.com', // For Google Static Maps
      'unpkg.com', // For Leaflet marker icons
      'cdn.sanity.io' // For Sanity images
    ],
  },
  webpack: (config: Configuration) => {
    // Add SVGR support
    config.module?.rules?.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });

    return config;
  },
};

export default nextConfig;
