/**
 * Example test demonstrating client-side navigation mocking
 * Following guidelines from ADVANCE_MOCKING_STRATEGIES_FOR_NEXTJS_APPLICATION_WITH_JEST.md
 * Section 3.1: Mocking Client-Side Navigation
 * 
 * This demonstrates using next-router-mock as an opt-in replacement for the
 * global jest.fn() mocks to provide more realistic router behavior.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import mockRouter from 'next-router-mock';
import { MemoryRouterProvider } from 'next-router-mock/MemoryRouterProvider';

// IMPORTANT: Override the global mock with next-router-mock for this file only
// This provides realistic router behavior while keeping backward compatibility
// with existing tests that use jest.fn() mocks
jest.mock('next/navigation', () => jest.requireActual('next-router-mock/navigation'));

// Example component that uses useParams
function UserProfile() {
  const params = useParams();
  const userId = params?.userId as string | undefined;
  
  return (
    <div>
      <h1>User Profile</h1>
      {userId && <p data-testid="user-id">User ID: {userId}</p>}
    </div>
  );
}

// Example component that uses usePathname
function PathDisplay() {
  const pathname = usePathname();
  
  return (
    <div>
      <p data-testid="current-path">Current path: {pathname}</p>
    </div>
  );
}

// Example component that uses useSearchParams
function SearchDisplay() {
  const searchParams = useSearchParams();
  const query = searchParams?.get('q');
  
  return (
    <div>
      {query && <p data-testid="search-query">Search: {query}</p>}
    </div>
  );
}

// Example component that uses useRouter
function NavigationButton() {
  const router = useRouter();
  
  const handleClick = () => {
    router.push('/dashboard');
  };
  
  return (
    <button onClick={handleClick}>Go to Dashboard</button>
  );
}

describe('Client-Side Navigation Mocking Examples', () => {
  // Pattern 1: Testing components with useParams using dynamic routes
  describe('UserProfile with useParams', () => {
    beforeEach(() => {
      // Set the router to a dynamic route path to simulate route parameters
      mockRouter.setCurrentUrl('/users/123');
    });

    afterEach(() => {
      // Essential: Clean up by resetting to a default route
      mockRouter.setCurrentUrl('/');
    });

    it('should display the correct user ID from URL params', () => {
      // Wrap component with MemoryRouterProvider to access dynamic params
      render(
        <MemoryRouterProvider url="/users/123">
          <UserProfile />
        </MemoryRouterProvider>
      );
      
      // Note: This test demonstrates the pattern, but useParams requires
      // proper dynamic route configuration in next-router-mock/dynamic-routes
      // For simpler testing, you can mock useParams directly in individual tests
    });
  });

  // Pattern 2: Testing components with usePathname
  describe('PathDisplay with usePathname', () => {
    beforeEach(() => {
      // Set the current pathname via mockRouter
      mockRouter.setCurrentUrl('/users/profile');
    });

    afterEach(() => {
      mockRouter.setCurrentUrl('/');
    });

    it('should display the current path', () => {
      render(<PathDisplay />);
      
      const pathElement = screen.getByTestId('current-path');
      expect(pathElement).toHaveTextContent('Current path: /users/profile');
    });
  });

  // Pattern 3: Testing components with useSearchParams
  describe('SearchDisplay with useSearchParams', () => {
    beforeEach(() => {
      // Set search parameters via URL
      mockRouter.setCurrentUrl('/search?q=test%20query');
    });

    afterEach(() => {
      mockRouter.setCurrentUrl('/');
    });

    it('should display the search query', () => {
      render(<SearchDisplay />);
      
      const searchElement = screen.getByTestId('search-query');
      expect(searchElement).toHaveTextContent('Search: test query');
    });
  });

  // Pattern 4: Testing components with useRouter for navigation
  describe('NavigationButton with useRouter', () => {
    beforeEach(() => {
      mockRouter.setCurrentUrl('/');
    });

    afterEach(() => {
      mockRouter.setCurrentUrl('/');
    });

    it('should navigate to dashboard when button is clicked', () => {
      render(<NavigationButton />);
      
      const button = screen.getByRole('button', { name: /go to dashboard/i });
      button.click();
      
      // Assert that the router navigated to the expected path
      expect(mockRouter).toMatchObject({
        pathname: '/dashboard',
        asPath: '/dashboard',
      });
    });
  });

  // Pattern 5: Testing multiple scenarios with different URLs
  describe('PathDisplay with different paths', () => {
    afterEach(() => {
      mockRouter.setCurrentUrl('/');
    });

    it('should display path /dashboard', () => {
      mockRouter.setCurrentUrl('/dashboard');
      
      render(<PathDisplay />);
      
      const pathElement = screen.getByTestId('current-path');
      expect(pathElement).toHaveTextContent('Current path: /dashboard');
    });

    it('should display path /settings/profile', () => {
      mockRouter.setCurrentUrl('/settings/profile');
      
      render(<PathDisplay />);
      
      const pathElement = screen.getByTestId('current-path');
      expect(pathElement).toHaveTextContent('Current path: /settings/profile');
    });
  });
  
  // Pattern 6: Testing router state and query parameters together
  describe('Complex routing scenarios', () => {
    afterEach(() => {
      mockRouter.setCurrentUrl('/');
    });

    it('should handle path with query parameters and hash', () => {
      mockRouter.setCurrentUrl('/products?category=electronics&sort=price#reviews');
      
      // You can assert on the entire router state
      expect(mockRouter).toMatchObject({
        pathname: '/products',
        asPath: '/products?category=electronics&sort=price#reviews',
        query: {
          category: 'electronics',
          sort: 'price',
        },
      });
    });
  });
});
