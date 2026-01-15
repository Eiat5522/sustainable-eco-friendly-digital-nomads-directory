import type { APIRequestContext } from '@playwright/test';

/**
 * Lightweight API helpers for test seeding and cleanup.
 *
 * NOTE: These functions call test-only endpoints under `/api/test/*`. Replace paths
 * if your project exposes different routes for test fixtures.
 */

export async function createTestUser(request: APIRequestContext, user: Record<string, unknown>) {
  const res = await request.post('/api/test/users', { data: user });
  if (!res.ok()) throw new Error(`createTestUser failed: ${res.status()}`);
  return res.json();
}

export async function deleteTestUser(request: APIRequestContext, email: string) {
  const res = await request.del('/api/test/users', { data: { email } });
  if (!res.ok()) throw new Error(`deleteTestUser failed: ${res.status()}`);
  return res.json().catch(() => ({}));
}

export async function createTestListing(
  request: APIRequestContext,
  listing: Record<string, unknown>
) {
  const res = await request.post('/api/test/listings', { data: listing });
  if (!res.ok()) throw new Error(`createTestListing failed: ${res.status()}`);
  return res.json();
}

export async function deleteTestListing(request: APIRequestContext, slug: string) {
  const res = await request.del('/api/test/listings', { data: { slug } });
  if (!res.ok()) throw new Error(`deleteTestListing failed: ${res.status()}`);
  return res.json().catch(() => ({}));
}

export async function seedDefaults(request: APIRequestContext) {
  // Example seed payloads — adapt to your app's required fields
  const users = [
    {
      email: 'test_customer@example.com',
      password: 'password',
      role: 'customer',
      name: 'E2E Customer',
    },
    { email: 'test_owner@example.com', password: 'password', role: 'owner', name: 'E2E Owner' },
  ];

  const listings = [
    {
      title: 'e2e: Test Listing 1',
      slug: 'e2e-test-listing-1',
      city: 'Testville',
      category: 'Coworking',
      ecoTags: ['solar-powered'],
      description: 'Automated seed listing for E2E tests',
    },
  ];

  for (const u of users) {
    await createTestUser(request, u);
  }
  for (const l of listings) {
    await createTestListing(request, l);
  }
}

export async function cleanupDefaults(request: APIRequestContext) {
  // Remove resources created by seedDefaults. Adjust as needed.
  await deleteTestListing(request, 'e2e-test-listing-1');
  await deleteTestUser(request, 'test_customer@example.com');
  await deleteTestUser(request, 'test_owner@example.com');
}
