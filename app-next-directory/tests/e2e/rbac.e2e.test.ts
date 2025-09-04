/// <reference types="jest-playwright-preset" />
import { loginAs } from './helpers/auth';

describe('RBAC (Jest + jest-playwright)', () => {
  it('regular user cannot access admin', async () => {
    await loginAs(process.env.E2E_USER_EMAIL ?? 'user@example.com',
                  process.env.E2E_USER_PASSWORD ?? 'password123');
    await page.goto('/admin');
    await page.waitForSelector('text=Access denied', { state: 'visible', timeout: 10000 });
  });

  it('admin sees admin dashboard', async () => {
    await loginAs(process.env.E2E_ADMIN_EMAIL ?? 'admin@example.com',
                  process.env.E2E_ADMIN_PASSWORD ?? 'password123');
    await page.goto('/admin');
    await page.waitForSelector('h1:has-text("Admin Dashboard")', { state: 'visible', timeout: 10000 });
  });
});
