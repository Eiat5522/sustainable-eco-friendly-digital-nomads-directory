import fs from 'node:fs';
import path from 'node:path';
import { test as setup, type Page } from '@playwright/test';

const storageDir = path.resolve(process.cwd(), 'tests', 'storageStates');
if (!fs.existsSync(storageDir)) {
  fs.mkdirSync(storageDir, { recursive: true });
}

const authFile = path.join(storageDir, 'user.json');
const adminAuthFile = path.join(storageDir, 'admin.json');
const venueOwnerAuthFile = path.join(storageDir, 'venue-owner.json');

type AuthConfig = {
  emailEnvVar: string;
  passwordEnvVar: string;
  defaultEmail: string;
  defaultPassword: string;
  outputPath: string;
  expectedPaths: string[];
};

async function authenticateUser(page: Page, config: AuthConfig) {
  const {
    emailEnvVar,
    passwordEnvVar,
    defaultEmail,
    defaultPassword,
    outputPath,
    expectedPaths,
  } = config;

  const email = process.env[emailEnvVar] || defaultEmail;
  const password = process.env[passwordEnvVar] || defaultPassword;

  await page.goto('/auth/login');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');

  await page.waitForURL(
    (url: URL) =>
      expectedPaths.some(path => (path === '/' ? url.pathname === '/' : url.pathname.includes(path))),
    { timeout: 15000 }
  );

  await page.waitForSelector('[data-testid="user-menu"]', { timeout: 5000 });

  await page.context().storageState({ path: outputPath });
}

// Authenticate regular user
setup('authenticate user', async ({ page }) => {
  await authenticateUser(page, {
    emailEnvVar: 'E2E_USER_EMAIL',
    passwordEnvVar: 'E2E_USER_PASSWORD',
    defaultEmail: 'e2e-test@example.com',
    defaultPassword: 'TestSecurePass123!',
    outputPath: authFile,
    expectedPaths: ['/dashboard', '/'],
  });
});

// Authenticate admin user
setup('authenticate admin', async ({ page }) => {
  await authenticateUser(page, {
    emailEnvVar: 'E2E_ADMIN_EMAIL',
    passwordEnvVar: 'E2E_ADMIN_PASSWORD',
    defaultEmail: 'admin@example.com',
    defaultPassword: 'TestSecurePass123!',
    outputPath: adminAuthFile,
    expectedPaths: ['/admin', '/dashboard', '/'],
  });
});

// Authenticate venue owner user
setup('authenticate venue owner', async ({ page }) => {
  await authenticateUser(page, {
    emailEnvVar: 'E2E_VENUE_OWNER_EMAIL',
    passwordEnvVar: 'E2E_VENUE_OWNER_PASSWORD',
    defaultEmail: 'venue@example.com',
    defaultPassword: 'TestSecurePass123!',
    outputPath: venueOwnerAuthFile,
    expectedPaths: ['/dashboard', '/'],
  });
});
