import { expect, test } from '@playwright/test';
import { CustomAssertions } from '../utils/test-utils';

test.describe('ContactForm Component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/contact');
  });

  // Basic Validation Tests
  test('validates required fields', async ({ page }) => {
    // Try to submit empty form
    await page.click('button[type="submit"]');

    // Check validation errors
    await CustomAssertions.assertFormError(page, 'name', 'Name is required');
    await CustomAssertions.assertFormError(page, 'email', 'Email is required');
    await CustomAssertions.assertFormError(page, 'message', 'Message is required');
  });

  // Email Format Tests
  test('validates email format', async ({ page }) => {
    // Fill invalid email
    await page.fill('input[name="email"]', 'invalid-email');
    await page.click('button[type="submit"]');

    // Check validation error
    await CustomAssertions.assertFormError(page, 'email', 'Invalid email address');
  });

  test('accepts valid but uncommon email formats', async ({ page }) => {
    const validEmails = [
      'user+tag@example.com',
      'user.name@sub.example.co.uk',
      'user@host.museum',
      '123@domain.com',
      'very.common@example.com',
    ];

    for (const email of validEmails) {
      // Fill form with valid data
      await page.fill('input[name="name"]', 'Test User');
      await page.fill('input[name="email"]', email);
      await page.fill('textarea[name="message"]', 'Test message');
      await page.click('button[type="submit"]');

      // Should not show email validation error
      const emailError = page.locator('[data-testid="error-email"]');
      await expect(emailError).not.toBeVisible();

      // Clear form for next test
      await page.reload();
    }
  });

  // Length Validation Tests
  test('validates input length constraints', async ({ page }) => {
    // Test over-long name (assuming max length is 100)
    const longName = 'A'.repeat(101);
    await page.fill('input[name="name"]', longName);
    await page.click('button[type="submit"]');
    await CustomAssertions.assertFormError(page, 'name', 'Name must be less than 100 characters');

    // Test over-long message (assuming max length is 1000)
    const longMessage = 'A'.repeat(1001);
    await page.fill('textarea[name="message"]', longMessage);
    await page.click('button[type="submit"]');
    await CustomAssertions.assertFormError(
      page,
      'message',
      'Message must be less than 1000 characters'
    );
  });

  // Whitespace Tests
  test('rejects whitespace-only inputs', async ({ page }) => {
    // Fill form with whitespace
    await page.fill('input[name="name"]', '   ');
    await page.fill('input[name="email"]', 'valid@example.com');
    await page.fill('textarea[name="message"]', '     ');
    await page.click('button[type="submit"]');

    await CustomAssertions.assertFormError(page, 'name', 'Name cannot be empty');
    await CustomAssertions.assertFormError(page, 'message', 'Message cannot be empty');
  });

  // Error Clearing Tests
  test('clears errors when input is corrected', async ({ page }) => {
    // Submit with invalid data
    await page.fill('input[name="name"]', '');
    await page.fill('input[name="email"]', 'invalid-email');
    await page.click('button[type="submit"]');

    // Verify errors are shown
    await CustomAssertions.assertFormError(page, 'name', 'Name is required');
    await CustomAssertions.assertFormError(page, 'email', 'Invalid email address');

    // Correct the inputs
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', 'valid@example.com');

    // Verify errors are cleared
    const nameError = page.locator('[data-testid="error-name"]');
    const emailError = page.locator('[data-testid="error-email"]');
    await expect(nameError).not.toBeVisible();
    await expect(emailError).not.toBeVisible();
  });

  // Network Error Tests
  test('handles network failures gracefully', async ({ page }) => {
    // Mock failed submission
    await page.route('/api/contact', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' }),
      });
    });

    // Fill and submit form
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('textarea[name="message"]', 'Test message');
    await page.click('button[type="submit"]');

    // Check error banner
    await expect(page.locator('[data-testid="error-banner"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-banner"]')).toContainText(
      'Failed to send message'
    );
  });

  // Button State Tests
  test('submit button state changes during submission', async ({ page }) => {
    // Add delay to submission to test loading state
    await page.route('/api/contact', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.fulfill({ status: 200 });
    });

    // Fill form
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('textarea[name="message"]', 'Test message');

    // Submit and check button state
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // Button should be disabled and show loading state
    await expect(submitButton).toBeDisabled();
    await expect(submitButton).toHaveText('Sending...');

    // Wait for submission to complete
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();

    // Button should return to normal state
    await expect(submitButton).toBeEnabled();
    await expect(submitButton).toHaveText('Send Message');
  });

  // Special Characters Test
  test('handles special characters in input correctly', async ({ page }) => {
    const specialChars = {
      name: 'Test "<>&\' User',
      message: '!@#$%^&*()_+\n\tSpecial chars test',
    };

    await page.fill('input[name="name"]', specialChars.name);
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('textarea[name="message"]', specialChars.message);
    await page.click('button[type="submit"]');

    // Should not show validation errors
    await expect(page.locator('[data-testid="error-name"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).not.toBeVisible();
  });

  // Multiple Rapid Submissions Test
  test('prevents multiple rapid submissions', async ({ page }) => {
    // Fill form with valid data
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('textarea[name="message"]', 'Test message');

    // Attempt multiple rapid clicks
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();
    await submitButton.click();
    await submitButton.click();

    // Should be disabled after first click
    await expect(submitButton).toBeDisabled();

    // Only one request should be made
    let requestCount = 0;
    page.on('request', request => {
      if (request.url().includes('/api/contact')) {
        requestCount++;
      }
    });
    expect(requestCount).toBeLessThanOrEqual(1);
  });

  // Form Reset After Submission Test
  test('resets form after successful submission', async ({ page }) => {
    // Fill and submit form
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('textarea[name="message"]', 'Test message');
    await page.click('button[type="submit"]');

    // Wait for success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();

    // Verify form is reset
    await expect(page.locator('input[name="name"]')).toHaveValue('');
    await expect(page.locator('input[name="email"]')).toHaveValue('');
    await expect(page.locator('textarea[name="message"]')).toHaveValue('');
  });
});
