

import { NextRequest, NextResponse } from 'next/server';
import { POST, GET } from '@/app/api/listings/route';
import { createMocks } from 'D:/Eiat_Folder/MyProjects/MyOtherProjects/sustainable-eco-friendly-digital-nomads-directory/app-next-directory/__mocks__/next/server.js';

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
        name: 'Test Listing',
        slug: 'test-listing',
        category: 'coworking',
        shortDescription: 'A short description',
        longDescription: 'A long description for the test listing.',
        primaryImage: { asset: { _ref: 'image-test' } },
        city: { _ref: 'city-test' },
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
    expect(data.listing).toBeDefined();
    expect(data.listing.name).toBe('Test Listing');
  });
});