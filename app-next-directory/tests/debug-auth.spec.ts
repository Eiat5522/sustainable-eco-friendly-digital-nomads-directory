import { test, expect } from './fixtures';

test.describe('Debug Authentication', () => {
  test('debug admin fixture', async ({ adminPage }) => {
    console.log('Admin page fixture is working');
    
    // Try to navigate to the home page first
    await adminPage.goto('/');
    
    // Check if the page loads
    const title = await adminPage.title();
    console.log('Page title:', title);
    
    // Check if we can see any content
    const body = await adminPage.locator('body').first();
    const bodyText = await body.textContent();
    console.log('Body contains text:', bodyText ? 'Yes' : 'No');
    
    // Simple assertion
    expect(title).toBeTruthy();
  });

  test('debug venue owner fixture', async ({ venueOwnerPage }) => {
    console.log('Venue owner page fixture is working');
    
    await venueOwnerPage.goto('/');
    const title = await venueOwnerPage.title();
    console.log('Page title:', title);
    
    expect(title).toBeTruthy();
  });
});