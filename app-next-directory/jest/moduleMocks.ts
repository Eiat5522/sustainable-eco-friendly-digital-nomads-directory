import { jest } from '@jest/globals';

type ModuleMockEntry = {
  id: string;
  factory: () => Promise<unknown> | unknown;
};

const providerIds = ['credentials', 'facebook', 'google', 'microsoft-entra-id', 'twitter'];

const moduleMocks: ModuleMockEntry[] = [
  { id: 'server-only', factory: () => import('../__mocks__/server-only.js') },
  { id: 'next/link', factory: () => import('../__mocks__/next/link.js') },
  { id: '@sanity/client', factory: () => import('../__mocks__/@sanity/client.ts') },
  { id: 'next-sanity', factory: () => import('../__mocks__/next-sanity.js') },
  { id: 'mongoose', factory: () => import('../__mocks__/mongoose.ts') },
  { id: 'node-fetch', factory: () => import('../__mocks__/node-fetch.js') },
  { id: 'clsx', factory: () => import('../__mocks__/clsx.js') },
  { id: 'tailwind-merge', factory: () => import('../__mocks__/tailwind-merge.js') },
  { id: 'embla-carousel-react', factory: () => import('../__mocks__/embla-carousel-react.js') },
  { id: 'embla-carousel-autoplay', factory: () => import('../__mocks__/embla-carousel-autoplay.js') },
  { id: 'leaflet', factory: () => import('../__mocks__/leaflet.ts') },
  { id: 'leaflet/dist/leaflet.css', factory: () => import('../__mocks__/leaflet/dist/leaflet.css.js') },
  {
    id: 'leaflet.markercluster/dist/MarkerCluster.css',
    factory: () => import('../__mocks__/leaflet.markercluster/dist/MarkerCluster.css.js'),
  },
  {
    id: 'leaflet.markercluster/dist/MarkerCluster.Default.css',
    factory: () => import('../__mocks__/leaflet.markercluster/dist/MarkerCluster.Default.css.js'),
  },
  { id: '@auth/mongodb-adapter', factory: () => import('../__mocks__/@auth/mongodb-adapter.js') },
  { id: '@/lib/dbConnect', factory: () => import('../__mocks__/lib/dbConnect.js') },
  { id: '@/lib/rate-limit', factory: () => import('../__mocks__/lib/rate-limit.js') },
  { id: '@/lib/logger', factory: () => import('../__mocks__/lib/logger.js') },
  { id: '@/lib/tokens', factory: () => import('../__mocks__/lib/tokens.js') },
  { id: '@/lib/email', factory: () => import('../__mocks__/lib/email.js') },
  { id: '@/mocks/server', factory: () => import('../__mocks__/server.ts') },
  { id: 'mocks/server', factory: () => import('../__mocks__/server.ts') },
  { id: '@/models/User', factory: () => import('../__mocks__/@/models/User.js') },
];

providerIds.forEach((providerId) => {
  const providerPath = `../__mocks__/next-auth/providers/${providerId}.js`;
  moduleMocks.push({ id: `next-auth/providers/${providerId}`, factory: () => import(providerPath) });
  moduleMocks.push({ id: `@auth/core/providers/${providerId}`, factory: () => import(providerPath) });
});

moduleMocks.push({ id: 'next-auth', factory: () => import('../__mocks__/next-auth.js') });
moduleMocks.push({ id: 'next-auth/react', factory: () => import('../__mocks__/next-auth/react.js') });
moduleMocks.push({ id: 'next-auth/jwt', factory: () => import('../__mocks__/next-auth/jwt.js') });

export async function registerStaticModuleMocks(): Promise<void> {
  await Promise.all(
    moduleMocks.map(async ({ id, factory }) => {
      try {
        await jest.unstable_mockModule(id, factory);
      } catch (error) {
        throw new Error(`Failed to register mock for module "${id}": ${(error as Error).message}`);
      }
    }),
  );
}
