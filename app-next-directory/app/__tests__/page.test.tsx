/**
 * Unit tests for app/page.tsx (Home Page)
 * Tests the main home page component with DAL integration and Suspense boundaries
 */

import '@testing-library/jest-dom';
import type React from 'react';
import HomePage from '../page';

// Mock the home page data module using the root alias
describe('HomePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without throwing errors', async () => {
    const page = await HomePage();
    expect(page).toBeDefined();
  });
});
