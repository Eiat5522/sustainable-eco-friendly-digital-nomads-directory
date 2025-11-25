// Enforce the var on Vercel Preview/Production
if (
  process.env.VERCEL &&
  process.env.NODE_ENV !== 'development' &&
  !process.env.NEXT_PUBLIC_API_URL
) {
  throw new Error('NEXT_PUBLIC_API_URL must be set for Preview/Production environments.');
}

const nextConfig = {
  transpilePackages: ['framer-motion'],
  // Avoid publicly exposing source maps in production. Use hidden client maps instead.
  productionBrowserSourceMaps: false,
  reactStrictMode: false,
  typescript: {
    ignoreBuildErrors: true,
  },
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
  webpack: (config, { dev, isServer }) => {
    // Use hidden source maps only for client prod builds
    if (!dev && !isServer) {
      config.devtool = 'hidden-source-map';
    }

    // Fix Framer Motion compatibility with Next.js 15 App Router
    // Scope to its files in node_modules to avoid overmatching.
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
    );
    if (fileLoaderRule && typeof fileLoaderRule === 'object') {
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
