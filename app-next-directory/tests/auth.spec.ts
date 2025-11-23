import { expect, test } from '@playwright/test';

test.describe('Authentication System', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the home page before each test
    await page.goto('/');
  });

  test.describe('User Registration', () => {
    test('should successfully register a new user', async ({ page }) => {
      // Navigate to registration page
      await page.goto('/register');

      // Fill out the registration form
      await page.fill('input[name="name"]', 'Test User');
      await page.fill('input[name="email"]', `test+${Date.now()}@example.com`);
      await page.fill('input[name="password"]', 'password123');

      // Submit the form
      await page.click('button[type="submit"]');

      // Check for success message or redirect
      await expect(page).toHaveURL('/login');
      await expect(page.locator('text=Registration successful')).toBeVisible();
    });

    test('should show validation errors for invalid data', async ({ page }) => {
      await page.goto('/register');

      // Try to submit with empty fields
      await page.click('button[type="submit"]');

      // Check for validation error messages
      await expect(page.locator('text=Name is required')).toBeVisible();
      await expect(page.locator('text=Email is required')).toBeVisible();
      await expect(page.locator('text=Password is required')).toBeVisible();
    });

    test('should show error for existing user email', async ({ page }) => {
      await page.goto('/register');

      // Fill form with existing user email
      await page.fill('input[name="name"]', 'Test User');
      await page.fill('input[name="email"]', 'existing@example.com');
      await page.fill('input[name="password"]', 'password123');

      await page.click('button[type="submit"]');

      // Check for error message
      await expect(page.locator('text=User already exists')).toBeVisible();
    });

    test('should validate email format', async ({ page }) => {
      await page.goto('/register');

      await page.fill('input[name="name"]', 'Test User');
      await page.fill('input[name="email"]', 'invalid-email');
      await page.fill('input[name="password"]', 'password123');

      await page.click('button[type="submit"]');

      await expect(page.locator('text=Invalid email format')).toBeVisible();
    });

    test('should validate password requirements', async ({ page }) => {
      await page.goto('/register');

      await page.fill('input[name="name"]', 'Test User');
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', '123'); // Too short

      await page.click('button[type="submit"]');

      await expect(page.locator('text=Password must be at least 6 characters')).toBeVisible();
    });
  });

  test.describe('User Login', () => {
    test('should successfully login with valid credentials', async ({ page }) => {
      await page.goto('/login');

      // Fill login form
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'password123');

      await page.click('button[type="submit"]');

      // Should redirect to dashboard or home after login
      await expect(page).toHaveURL('/');

      // Check if user is logged in (look for logout button or user menu)
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto('/login');

      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'wrongpassword');

      await page.click('button[type="submit"]');

      await expect(page.locator('text=Invalid credentials')).toBeVisible();
    });

    test('should show validation errors for empty fields', async ({ page }) => {
      await page.goto('/login');

      await page.click('button[type="submit"]');

      await expect(page.locator('text=Email is required')).toBeVisible();
      await expect(page.locator('text=Password is required')).toBeVisible();
    });

    test('should redirect to login page when accessing protected routes', async ({ page }) => {
      // Try to access a protected route without being logged in
      await page.goto('/dashboard');

      // Should redirect to login
      await expect(page).toHaveURL('/login');
    });
  });

  test.describe('Session Management', () => {
    test('should maintain session across page refreshes', async ({ page }) => {
      // First login
      await page.goto('/login');
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');

      // Verify logged in
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();

      // Refresh the page
      await page.reload();

      // Should still be logged in
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    });

    test('should logout successfully', async ({ page }) => {
      // Login first
      await page.goto('/login');
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');

      // Click logout
      await page.click('[data-testid="user-menu"]');
      await page.click('text=Logout');

      // Should redirect to home and show login button
      await expect(page.locator('text=Login')).toBeVisible();
      await expect(page.locator('[data-testid="user-menu"]')).not.toBeVisible();
    });
  });

  test.describe('Role-Based Access Control', () => {
    test('should restrict admin routes to admin users only', async ({ page }) => {
      // Login as regular user
      await page.goto('/login');
      await page.fill('input[name="email"]', 'user@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');

      // Try to access admin route
      await page.goto('/admin');

      // Should be redirected or show access denied
      await expect(page.locator('text=Access denied')).toBeVisible();
    });

    test('should allow admin users to access admin routes', async ({ page }) => {
      // Login as admin user
      await page.goto('/login');
      await page.fill('input[name="email"]', 'admin@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');

      // Access admin route
      await page.goto('/admin');

      // Should show admin dashboard
      await expect(page.locator('h1:has-text("Admin Dashboard")')).toBeVisible();
    });

    test('should show different UI elements based on user role', async ({ page }) => {
      // Login as venue owner
      await page.goto('/login');
      await page.fill('input[name="email"]', 'venueowner@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');

      // Should see venue management options
      await expect(page.locator('text=Manage Listings')).toBeVisible();

      // Should not see admin options
      await expect(page.locator('text=User Management')).not.toBeVisible();
    });
  });

  test.describe('Navigation and UI', () => {
    test('should show correct navigation for unauthenticated users', async ({ page }) => {
      await page.goto('/');

      await expect(page.locator('text=Login')).toBeVisible();
      await expect(page.locator('text=Register')).toBeVisible();
      await expect(page.locator('[data-testid="user-menu"]')).not.toBeVisible();
    });

    test('should show correct navigation for authenticated users', async ({ page }) => {
      // Login first
      await page.goto('/login');
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');

      await page.goto('/');

      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
      await expect(page.locator('text=Login')).not.toBeVisible();
      await expect(page.locator('text=Register')).not.toBeVisible();
    });

    test('should navigate between register and login pages', async ({ page }) => {
      await page.goto('/register');

      // Click login link
      await page.click('text=Already have an account? Login');
      await expect(page).toHaveURL('/login');

      // Click register link
      await page.click('text=Don\'t have an account? Register');
      await expect(page).toHaveURL('/register');
    });
  });

  test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      // Intercept network requests and make them fail
      await page.route('**/api/auth/**', route => route.abort());

      await page.goto('/login');
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');

      // Should show network error message
      await expect(page.locator('text=Network error')).toBeVisible();
    });

    test('should handle server errors gracefully', async ({ page }) => {
      // Intercept and return server error
      await page.route('**/api/auth/register', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Internal server error' })
        });
      });

      await page.goto('/register');
      await page.fill('input[name="name"]', 'Test User');
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');

      await expect(page.locator('text=Internal server error')).toBeVisible();
    });
  });
});
