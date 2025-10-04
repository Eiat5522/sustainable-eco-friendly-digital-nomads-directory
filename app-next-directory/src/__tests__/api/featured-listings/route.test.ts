/**
 * Jest Test Suite for Featured Listings API Route  
 * Basic test to ensure the route is functional
 */

import { jest } from '@jest/globals';
import { GET } from '@/app/api/featured-listings/route';

describe('Featured Listings API - GET /api/featured-listings', () => {
  it('should successfully call the GET endpoint', async () => {
    const mockRequest = {} as Request;
    const response = await GET(mockRequest);
    
    // Should return a response
    expect(response).toBeDefined();
    expect(typeof response.json).toBe('function');
  });

  it('should handle requests without errors', async () => {
    const mockRequest = {} as Request;
    
    await expect(GET(mockRequest)).resolves.not.toThrow();
  });
});

// Test Coverage Note:
// This minimal test suite ensures basic functionality of the featured listings route.
// Detailed query validation and data transformation are covered by E2E Playwright tests.
// The route uses existing Sanity client mocks from __mocks__/@sanity/client.ts
