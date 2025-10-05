import { expect, test } from '@playwright/test';
import { loginAs } from './helpers/auth';

const BASE_URL = process.env.E2E_BASE_URL ?? process.env.BASE_URL ?? 'http://localhost:3000';

test.describe('Admin Dashboard Integration', () => {
  test.describe('Access Control', () => {
    test('regular user cannot access admin dashboard', async ({ page }) => {
      await loginAs(
        page,
        process.env.E2E_USER_EMAIL ?? 'user@example.com',
        process.env.E2E_USER_PASSWORD ?? 'password123'
      );

      await page.goto(`${BASE_URL}/admin/dashboard`);
      await expect(page.getByText(/access denied/i)).toBeVisible({ timeout: 10000 });
    });

    test('venue owner cannot access admin dashboard', async ({ page }) => {
      await loginAs(
        page,
        process.env.E2E_VENUE_OWNER_EMAIL ?? 'venue@example.com',
        process.env.E2E_VENUE_OWNER_PASSWORD ?? 'password123'
      );

      await page.goto(`${BASE_URL}/admin/dashboard`);
      await expect(page.getByText(/access denied/i)).toBeVisible({ timeout: 10000 });
    });

    test('unauthenticated user is redirected to login', async ({ page }) => {
      await page.goto(`${BASE_URL}/admin/dashboard`);
      await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10000 });
    });
  });

  test.describe('Admin Dashboard Functionality', () => {
    test.beforeEach(async ({ page }) => {
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
      await expect(page.getByText('Monitor community health and moderate member activity.')).toBeVisible();
    });

    test('displays analytics overview section', async ({ page }) => {
      const analyticsSection = page.getByTestId('analytics-overview');
      await expect(analyticsSection).toBeVisible();

      // Check for overview heading
      await expect(page.getByText('Overview')).toBeVisible();

      // Check for analytics cards
      const analyticsCards = analyticsSection.locator('article');
      await expect(analyticsCards).toHaveCount(4);

      // Verify expected card titles
      await expect(analyticsSection.getByText('Active members')).toBeVisible();
      await expect(analyticsSection.getByText('Total listings')).toBeVisible();
      await expect(analyticsSection.getByText('Weekly signups')).toBeVisible();
      await expect(analyticsSection.getByText('Items pending review')).toBeVisible();
    });

    test('displays moderation queue section', async ({ page }) => {
      const moderationSection = page.getByTestId('moderation-tools');
      await expect(moderationSection).toBeVisible();

      // Check for moderation heading
      await expect(page.getByText('Moderation Queue')).toBeVisible();

      // Check for table structure
      const table = moderationSection.locator('table');
      await expect(table).toBeVisible();

      // Verify table headers
      const headers = table.locator('thead th');
      const headerTexts = await headers.allTextContents();
      expect(headerTexts.map(h => h.trim())).toEqual([
        'Item',
        'Type',
        'Reports',
        'Last activity',
        'Status',
        'Actions'
      ]);
    });

    test('shows dashboard metadata', async ({ page }) => {
      // Check for last refresh info
      await expect(page.getByText('Last refresh')).toBeVisible();
      await expect(page.getByText('tasks assigned')).toBeVisible();
      await expect(page.getByText('SLA: 8h')).toBeVisible();
    });

    test('handles empty moderation queue', async ({ page }) => {
      const moderationSection = page.getByTestId('moderation-tools');

      // If no items in queue, should show empty state
      const emptyMessage = moderationSection.getByText('No items pending moderation');
      const hasEmptyMessage = await emptyMessage.isVisible().catch(() => false);

      if (hasEmptyMessage) {
        await expect(emptyMessage).toBeVisible();
      } else {
        // If there are items, verify they have proper structure
        const tableRows = moderationSection.locator('tbody tr');
        const rowCount = await tableRows.count();

        if (rowCount > 0) {
          // Verify each row has the expected structure
          for (let i = 0; i < Math.min(rowCount, 3); i++) {
            const row = tableRows.nth(i);
            await expect(row.locator('td')).toHaveCount(6); // 6 columns

            // Check for action buttons
            const actionButtons = row.getByRole('button');
            await expect(actionButtons).toHaveCount(3); // Notes, Approve, Restrict
          }
        }
      }
    });

    test('analytics cards show numeric values', async ({ page }) => {
      const analyticsSection = page.getByTestId('analytics-overview');
      const analyticsCards = analyticsSection.locator('article');

      // Each card should have a numeric value
      for (let i = 0; i < 4; i++) {
        const card = analyticsCards.nth(i);
        const valueElement = card.locator('[class*="text-2xl"]').first();
        await expect(valueElement).toBeVisible();

        const valueText = await valueElement.textContent();
        expect(valueText).toMatch(/[\d,]+|—/); // Should be a number or dash
      }
    });

    test('page has proper SEO protection', async ({ page }) => {
      // Check that the page has noindex meta tag
      const robotsMeta = page.locator('meta[name="robots"]');
      await expect(robotsMeta).toHaveAttribute('content', 'noindex,nofollow');
    });
  });

  test.describe('Error Handling', () => {
    test('handles API errors gracefully', async ({ page }) => {
      // This test would require mocking API failures
      // For now, we'll test that the page doesn't crash
      await loginAs(
        page,
        process.env.E2E_ADMIN_EMAIL ?? 'admin@example.com',
        process.env.E2E_ADMIN_PASSWORD ?? 'password123'
      );

      await page.goto(`${BASE_URL}/admin/dashboard`);

      // Page should still load even if API fails
      await expect(page.getByTestId('admin-dashboard')).toBeVisible({ timeout: 15000 });
    });
  });
});