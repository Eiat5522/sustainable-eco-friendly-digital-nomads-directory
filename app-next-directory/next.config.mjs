import path from 'node:path';
import { fileURLToPath } from 'node:url';

// ESM does not provide __dirname; derive it from import.meta.url
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const turbopackRoot = path.join(__dirname, '..', '..');

// Enforce the var on Vercel Preview/Production
if (
  process.env.VERCEL &&
  process.env.NODE_ENV !== 'development' &&
  !process.env.NEXT_PUBLIC_API_URL
) {
  throw new Error('NEXT_PUBLIC_API_URL must be set for Preview/Production environments.');
}
const nextConfig = {
  logging: {
    fetches: {
      fullUrl: true, // Logs the full URL of fetch requests
      hmrRefreshes: true, // Logs fetches even during HMR refreshes
    },
  },
  // Support for statically typed links (requires TypeScript)
  typedRoutes: true,
  experimental: {
    // Enable rendering of Next.js 401 unauthorized page.
    authInterrupts: true,
    // Enable filesystem caching for `next dev`
    turbopackFileSystemCacheForDev: true,
    // Enable filesystem caching for `next build`
    turbopackFileSystemCacheForBuild: true,
    // Enable HMR (Hot Module Replacement): default is false
    serverComponentsHmrCache: true,
  },
  // Transpile shared workspace or ESM packages that ship untranspiled code.
  // Add any other local workspace packages here (e.g. shared UI packages).
  transpilePackages: ['framer-motion', 'sustainable-nomads', 'sanity'],
  // Avoid publicly exposing source maps in production. Use hidden client maps instead.
  productionBrowserSourceMaps: false,
  // Opt out known native/binary or heavy tooling packages from Server Components bundling.
  // These packages can cause Turbopack/Server Components bundling problems and are safer
  // to resolve via Node's native `require` at runtime.
  serverExternalPackages: [
    'pino',
    'pino-pretty',
    'thread-stream',
    '@swc/core',
    'autoprefixer',
    'postcss',
    'mongodb',
    'mongoose',
    'bcrypt',
    'playwright',
    'prettier',
    'typescript',
    'webpack',
  ],
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: false,
  },
  // `eslint` config is now managed via the project ESLint config (eslint.config.mjs)
  // Remove this entry for Next.js 16 compatibility.
  env: {
    // Prefer per-environment env var; provide dev-only fallback.
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL ||
      (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : undefined),
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.sanity.io', pathname: '/**' },
      { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' },
      { protocol: 'https', hostname: 'images.pexels.com', pathname: '/**' },
      { protocol: 'https', hostname: 'i.pravatar.cc', pathname: '/**' },
      { protocol: 'https', hostname: 'raw.githubusercontent.com', pathname: '/**' },
      // Use the active Vercel deployment host to allow previews and production without over-broad wildcards
      {
        protocol: 'https',
        hostname: process.env.VERCEL_URL || 'localhost',
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
  // Map known packages that ship test files to lightweight shims to avoid
  // bundling test artifacts (thread-stream includes test files that pull
  // in `tap`/`why-is-node-running`). Use Turbopack's resolve alias and
  // serverExternalPackages to keep these packages external on the server
  // and to rewrite problematic imports during the build.
  // Enable Cache Components per Next.js 16 migration guide. We migrated many
  // route segment exports to comments and added migration TODOs; enable the
  // feature now and run a build to capture remaining issues.
  cacheComponents: true,
  // Define cache profiles for use with cacheLife() and revalidateTag().
  // Profiles control client stale time, server revalidation, and expiration.
  cacheLife: {
    instant: {
      // Aggressive: immediate background revalidation
      stale: 0,
      revalidate: 60,
      expire: 60 * 60, // 1 hour
    },
    short: {
      stale: 30,
      revalidate: 60,
      expire: 60 * 5, // 5 minutes
    },
    medium: {
      stale: 300,
      revalidate: 600,
      expire: 60 * 60, // 1 hour
    },
    long: {
      stale: 60 * 60 * 24 * 7, // 7 days
      revalidate: 60 * 60 * 24, // 1 day
      expire: 60 * 60 * 24 * 7, // 7 days
    },
  },

  turbopack: {
    // Point Turbopack at the monorepo root so it can resolve symlinked
    // workspace packages outside the app folder. Adjust if your monorepo
    // layout differs.
    root: turbopackRoot,
    resolveAlias: {
      // Redirect `thread-stream` (and test subpath) to small shims so the
      // bundler doesn't try to include package test files (which pull in
      // dev-only deps like `tap`).
      'thread-stream': './src/shims/thread-stream-shim',
      'thread-stream/test': './src/shims/empty-thread-stream',
      // Prettier subpath shims: some libraries (e.g. @react-email/render)
      // request Prettier subpaths that aren't shipped in some environments.
      // Provide lightweight shims to silence module resolution warnings.
      'prettier/standalone': './src/shims/prettier-standalone-shim',
      'prettier/plugins/html': './src/shims/prettier-plugins-html-shim',
    },
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
