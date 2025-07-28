

// Unmock the listings route to test the actual implementation
jest.unmock('@/app/api/listings/route');

import { NextRequest, NextResponse } from 'next/server';
import { POST, GET } from '@/app/api/listings/route';

// Import createMocks from the mock file
const { createMocks } = require('../../../__mocks__/next/server');

describe('Listings API', () => {
  it('should return a list of listings', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      json: undefined, // Explicitly provide json even for GET requests
    });

    const response = await GET(req as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.listings).toBeDefined();
    expect(Array.isArray(data.listings)).toBe(true);
  });

  it('should create a new listing', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      json: {
        title: 'Test Listing',
        slug: 'test-listing',
        category: 'coworking',
        description: 'A detailed description for the test listing that meets the minimum 10 character requirement.',
        location: 'Bangkok, Thailand',
        ecoTags: ['eco-friendly'],
        digitalNomadFeatures: ['fast-wifi'],
        priceRange: 'budget',
        website: 'https://test.com',
        contactPhone: '123-456-7890',
        contactEmail: 'test@example.com',
      },
    });

    const response = await POST(req as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe('Listing created successfully');
    expect(data.listing || data).toBeDefined();
    expect((data.listing || data).title).toBe('Test Listing');
  });
});