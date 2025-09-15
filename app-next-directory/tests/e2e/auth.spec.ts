import { test, expect } from '@playwright/test';

test.describe('Authentication Pages', () => {
  test.describe('Login Page', () => {
    test('renders login page with all required elements', async ({ page }) => {
      await page.goto('/auth/login');
      
      // Check page elements
      await expect(page.getByRole('heading', { name: /log in/i })).toBeVisible();
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/password/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /login/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /create an account/i })).toBeVisible();
    });

    test('shows validation errors for empty form submission', async ({ page }) => {
      await page.goto('/auth/login');
      
      // Try to submit empty form
      await page.getByRole('button', { name: /login/i }).click();
      
      // Check for validation errors
      await expect(page.getByText(/enter a valid email address/i)).toBeVisible();
      await expect(page.getByText(/enter your password/i)).toBeVisible();
    });

    test('shows validation errors for invalid email', async ({ page }) => {
      await page.goto('/auth/login');
      
      await page.getByLabel(/email/i).fill('invalid-email');
      await page.getByLabel(/password/i).fill('short');
      await page.getByRole('button', { name: /login/i }).click();
      
      await expect(page.getByText(/enter a valid email address/i)).toBeVisible();
      await expect(page.getByText(/enter your password/i)).toBeVisible();
    });

    test('preserves callbackUrl in signup link', async ({ page }) => {
      const callbackUrl = '/dashboard';
      await page.goto(`/auth/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
      
      const signupLink = page.getByRole('link', { name: /create an account/i });
      await expect(signupLink).toHaveAttribute('href', expect.stringContaining(encodeURIComponent(callbackUrl)));
    });

    test('handles authentication error from query parameters', async ({ page }) => {
      await page.goto('/auth/login?error=CredentialsSignin');
      
      await expect(page.getByRole('alert')).toContainText(/invalid email or password/i);
    });
  });

  test.describe('Signup Page', () => {
    test('renders signup page with all required elements', async ({ page }) => {
      await page.goto('/auth/signup');
      
      // Check page elements
      await expect(page.getByRole('heading', { name: /sign up/i })).toBeVisible();
      await expect(page.getByLabel(/full name/i)).toBeVisible();
      await expect(page.getByLabel(/^email/i)).toBeVisible();
      await expect(page.getByLabel(/^password/i)).toBeVisible();
      await expect(page.getByLabel(/confirm password/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /sign up/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible();
    });

    test('shows validation errors for empty form submission', async ({ page }) => {
      await page.goto('/auth/signup');
      
      // Try to submit empty form
      await page.getByRole('button', { name: /sign up/i }).click();
      
      // Check for validation errors
      await expect(page.getByText(/name is required/i)).toBeVisible();
      await expect(page.getByText(/email is required/i)).toBeVisible();
      await expect(page.getByText(/password is required/i)).toBeVisible();
      await expect(page.getByText(/password confirmation is required/i)).toBeVisible();
    });

    test('shows validation error for invalid email format', async ({ page }) => {
      await page.goto('/auth/signup');
      
      await page.getByLabel(/full name/i).fill('Test User');
      await page.getByLabel(/^email/i).fill('invalid-email');
      await page.getByLabel(/^password/i).fill('password123');
      await page.getByLabel(/confirm password/i).fill('password123');
      await page.getByRole('button', { name: /sign up/i }).click();
      
      await expect(page.getByText(/enter a valid email address/i)).toBeVisible();
    });

    test('shows validation error for short password', async ({ page }) => {
      await page.goto('/auth/signup');
      
      await page.getByLabel(/full name/i).fill('Test User');
      await page.getByLabel(/^email/i).fill('test@example.com');
      await page.getByLabel(/^password/i).fill('short');
      await page.getByLabel(/confirm password/i).fill('short');
      await page.getByRole('button', { name: /sign up/i }).click();
      
      await expect(page.getByText(/password must be at least 8 characters/i)).toBeVisible();
    });

    test('shows validation error for password mismatch', async ({ page }) => {
      await page.goto('/auth/signup');
      
      await page.getByLabel(/full name/i).fill('Test User');
      await page.getByLabel(/^email/i).fill('test@example.com');
      await page.getByLabel(/^password/i).fill('password123');
      await page.getByLabel(/confirm password/i).fill('different123');
      await page.getByRole('button', { name: /sign up/i }).click();
      
      await expect(page.getByText(/passwords do not match/i)).toBeVisible();
    });

    test('preserves callbackUrl in login link', async ({ page }) => {
      const callbackUrl = '/dashboard';
      await page.goto(`/auth/signup?callbackUrl=${encodeURIComponent(callbackUrl)}`);
      
      const loginLink = page.getByRole('link', { name: /sign in/i });
      await expect(loginLink).toHaveAttribute('href', expect.stringContaining(encodeURIComponent(callbackUrl)));
    });
  });

  test.describe('CallbackUrl Handling', () => {
    test('login page accepts and preserves callbackUrl parameter', async ({ page }) => {
      const callbackUrl = '/protected-page';
      await page.goto(`/auth/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
      
      // Check that the page loads without error
      await expect(page.getByRole('heading', { name: /log in/i })).toBeVisible();
      
      // Check that the URL parameter is preserved
      expect(page.url()).toContain(`callbackUrl=${encodeURIComponent(callbackUrl)}`);
    });

    test('signup page accepts and preserves callbackUrl parameter', async ({ page }) => {
      const callbackUrl = '/protected-page';
      await page.goto(`/auth/signup?callbackUrl=${encodeURIComponent(callbackUrl)}`);
      
      // Check that the page loads without error
      await expect(page.getByRole('heading', { name: /sign up/i })).toBeVisible();
      
      // Check that the URL parameter is preserved
      expect(page.url()).toContain(`callbackUrl=${encodeURIComponent(callbackUrl)}`);
    });
  });

  test.describe('Accessibility', () => {
    test('login form has proper accessibility attributes', async ({ page }) => {
      await page.goto('/auth/login');
      
      const emailInput = page.getByLabel(/email/i);
      const passwordInput = page.getByLabel(/password/i);
      
      // Check aria-labels
      await expect(emailInput).toHaveAttribute('aria-label', 'Email');
      await expect(passwordInput).toHaveAttribute('aria-label', 'Password');
      
      // Check required attributes
      await expect(emailInput).toHaveAttribute('required');
      await expect(passwordInput).toHaveAttribute('required');
      
      // Check autocomplete attributes
      await expect(emailInput).toHaveAttribute('autocomplete', 'email');
      await expect(passwordInput).toHaveAttribute('autocomplete', 'current-password');
    });

    test('signup form has proper accessibility attributes', async ({ page }) => {
      await page.goto('/auth/signup');
      
      const nameInput = page.getByLabel(/full name/i);
      const emailInput = page.getByLabel(/^email/i);
      const passwordInput = page.getByLabel(/^password/i);
      const confirmPasswordInput = page.getByLabel(/confirm password/i);
      
      // Check aria-labels
      await expect(nameInput).toHaveAttribute('aria-label', 'Full Name');
      await expect(emailInput).toHaveAttribute('aria-label', 'Email');
      await expect(passwordInput).toHaveAttribute('aria-label', 'Password');
      await expect(confirmPasswordInput).toHaveAttribute('aria-label', 'Confirm Password');
      
      // Check required attributes
      await expect(nameInput).toHaveAttribute('required');
      await expect(emailInput).toHaveAttribute('required');
      await expect(passwordInput).toHaveAttribute('required');
      await expect(confirmPasswordInput).toHaveAttribute('required');
    });

    test('error messages have proper aria attributes', async ({ page }) => {
      await page.goto('/auth/login');
      
      // Trigger validation errors
      await page.getByRole('button', { name: /login/i }).click();
      
      // Check that error messages have proper roles
      const errorMessages = page.getByText(/enter a valid email address|enter your password/i);
      for (const errorMessage of await errorMessages.all()) {
        await expect(errorMessage).toHaveAttribute('aria-live', 'polite');
      }
    });
  });
});
