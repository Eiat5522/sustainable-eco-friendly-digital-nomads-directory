/// <reference types="jest-playwright-preset" />
import { loginAs } from './helpers/auth';

const baseURL = process.env.E2E_BASE_URL ?? process.env.BASE_URL ?? 'http://localhost:3000';

describe('RBAC (Jest + jest-playwright)', () => {
  it('regular user cannot access admin', async () => {
    await loginAs(page, process.env.E2E_USER_EMAIL ?? 'user@example.com',
                  process.env.E2E_USER_PASSWORD ?? 'password123');
    await page.goto(`${baseURL}/admin`);
    await page.waitForSelector('text=/access denied/i', { state: 'visible', timeout: 10000 });
  });

  it('admin sees admin dashboard', async () => {
    await loginAs(page, process.env.E2E_ADMIN_EMAIL ?? 'admin@example.com',
                  process.env.E2E_ADMIN_PASSWORD ?? 'password123');
    await page.goto(`${baseURL}/admin`);
    await page.waitForSelector('h1:has-text("Admin Dashboard")', { state: 'visible', timeout: 10000 });
  });
});

