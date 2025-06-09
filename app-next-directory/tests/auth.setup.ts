import { expect, test as setup } from '@playwright/test';

const authFile = 'tests/.auth/user.json';
const adminAuthFile = 'tests/.auth/admin.json';
const editorAuthFile = 'tests/.auth/editor.json';
const venueOwnerAuthFile = 'tests/.auth/venue-owner.json';

// Setup test users
setup('create test users', async ({ request }) => {
  // Create regular user
  await request.post('/api/auth/register', {
    data: {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    }
  });

  // Create admin user
  await request.post('/api/auth/register', {
    data: {
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'password123',
      role: 'admin'
    }
  });

  // Create editor user
  await request.post('/api/auth/register', {
    data: {
      name: 'Editor User',
      email: 'editor@example.com',
      password: 'password123',
      role: 'editor'
    }
  });

  // Create venue owner user
  await request.post('/api/auth/register', {
    data: {
      name: 'Venue Owner',
      email: 'venueowner@example.com',
      password: 'password123',
      role: 'venueOwner'
    }
  });
});

// Authenticate regular user
setup('authenticate user', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');

  await page.waitForURL('/');
  await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();

  await page.context().storageState({ path: authFile });
});

// Authenticate admin user
setup('authenticate admin', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[name="email"]', 'admin@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');

  await page.waitForURL('/');
  await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();

  await page.context().storageState({ path: adminAuthFile });
});

// Authenticate editor user
setup('authenticate editor', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[name="email"]', 'editor@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');

  await page.waitForURL('/');
  await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();

  await page.context().storageState({ path: editorAuthFile });
});

// Authenticate venue owner user
setup('authenticate venue owner', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[name="email"]', 'venueowner@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');

  await page.waitForURL('/');
  await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();

  await page.context().storageState({ path: venueOwnerAuthFile });
});
