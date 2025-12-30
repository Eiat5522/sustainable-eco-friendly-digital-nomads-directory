import { expect, test } from '@playwright/test';

test.describe('Listing detail media & fallbacks', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/auth/session', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({}),
      });
    });

    await page.goto('/test/listing-detail');
    await page.waitForLoadState('networkidle');
  });

  test('gallery lightbox navigates between images', async ({ page }) => {
    const thumbnails = page.locator('[data-testid="gallery-thumbnail"]');
    await expect(thumbnails).toHaveCount(3);

    await thumbnails.first().click();

    const lightbox = page.locator('[data-testid="gallery-lightbox"]');
    await expect(lightbox).toBeVisible();

    const firstImage = lightbox.locator('img[alt="Preview 1"]');
    await expect(firstImage).toBeVisible();
    await expect(firstImage).toHaveAttribute('src', /gallery-1\.svg/);

    await page.getByLabel('Next image').click();

    const secondImage = lightbox.locator('img[alt="Preview 2"]');
    await expect(secondImage).toBeVisible();
    await expect(secondImage).toHaveAttribute('src', /gallery-2\.svg/);

    await page.getByLabel('Previous image').click();
    await expect(firstImage).toBeVisible();
    await expect(firstImage).toHaveAttribute('src', /gallery-1\.svg/);

    await page.getByLabel('Close preview').click();
    await expect(lightbox).not.toBeVisible();
  });

  test('related listings fall back to placeholder imagery when missing thumbnails', async ({
    page,
  }) => {
    const fallbackCard = page
      .locator('[data-testid="related-listing-card"]')
      .filter({ hasText: 'Eco Resort Koh Samui' });

    await expect(fallbackCard).toBeVisible();

    const fallbackImage = fallbackCard.locator('[data-testid="related-listing-fallback"]');
    await expect(fallbackImage).toBeVisible();
    const src = await fallbackImage.getAttribute('src');
    expect(src).toContain('placeholder_image');
  });

  test('long descriptions expand behind a read more toggle', async ({ page }) => {
    const description = page.locator('[data-testid="long-description"]');
    await expect(description).toBeVisible();

    const beforeMetrics = await description.evaluate(el => ({
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
      expanded: el.getAttribute('data-expanded'),
    }));

    expect(beforeMetrics.expanded).toBe('false');
    expect(beforeMetrics.scrollHeight).toBeGreaterThan(beforeMetrics.clientHeight);

    const toggle = page.locator('[data-testid="read-more-button"]');
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveText('Read more');

    await toggle.click();

    await expect(toggle).toHaveText('Read less');
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(description).toHaveAttribute('data-expanded', 'true');

    const afterMetrics = await description.evaluate(el => ({
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
    }));

    expect(afterMetrics.clientHeight).toBeGreaterThan(beforeMetrics.clientHeight);
    expect(afterMetrics.scrollHeight - afterMetrics.clientHeight).toBeLessThanOrEqual(4);

    await toggle.click();
    await expect(toggle).toHaveText('Read more');
    await expect(description).toHaveAttribute('data-expanded', 'false');
  });
});
