import path from 'path';
import fs from 'fs';

// Enforce the var on Vercel Preview/Production
if (process.env.VERCEL && process.env.NODE_ENV !== 'development' && !process.env.NEXT_PUBLIC_API_URL) {
  throw new Error('NEXT_PUBLIC_API_URL must be set for Preview/Production environments.');
},

import path from 'path';
import fs from 'fs';

const nextConfig = {
  distDir: 'dist',
  // Avoid publicly exposing source maps in production. Use hidden client maps instead.
  productionBrowserSourceMaps: false,
  reactStrictMode: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
 },
//   env: {
//     // Prefer per-environment env var; dev-only fallback.
//     NEXT_PUBLIC_API_URL:
//       process.env.NEXT_PUBLIC_API_URL ||
//       (process.env.NODE_ENV === 'development'
//         ? 'http://localhost:3000'
//         : 'https://your-production-url.com'),
//   },
//  images: {
//     remotePatterns: [
//       { protocol: 'https', hostname: 'images.example.com', pathname: '/**' },
//       { protocol: 'https', hostname: 'cdn.example.org', pathname: '/**' },
// 
//     ],
//   },
//   webpack: (config, { dev, isServer }) => {
//     // Only set devtool for the client in production; keep Next defaults otherwise.
//     if (!dev && !isServer) {
//       config.devtool = 'hidden-source-map';
//     }
//     config.optimization = {
//       ...config.optimization,
//       minimize: false,
//     };
//     config.plugins = config.plugins || [];
//     config.module = config.module || { rules: [] };
//     config.module.rules = config.module.rules || [];
// 
//     const fileLoaderRule = config.module.rules.find(
//       (rule) =>
//         typeof rule === 'object' &&
//         rule !== null &&
//         rule.test instanceof RegExp &&
//         rule.test.test('.svg'),
//     );
//     if (fileLoaderRule && typeof fileLoaderRule === 'object') {
//       fileLoaderRule.exclude = /\.svg$/i;
//     }
//     config.module.rules.push(
//       {
//         test: /\.svg$/i,
//         resourceQuery: /url/,
//         type: 'asset/resource',
//       },
//       //      {
//       //        test: /\.svg$/i,
//       //        issuer: /\.[jt]sx?$/,
//       //        resourceQuery: { not: [/url/] },
//       //        use: ["@svgr/webpack"],
//       //      }
//     );
// 
//     return config;
//   },
};

export default nextConfig;

export default nextConfig;
