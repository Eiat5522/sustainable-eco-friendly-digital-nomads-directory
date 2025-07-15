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
  await page.waitForSelector('#email', { timeout: 5000 });
  await page.fill('#email', 'test@example.com');
  await page.fill('#password', 'password123');
  await page.click('button[type="submit"]');

  // Wait for navigation to dashboard or home
  try {
    await page.waitForURL('**/dashboard', { timeout: 10000 });
  } catch {
    // Fallback to home page
    await page.waitForURL('/', { timeout: 5000 });
  }

  await page.context().storageState({ path: authFile });
});

// Authenticate admin user
setup('authenticate admin', async ({ page }) => {
  await page.goto('/login');
  await page.waitForSelector('#email', { timeout: 5000 });
  await page.fill('#email', 'admin@example.com');
  await page.fill('#password', 'password123');
  await page.click('button[type="submit"]');

  try {
    await page.waitForURL('**/dashboard', { timeout: 10000 });
  } catch {
    await page.waitForURL('/', { timeout: 5000 });
  }

  await page.context().storageState({ path: adminAuthFile });
});

// Authenticate editor user
setup('authenticate editor', async ({ page }) => {
  await page.goto('/login');
  await page.waitForSelector('#email', { timeout: 5000 });
  await page.fill('#email', 'editor@example.com');
  await page.fill('#password', 'password123');
  await page.click('button[type="submit"]');

  try {
    await page.waitForURL('**/dashboard', { timeout: 10000 });
  } catch {
    await page.waitForURL('/', { timeout: 5000 });
  }

  await page.context().storageState({ path: editorAuthFile });
});

// Authenticate venue owner user
setup('authenticate venue owner', async ({ page }) => {
  await page.goto('/login');
  await page.waitForSelector('#email', { timeout: 5000 });
  await page.fill('#email', 'venueowner@example.com');
  await page.fill('#password', 'password123');
  await page.click('button[type="submit"]');

  try {
    await page.waitForURL('**/dashboard', { timeout: 10000 });
  } catch {
    await page.waitForURL('/', { timeout: 5000 });
  }

  await page.context().storageState({ path: venueOwnerAuthFile });
});
