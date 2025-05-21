/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  compress: true,
  reactStrictMode: true,

  images: {
    unoptimized: true, // Allow local image optimization
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
      }
    ],
  },
  // Enable reading local files in app directory
  experimental: {
    serverComponentsExternalPackages: ['sharp'],
  },
  compiler: {
    styledComponents: true,
  },

  webpack: (config) => {
    config.module.rules.push({
      test: /\.csv$/,
      loader: 'csv-loader',
      options: {
        dynamicTyping: true,
        header: true,
        skipEmptyLines: true,
      },
    });
    return config;
  },
}

export default nextConfig;
