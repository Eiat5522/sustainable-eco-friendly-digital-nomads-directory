import { test, expect } from '@playwright/test';

test.describe('Authentication Debug', () => {
  test('should load login page and have form elements', async ({ page }) => {
    // Go to login page
    await page.goto('/login');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    console.log('Page URL:', page.url());
    console.log('Page title:', await page.title());
    
    // Check if form elements exist
    const emailInput = page.locator('#email');
    const passwordInput = page.locator('#password');
    const submitButton = page.locator('button[type="submit"]');
    
    console.log('Email input exists:', await emailInput.count() > 0);
    console.log('Password input exists:', await passwordInput.count() > 0);
    console.log('Submit button exists:', await submitButton.count() > 0);
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'test-results/login-page-debug.png' });
    
    // Expect form elements to be present
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toBeVisible();
  });

  test('should be able to create a user via API', async ({ request }) => {
    const response = await request.post('/api/auth/register', {
      data: {
        name: 'Debug Test User',
        email: 'debug@example.com',
        password: 'password123'
      }
    });
    
    const responseBody = await response.json();
    console.log('Registration response status:', response.status());
    console.log('Registration response body:', responseBody);
    
    // Expect successful creation or user already exists
    expect([201, 409]).toContain(response.status());
  });

  test('should be able to navigate to NextAuth endpoints', async ({ page }) => {
    // Test NextAuth provider page
    await page.goto('/api/auth/providers');
    
    const content = await page.textContent('body');
    console.log('Auth providers response:', content);
    
    // Should return JSON with providers
    expect(content).toBeTruthy();
  });
});