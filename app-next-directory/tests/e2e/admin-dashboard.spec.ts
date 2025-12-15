import { expect, test } from '@playwright/test';
import { loginAs } from './helpers/auth';

const BASE_URL = process.env.E2E_BASE_URL ?? process.env.BASE_URL ?? 'http://localhost:3000';

const ANALYTICS_FIXTURE = {
  overview: {
    totalUsers: 1275,
    totalListings: 412,
    totalReviews: 964,
    weeklySignups: 38,
    pendingModeration: 6,
  },
  userRoles: {
    admin: 5,
    user: 1200,
  },
  moderationQueue: [
    {
      id: 'queue-1',
      itemType: 'listing',
      itemName: 'Forest Cabin',
      itemId: 'listing-forest',
      reports: 2,
      lastActivity: '2024-01-10T10:00:00.000Z',
      status: 'pending',
    },
  ],
  generatedAt: '2024-01-10T10:00:00.000Z',
} as const;

test.describe('Admin Dashboard Integration', () => {
  test.describe('Access Control', () => {
    test.only('regular user cannot access admin dashboard', async ({ page }) => {
      await loginAs(
        page,
        process.env.E2E_USER_EMAIL ?? 'e2e-test@example.com',
        process.env.E2E_USER_PASSWORD ?? 'password123'
      );

      await page.goto(`${BASE_URL}/admin/dashboard`);
      await expect(page).toHaveURL(/\/auth\/login/);
    });

    test('venue owner cannot access admin dashboard', async ({ page }) => {
      await loginAs(
        page,
        process.env.E2E_VENUE_OWNER_EMAIL ?? 'venue@example.com',
        process.env.E2E_VENUE_OWNER_PASSWORD ?? 'password123'
      );

      await page.goto(`${BASE_URL}/admin/dashboard`);
      await expect(page).toHaveURL(/\/auth\/login/);
    });

    test('unauthenticated user is redirected to login', async ({ page }) => {
      await page.goto(`${BASE_URL}/admin/dashboard`);
      await expect(page).toHaveURL(/\/auth\/login/);
    });
  });

  test.describe('Admin Dashboard Functionality', () => {
    test.beforeEach(async ({ page }) => {
      await page.route('**/api/admin/analytics', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          json: { analytics: ANALYTICS_FIXTURE },
        });
      });
      await page.route('**/api/admin/moderation*', route => {
        if (route.request().method() === 'GET') {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            json: { items: ANALYTICS_FIXTURE.moderationQueue },
          });
        } else {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            json: { message: 'ok' },
          });
        }
      });

      await loginAs(
        page,
        process.env.E2E_ADMIN_EMAIL ?? 'admin@example.com',
        process.env.E2E_ADMIN_PASSWORD ?? 'password123'
      );
      await page.goto(`${BASE_URL}/admin/dashboard`);
    });

    test('loads admin dashboard page', async ({ page }) => {
      await expect(page.getByTestId('admin-dashboard')).toBeVisible({ timeout: 10000 });
      await expect(page.getByTestId('admin-dashboard-title')).toHaveText('Admin Dashboard');
      await expect(
        page.getByText('Monitor community health and moderate member activity.')
      ).toBeVisible();
    });

    test('displays analytics overview section', async ({ page }) => {
      const analyticsSection = page.getByTestId('analytics-overview');
      await expect(analyticsSection).toBeVisible();
      await expect(page.getByText('Overview')).toBeVisible();
      await expect(analyticsSection.locator('article')).toHaveCount(4);
      await expect(analyticsSection.getByText('Active members')).toBeVisible();
      await expect(analyticsSection.getByText('Total listings')).toBeVisible();
      await expect(analyticsSection.getByText('Weekly signups')).toBeVisible();
      await expect(analyticsSection.getByText('Items pending review')).toBeVisible();
    });

    test('renders analytics card values from the API payload', async ({ page }) => {
      const analyticsSection = page.getByTestId('analytics-overview');

      const expectCardValue = async (title: string, expected: number) => {
        const card = analyticsSection.locator('article').filter({ hasText: title });
        const valueText = await card.locator('[data-testid="analytics-card-value"]').textContent();
        const normalized = valueText?.replace(/[^\d-]/g, '') ?? '';
        expect(normalized).toBe(String(expected));
      };

      await expectCardValue('Active members', ANALYTICS_FIXTURE.overview.totalUsers);
      await expectCardValue('Total listings', ANALYTICS_FIXTURE.overview.totalListings);
      await expectCardValue('Weekly signups', ANALYTICS_FIXTURE.overview.weeklySignups);
      await expectCardValue('Items pending review', ANALYTICS_FIXTURE.overview.pendingModeration);

      await expect(page.getByTestId('pending-tasks')).toHaveText(
        `${ANALYTICS_FIXTURE.overview.pendingModeration} tasks assigned`
      );
    });

    test('displays moderation queue section', async ({ page }) => {
      const moderationSection = page.getByTestId('moderation-tools');
      await expect(moderationSection).toBeVisible();
      await expect(page.getByText('Moderation Queue')).toBeVisible();

      const table = moderationSection.locator('table');
      await expect(table).toBeVisible();

      const headers = await table.locator('thead th').allTextContents();
      expect(headers.map(h => h.trim())).toEqual([
        'Item',
        'Type',
        'Reports',
        'Last activity',
        'Status',
        'Actions',
      ]);
    });

    test('shows dashboard metadata', async ({ page }) => {
      await expect(page.getByText('Last refresh')).toBeVisible();
      await expect(page.getByTestId('pending-tasks')).toBeVisible();
      await expect(page.getByText('SLA: 8h')).toBeVisible();
    });

    test('shows empty state when moderation queue is empty', async ({ page }) => {
      await page.route('**/api/admin/moderation*', route => {
        if (route.request().method() === 'GET') {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            json: { items: [] },
          });
        } else {
          route.fulfill({ status: 200, contentType: 'application/json', json: { message: 'ok' } });
        }
      });

      await page.reload();

      const moderationSection = page.getByTestId('moderation-tools');
      await expect(moderationSection.getByText('No items pending moderation')).toBeVisible();
    });

    test('displays moderation queue items with proper structure', async ({ page }) => {
      const moderationSection = page.getByTestId('moderation-tools');
      const tableRows = moderationSection.locator('tbody tr');
      await expect(tableRows).toHaveCount(1);

      const row = tableRows.first();
      await expect(row.locator('td')).toHaveCount(6);
      await expect(row.getByRole('button', { name: /notes/i })).toBeVisible();
      await expect(row.getByRole('button', { name: /approve/i })).toBeVisible();
      await expect(row.getByRole('button', { name: /restrict/i })).toBeVisible();
    });

    test('analytics cards show numeric values', async ({ page }) => {
      const analyticsCards = page.getByTestId('analytics-overview').locator('article');
      const count = await analyticsCards.count();

      for (let i = 0; i < count; i += 1) {
        const valueElement = analyticsCards.nth(i).locator('[data-testid="analytics-card-value"]');
        await expect(valueElement).toBeVisible();
        const valueText = await valueElement.textContent();
        expect(valueText).toMatch(/[\d,]+|—/);
      }
    });

    test('page has proper SEO protection', async ({ page }) => {
      const robotsMeta = page.locator('meta[name="robots"]');
      await expect(robotsMeta).toHaveAttribute('content', 'noindex,nofollow');
    });
  });

  test.describe('Error Handling', () => {
    test('handles API errors gracefully', async ({ page }) => {
      await page.route('**/api/admin/analytics', route => {
        route.fulfill({ status: 500, body: 'Internal Server Error' });
      });
      await page.route('**/api/admin/moderation*', route => {
        route.fulfill({ status: 500, body: 'Internal Server Error' });
      });

      await loginAs(
        page,
        process.env.E2E_ADMIN_EMAIL ?? 'admin@example.com',
        process.env.E2E_ADMIN_PASSWORD ?? 'password123'
      );

      await page.goto(`${BASE_URL}/admin/dashboard`);

      await expect(page.getByTestId('admin-dashboard')).toBeVisible({ timeout: 15000 });
      await expect(page.getByText(/Unable to load dashboard data/i)).toBeVisible();
    });
  });
});
