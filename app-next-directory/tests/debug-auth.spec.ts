import { structuredLogger } from '@/lib/logger';
import { expect, test } from './fixtures';

test.describe('Debug Authentication', () => {
  test('debug admin fixture', async ({ adminPage }) => {
    structuredLogger.debug('Admin page fixture is working');

    // Try to navigate to the home page first
    await adminPage.goto('/');

    // Check if the page loads
    const title = await adminPage.title();
    structuredLogger.debug('Page title:', { title });

    // Check if we can see any content
    const body = await adminPage.locator('body').first();
    const bodyText = await body.textContent();
    structuredLogger.debug('Body contains text:', { hasText: bodyText ? 'Yes' : 'No' });

    // Simple assertion
    expect(title).toBeTruthy();
  });

  test('debug venue owner fixture', async ({ venueOwnerPage }) => {
    structuredLogger.debug('Venue owner page fixture is working');

    await venueOwnerPage.goto('/');
    const title = await venueOwnerPage.title();
    structuredLogger.debug('Page title:', { title });

    expect(title).toBeTruthy();
  });
});
