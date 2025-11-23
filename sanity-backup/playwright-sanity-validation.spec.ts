import { test, expect } from '@playwright/test';

// Ad hoc test: Validate required fields in Sanity Studio Listing editor

test('Sanity Studio Listing form validation', async ({ page }) => {
  // Adjust the URL if your studio runs on a different port
  await page.goto('http://localhost:3333');

  // Wait for the Studio to load
  await page.waitForSelector('text=New Listing');

  // Click to create a new Listing
  await page.click('text=New Listing');

  // Try to publish/save without filling required fields
  await page.click('button:has-text("Publish")');

  // Check for validation errors (example: Name is required)
  await expect(page.locator('text=Required')).toBeVisible();

  // Optionally, fill in a required field and check that the error disappears
  await page.fill('input[name="name"]', 'Test Listing');
  await page.click('button:has-text("Publish")');
  // The error for name should disappear, but others may remain
  // (You can add more checks for other fields as needed)
});
