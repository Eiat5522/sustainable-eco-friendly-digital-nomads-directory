// Enforce the var on Vercel Preview/Production
if (
  process.env.VERCEL &&
  process.env.NODE_ENV !== 'development' &&
  !process.env.NEXT_PUBLIC_API_URL
) {
  throw new Error('NEXT_PUBLIC_API_URL must be set for Preview/Production environments.');
}

const nextConfig = {
  transpilePackages: ['framer-motion', "sustainable-nomads" ],
  // Avoid publicly exposing source maps in production. Use hidden client maps instead.
  productionBrowserSourceMaps: false,
  reactStrictMode: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  // `eslint` config is now managed via the project ESLint config (eslint.config.mjs)
  // Remove this entry for Next.js 16 compatibility.
turbopack: {},
  env: {
    // Prefer per-environment env var; dev-only fallback.
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL ||
      (process.env.NODE_ENV === 'development'
        ? 'http://localhost:3000'
        : process.env.NEXT_PUBLIC_API_URL),
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.sanity.io', pathname: '/**' },
      { protocol: 'https', hostname: 'images.pexels.com', pathname: '/**' },
      { protocol: 'https', hostname: 'i.pravatar.cc', pathname: '/**' },
      { protocol: 'https', hostname: 'raw.githubusercontent.com', pathname: '/**' },
      // Use the active Vercel deployment host to allow previews and production without over-broad wildcards
      {
        protocol: 'https',
        hostname: process.env.VERCEL_URL || 'your-app.vercel.app',
        pathname: '/**',
      },
    ],
  },
  // NOTE: Custom webpack configuration removed to enable Turbopack.
  // Turbopack does not support webpack loaders or custom webpack transforms.
  // If you need the previous behavior (SVGR, framer-motion fixes, hidden-source-map),
  // consider:
  // - Replacing inline SVG imports with `.svg?url` or a small wrapper component.
  // - Using `turbopack.resolveAlias` for simple aliasing.
  // - Moving runtime-only behavior into server-only modules.
  // Re-add turbopack-specific config below as needed.
};
const withRedirects = {
  ...nextConfig,
  async redirects() {
    return [
      { source: '/venues/ko-hub', destination: '/venues/koh-hub', permanent: true },
      { source: '/cities/:slug/', destination: '/cities/:slug', permanent: true },
      // Handle trailing slash directly to avoid an extra hop
      { source: '/city/:slug/', destination: '/cities/:slug', permanent: true },
      { source: '/city/:slug', destination: '/cities/:slug', permanent: true },
    ];
  },
};

export default withRedirects;
