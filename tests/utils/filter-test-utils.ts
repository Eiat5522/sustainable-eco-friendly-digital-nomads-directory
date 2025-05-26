import { type Page } from '@playwright/test';

export interface FilterOptions {
  categories?: string[];
  ecoTags?: string[];
  priceRange?: {
    min?: number;
    max?: number;
  };
}

export async function applyFilters(page: Page, options: FilterOptions) {
  // Clear existing filters first
  await clearFilters(page);

  // Apply category filters
  if (options.categories?.length) {
    for (const category of options.categories) {
      await page.getByLabel(category, { exact: true }).check();
    }
  }

  // Apply eco tag filters
  if (options.ecoTags?.length) {
    for (const tag of options.ecoTags) {
      await page.getByLabel(tag.replace(/-/g, ' '), { exact: true }).check();
    }
  }

  // Apply price range if provided
  if (options.priceRange) {
    if (options.priceRange.min !== undefined) {
      await page.locator('input[placeholder="Min"]').fill(options.priceRange.min.toString());
    }
    if (options.priceRange.max !== undefined) {
      await page.locator('input[placeholder="Max"]').fill(options.priceRange.max.toString());
    }
  }

  // Wait for filters to be applied
  await page.waitForTimeout(500);
}

export async function clearFilters(page: Page) {
  const checkedFilters = await page.locator('input[type="checkbox"]:checked').all();
  for (const filter of checkedFilters) {
    await filter.uncheck();
  }
  
  const priceInputs = await page.locator('input[type="number"]').all();
  for (const input of priceInputs) {
    await input.fill('');
  }

  // Wait for filters to be cleared
  await page.waitForTimeout(500);
}
