import fs from 'node:fs';
import path from 'node:path';
import type { Page } from '@playwright/test';
import { test as base, expect } from '@playwright/test';
import {
  createTestData,
  getSessionForRole,
  TEST_SESSION_COOKIE_NAME,
} from '@tests/helpers/test-data';
import { encode } from 'next-auth/jwt';
import type { Role } from '@/models/User';

const baseUrl = new URL(
  process.env.BASE_URL ?? process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000'
);

const authSecret =
  process.env.NEXTAUTH_SECRET ??
  process.env.AUTH_SECRET ??
  'e2e-test-secret-for-testing-only-not-production';

async function buildSessionToken(user: {
  id: string;
  name: string;
  email: string;
  role: Role;
  plan?: string;
  image?: string;
}) {
  return encode({
    token: {
      sub: user.id,
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      plan: user.plan,
      image: user.image ?? null,
    },
    secret: authSecret,
    salt: TEST_SESSION_COOKIE_NAME,
  });
}

type StorageStateOrigin = {
  origin: string;
  localStorage: Array<{ name: string; value: string }>;
};

type StorageStateParsed = {
  cookies?: Array<Record<string, unknown>>;
  origins?: StorageStateOrigin[];
};

const expectedStorageStateSchema =
  '{ cookies?: Array<Record<string, unknown>>; origins?: Array<{ origin: string; localStorage: Array<{ name: string; value: string }> }> }';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function describeValue(value: unknown) {
  const kind = Array.isArray(value) ? 'array' : typeof value;
  if (typeof value === 'string') {
    return `${kind} "${value}"`;
  }
  try {
    return `${kind} ${JSON.stringify(value)}`;
  } catch {
    return `${kind} ${String(value)}`;
  }
}

function assertStorageStateShape(parsed: unknown): asserts parsed is StorageStateParsed {
  if (!isPlainObject(parsed)) {
    throw new Error(
      `Invalid storageState. Expected object with schema ${expectedStorageStateSchema}. Received ${describeValue(parsed)}.`
    );
  }

  const { cookies, origins } = parsed;

  if (cookies !== undefined) {
    if (!Array.isArray(cookies)) {
      throw new Error(
        `Invalid storageState.cookies. Expected array. Received ${describeValue(cookies)}.`
      );
    }
    cookies.forEach((cookie, index) => {
      if (!isPlainObject(cookie)) {
        throw new Error(
          `Invalid storageState.cookies[${index}]. Expected object. Received ${describeValue(cookie)}.`
        );
      }
    });
  }

  if (origins !== undefined) {
    if (!Array.isArray(origins)) {
      throw new Error(
        `Invalid storageState.origins. Expected array. Received ${describeValue(origins)}.`
      );
    }
    origins.forEach((originEntry, index) => {
      if (!isPlainObject(originEntry)) {
        throw new Error(
          `Invalid storageState.origins[${index}]. Expected object. Received ${describeValue(originEntry)}.`
        );
      }
      const origin = originEntry.origin;
      if (typeof origin !== 'string') {
        throw new Error(
          `Invalid storageState.origins[${index}].origin. Expected string. Received ${describeValue(origin)}.`
        );
      }
      const localStorage = originEntry.localStorage;
      if (!Array.isArray(localStorage)) {
        throw new Error(
          `Invalid storageState.origins[${index}].localStorage. Expected array. Received ${describeValue(
            localStorage
          )}.`
        );
      }
      localStorage.forEach((entry, entryIndex) => {
        if (!isPlainObject(entry)) {
          throw new Error(
            `Invalid storageState.origins[${index}].localStorage[${entryIndex}]. Expected object. Received ${describeValue(
              entry
            )}.`
          );
        }
        if (typeof entry.name !== 'string') {
          throw new Error(
            `Invalid storageState.origins[${index}].localStorage[${entryIndex}].name. Expected string. Received ${describeValue(
              entry.name
            )}.`
          );
        }
        if (typeof entry.value !== 'string') {
          throw new Error(
            `Invalid storageState.origins[${index}].localStorage[${entryIndex}].value. Expected string. Received ${describeValue(
              entry.value
            )}.`
          );
        }
      });
    });
  }
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function applySession(page: Page, role: Role) {
  const session = getSessionForRole(role);
  if (!session) {
    throw new Error(`Test session not found for role: ${role}`);
  }

  const encodedToken = await buildSessionToken(session.user);
  const cookieOrigin = baseUrl?.origin ?? 'http://localhost:3000';
  const origin = cookieOrigin;
  const serialisableUser = {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role,
    plan: session.user.plan,
    image: session.user.image ?? null,
  };

  let storageEntries: StorageStateOrigin['localStorage'] = [];
  const storagePath = path.resolve(process.cwd(), 'tests', 'storageStates', `${role}.json`);
  if (fs.existsSync(storagePath)) {
    try {
      const raw = fs.readFileSync(storagePath, 'utf-8');
      const parsed = JSON.parse(raw);
      assertStorageStateShape(parsed);
      const originEntry = parsed.origins?.find(
        o => o.origin === origin || o.origin === `${origin}/`
      );
      if (originEntry?.localStorage?.length) {
        storageEntries = originEntry.localStorage;
      }
    } catch (err) {
      console.warn('applySession: failed to read storageState, continuing with token auth', err);
    }
  }

  if (page.isClosed()) {
    throw new Error('applySession: cannot apply session to a closed page');
  }

  await page.context().addInitScript(
    ({ token, user, storageEntries }) => {
      if (Array.isArray(storageEntries)) {
        for (const entry of storageEntries) {
          if (
            entry &&
            typeof entry.name === 'string' &&
            typeof entry.value === 'string'
          ) {
            window.localStorage.setItem(entry.name, entry.value);
          }
        }
      }

      window.localStorage.setItem('token', token);
      window.localStorage.setItem('currentUser', JSON.stringify(user));
      window.sessionStorage.setItem('token', token);
    },
    {
      token: encodedToken,
      user: serialisableUser,
      storageEntries,
    }
  );

  const cookieUrl = {
    name: TEST_SESSION_COOKIE_NAME,
    value: encodedToken,
    url: origin,
    httpOnly: true,
    secure: origin.startsWith('https:'),
    sameSite: 'Lax' as const,
  } as const;

  await page.context().addCookies([cookieUrl]);
  let cookies = await page.context().cookies(origin).catch(() => []);
  if (!cookies.some(cookie => cookie.name === TEST_SESSION_COOKIE_NAME)) {
    const cookieDomain = {
      name: TEST_SESSION_COOKIE_NAME,
      value: encodedToken,
      domain: new URL(origin).hostname,
      path: '/',
      httpOnly: true,
      secure: origin.startsWith('https:'),
      sameSite: 'Lax' as const,
    } as const;
    await page.context().addCookies([cookieDomain]).catch(() => undefined);
    cookies = await page.context().cookies(origin).catch(() => []);
  }
  if (!cookies.some(cookie => cookie.name === TEST_SESSION_COOKIE_NAME)) {
    console.warn('applySession: session cookie missing after addCookies', {
      origin,
      cookieNames: cookies.map(cookie => cookie.name),
    });
  }

  const currentUrl = page.url();
  if (!currentUrl.startsWith(origin)) {
    // localStorage will be set on the next navigation via init script
  } else {
    await page
      .evaluate(
        ({ token, user, storageEntries }) => {
          if (Array.isArray(storageEntries)) {
            for (const entry of storageEntries) {
              if (
                entry &&
                typeof entry.name === 'string' &&
                typeof entry.value === 'string'
              ) {
                window.localStorage.setItem(entry.name, entry.value);
              }
            }
          }

          window.localStorage.setItem('token', token);
          window.localStorage.setItem('currentUser', JSON.stringify(user));
          window.sessionStorage.setItem('token', token);
        },
        {
          token: encodedToken,
          user: serialisableUser,
          storageEntries,
        }
      )
      .catch(() => undefined);
  }

  return { ...session, token: encodedToken };
}

async function loginViaForm(page: Page, email: string, password: string, redirectPattern: RegExp) {
  await page.goto('/auth/login', { waitUntil: 'domcontentloaded' });
  await page.locator('input[name="email"]').first().fill(email);
  await page.locator('input[name="password"]').first().fill(password);
  const submit = page.locator('button[type="submit"]');
  await Promise.all([
    page
      .waitForURL(redirectPattern, { timeout: 15_000, waitUntil: 'domcontentloaded' })
      .catch(() => undefined),
    submit.click(),
  ]);
}

async function ensureServerSession(
  page: Page,
  session: { user: { email: string; role: Role; password?: string } },
  redirectTo?: string
) {
  try {
    const response = await page.request.get('/api/auth/session');
    if (response.ok()) {
      const data = (await response.json().catch(() => null)) as { user?: { email?: string } } | null;
      if (data?.user?.email && data.user.email === session.user.email) {
        return;
      }
    }
  } catch {
    // ignore and fall back to form login below
  }

  const roleDefaultPasswords: Record<string, string> = {
    admin: process.env.E2E_ADMIN_PASSWORD ?? 'TestSecurePass123!',
    user: process.env.E2E_USER_PASSWORD ?? 'TestSecurePass123!',
    venueOwner: process.env.E2E_VENUE_OWNER_PASSWORD ?? 'TestSecurePass123!',
    superAdmin: process.env.E2E_SUPERADMIN_PASSWORD ?? 'TestSecurePass123!',
  };
  const fallbackPassword =
    session.user.password ?? roleDefaultPasswords[session.user.role] ?? 'TestSecurePass123!';

  const targetPath = redirectTo
    ? redirectTo.startsWith('http')
      ? new URL(redirectTo).pathname
      : redirectTo
    : '/';
  const pattern = new RegExp(escapeRegExp(targetPath));
  await loginViaForm(page, session.user.email, fallbackPassword, pattern);
}

export async function loginAs(page: Page, role: Role, options: { redirectTo?: string } = {}) {
  const session = await applySession(page, role);
  if (options.redirectTo) {
    const target = options.redirectTo.startsWith('http')
      ? options.redirectTo
      : `${baseUrl.origin}${options.redirectTo.startsWith('/') ? options.redirectTo : `/${options.redirectTo}`}`;
    await page.goto(target, { waitUntil: 'domcontentloaded' }).catch(() => undefined);
  }
  await ensureServerSession(page, session, options.redirectTo);
  return session;
}

export const test = base.extend<{ authenticatedPage: Page; adminPage: Page }>({
  authenticatedPage: async ({ page }, use) => {
    await loginAs(page, 'user', { redirectTo: '/profile' });
    await use(page);
  },
  adminPage: async ({ page }, use) => {
    await loginAs(page, 'admin', { redirectTo: '/admin' });
    await use(page);
  },
});

export { expect };

async function loginByRole(
  page: Page,
  role: Role,
  fallbackPath: string,
  email?: string,
  password?: string
) {
  if (email) {
    // If the caller provided an email but no password, use an env override
    // or fall back to the seeded password for the given role so tests
    // remain in sync with fixtures.
    const roleDefaultPasswords: Record<string, string> = {
      admin: process.env.E2E_ADMIN_PASSWORD ?? 'TestSecurePass123!',
      user: process.env.E2E_USER_PASSWORD ?? 'TestSecurePass123!',
      venueOwner: process.env.E2E_VENUE_OWNER_PASSWORD ?? 'TestSecurePass123!',
    };
    const pwd = password ?? roleDefaultPasswords[role] ?? 'TestSecurePass123!';
    await loginViaForm(page, email, pwd, new RegExp(fallbackPath));
    await page.waitForLoadState('domcontentloaded').catch(() => undefined);
    return;
  }

  await loginAs(page, role, { redirectTo: fallbackPath });
  await page.waitForLoadState('domcontentloaded').catch(() => undefined);
}

export const TestHelpers = {
  async fillListingForm(page: Page, data: any = {}) {
    const defaultData = {
      name: 'Test Eco Space',
      description: 'A sustainable coworking space',
      category: 'coworking',
      city: 'Bangkok',
      address: '123 Green Street',
      ...data,
    };

    await page.fill('input[name="name"]', defaultData.name);
    await page.fill('textarea[name="description"]', defaultData.description);
    await page.selectOption('select[name="category"]', defaultData.category);
    await page.fill('input[name="city"]', defaultData.city);
    await page.fill('input[name="address"]', defaultData.address);
  },

  async verifyListingCard(page: Page, data: any) {
    const card = page.locator('[data-testid="listing-card"]').filter({ hasText: data.name });
    await expect(card).toBeVisible();
    await expect(card.locator('[data-testid="listing-category"]')).toHaveText(data.category);
    await expect(card.locator('[data-testid="listing-city"]')).toHaveText(data.city);
  },

  async submitReview(page: Page, data: any = {}) {
    const defaultData = {
      rating: 5,
      comment: 'Great eco-friendly space!',
      ...data,
    };

    await page.getByTestId(`rating-star-${defaultData.rating}`).click();
    await page.getByTestId('review-comment-field').fill(defaultData.comment);
    await page.getByTestId('submit-review-button').click();
  },

  async checkToast(page: Page, message: string) {
    const toast = page.locator('[data-testid="toast"]');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText(message);
  },

  async loginAsUser(page: Page, email?: string, password?: string) {
    await loginByRole(page, 'user', '/profile', email, password);
  },

  async loginAsVenueOwner(page: Page, email?: string, password?: string) {
    await loginByRole(page, 'venueOwner', '/dashboard/listings', email, password);
  },

  async loginAsPremium(page: Page, email?: string, password?: string) {
    await TestHelpers.loginAsVenueOwner(page, email, password);
  },

  async loginAsAdmin(page: Page, email?: string, password?: string) {
    await loginByRole(page, 'admin', '/admin', email, password);
  },

  async createListing(page: Page, data: any = {}) {
    await page.goto('/dashboard/listings/new');
    await TestHelpers.fillListingForm(page, data);
    await page.click('button[type="submit"]');
    await TestHelpers.checkToast(page, 'Listing created successfully');
    const urlPath = new URL(page.url()).pathname;
    const listingId = urlPath
      .split('/')
      .filter(segment => segment.length > 0)
      .pop();
    if (!listingId) {
      throw new Error(`Failed to extract listing ID from URL: ${page.url()}`);
    }
    const response = await TestHelpers.makeAuthenticatedRequest(
      page,
      `/api/listings/manage/${listingId}`
    );
    if (!response.ok()) {
      throw new Error(`Failed to fetch listing: ${response.status()} ${response.statusText()}`);
    }
    const listing = await response.json();
    return listing;
  },

  async makeAuthenticatedRequest(page: Page, endpoint: string, options: any = {}) {
    const token = await page.evaluate(() => window.localStorage.getItem('token'));
    const { timeout = 15000, ...requestOptions } = options;
    return page.request.fetch(endpoint, {
      ...requestOptions,
      timeout,
      headers: {
        ...requestOptions.headers,
        Authorization: token ? `Bearer ${token}` : undefined,
      },
    });
  },

  getSeededData() {
    return createTestData();
  },
};

export const CustomAssertions = {
  async assertPagination(
    page: Page,
    { currentPage, totalPages }: { currentPage: number; totalPages: number }
  ) {
    await expect(page.locator('[data-testid="pagination"]')).toBeVisible();
    await expect(page.locator('[data-testid="current-page"]')).toHaveText(String(currentPage));
    await expect(page.locator('[data-testid="total-pages"]')).toHaveText(String(totalPages));
  },

  async assertFormError(page: Page, fieldName: string, errorMessage: string) {
    const errorElement = page.locator(`[data-testid="error-${fieldName}"]`);
    await expect(errorElement).toBeVisible();
    await expect(errorElement).toHaveText(errorMessage);
  },

  async assertAuthenticated(page: Page) {
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  },

  async assertAdminAccess(page: Page) {
    await expect(page.locator('[data-testid="admin-dashboard"]')).toBeVisible();
  },
};
