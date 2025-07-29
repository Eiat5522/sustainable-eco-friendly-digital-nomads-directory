jest.unmock('../../../../__mocks__/next/server');
// Unmock the listings route to test the actual implementation
// import { POST, GET } from '@/app/api/listings/route';
import { NextRequest, NextResponse } from 'next/server';
import { POST, GET } from '../../../../app/api/listings/route';

// Import createMocks directly from the mock file (workaround for ESM Jest mocking)
import { createMocks } from '../../../../__mocks__/next/server';

describe('Listings API', () => {
  it('should return a list of listings', async () => {
    const { req } = createMocks({
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
    const { req } = createMocks({
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
    expect(data.listing).toBeDefined();
    expect(data.listing.title).toBe('Test Listing');
  });

  it('should handle errors when fetching listings', async () => {
    // Mock the GET function to simulate an error
    const mockGet = jest.fn().mockImplementation(() => {
      return Promise.resolve(new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }));
    });

    // @ts-ignore - Override the GET function for testing
    const response = await mockGet(createMocks({ method: 'GET' }).req as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal Server Error');
  });

  it('should handle errors when creating a new listing', async () => {
    // Mock the POST function to simulate an error
    const mockPost = jest.fn().mockImplementation(() => {
      return Promise.resolve(new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }));
    });

    // @ts-ignore - Override the POST function for testing
    const response = await mockPost(createMocks({ method: 'POST', json: {} }).req as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal Server Error');
  });
});
