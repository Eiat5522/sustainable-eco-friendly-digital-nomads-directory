/** @type {import('next').NextConfig} */

const nextConfig = {
  images: {
    domains: [
      'maps.googleapis.com', // For Google Static Maps
      'unpkg.com' // For Leaflet marker icons
    ],
  },
  webpack: (config) => {
    // Add SVGR support
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });

    return config;
  },
};

export default nextConfig;
