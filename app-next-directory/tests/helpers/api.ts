import type { APIRequestContext, APIResponse } from '@playwright/test';

export type TestUserRole = string;

export type TestUserPayload = {
  email: string;
  password: string;
  role: TestUserRole;
  name: string;
  [key: string]: unknown;
};

export type TestListingPayload = {
  title: string;
  slug: string;
  city: string;
  category: string;
  ecoTags: string[];
  description: string;
  [key: string]: unknown;
};

const ensureResponse = async <T = unknown>(response: APIResponse, label: string): Promise<T> => {
  if (!response.ok()) throw new Error(`${label} failed: ${response.status()}`);
  return response.json() as Promise<T>;
};

/**
 * Lightweight API helpers for test seeding and cleanup.
 *
 * NOTE: These functions call test-only endpoints under `/api/test/*`. Replace paths
 * if your project exposes different routes for test fixtures.
 */

export async function createTestUser(request: APIRequestContext, user: TestUserPayload) {
  const res = await request.post('/api/test/users', { data: user });
  return ensureResponse(res, 'createTestUser');
}

export async function deleteTestUser(request: APIRequestContext, email: string) {
  const res = await request.del('/api/test/users', { data: { email } });
  return ensureResponse(res, 'deleteTestUser').catch(() => ({}) as unknown);
}

export async function createTestListing(request: APIRequestContext, listing: TestListingPayload) {
  const res = await request.post('/api/test/listings', { data: listing });
  return ensureResponse(res, 'createTestListing');
}

export async function deleteTestListing(request: APIRequestContext, slug: string) {
  const res = await request.del('/api/test/listings', { data: { slug } });
  return ensureResponse(res, 'deleteTestListing').catch(() => ({}) as unknown);
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
