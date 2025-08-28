// Enforce the var on Vercel Preview/Production
if (process.env.VERCEL && process.env.NODE_ENV !== 'development' && !process.env.NEXT_PUBLIC_API_URL) {
  throw new Error('NEXT_PUBLIC_API_URL must be set for Preview/Production environments.');
}

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
  env: {
    // Prefer per-environment env var; dev-only fallback.
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL ||
      (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : process.env.NEXT_PUBLIC_API_URL),
 },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.sanity.io', pathname: '/**' },
      { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' },
      { protocol: 'https', hostname: 'images.pexels.com', pathname: '/**' },
      { protocol: 'https', hostname: '**.vercel.app', pathname: '/**' },
    ],
  },
  webpack: (config, { dev, isServer }) => {
    // Use hidden source maps only for client prod builds
    if (!dev && !isServer) {
      config.devtool = 'hidden-source-map'
    }

    // Exclude SVGs from the existing asset loader
    const fileLoaderRule = config.module.rules.find(
      (rule) =>
        typeof rule === 'object' &&
        rule && 'test' in rule &&
        rule.test instanceof RegExp &&
        rule.test.test?.('.svg')
    )
    if (fileLoaderRule && typeof fileLoaderRule === 'object') {
      fileLoaderRule.exclude = /\.svg$/i
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
    )

    return config
  },
};
export default nextConfig;
