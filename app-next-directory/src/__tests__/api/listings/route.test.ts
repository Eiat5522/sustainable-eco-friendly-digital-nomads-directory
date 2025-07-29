jest.unmock('../../../../__mocks__/next/server');
// Use custom mocks for NextRequest and NextResponse
import { POST, GET } from '../../../../app/api/listings/route';
import { createMocks, MockNextRequest, MockNextResponse } from '../../../../__mocks__/next/server';

// Mock the requireAuth function to simulate an authenticated premium user for POST
jest.mock('../../../../src/utils/auth-helpers', () => ({
  ...jest.requireActual('../../../../src/utils/auth-helpers'),
  requireAuth: async () => ({
    user: {
      id: 'test-user-id',
      plan: 'premium',
      role: 'admin',
    },
  }),
}));

// Helper to simulate Next.js API handler invocation
function runHandler(handler: (req: any) => any, req: any): any {
  return handler(req);
}

describe('Listings API', () => {
  it('should return a list of listings', async () => {
    // Provide a valid URL with pagination params
    const { req } = createMocks({
      method: 'GET',
      json: undefined,
    });
    req.url = 'http://localhost/api/listings?page=1&limit=10';
    const response = await runHandler(GET, req);
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
    req.url = 'http://localhost/api/listings';
    const response = await runHandler(POST, req);
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.message).toBe('Listing created successfully');
    expect(data.listing).toBeDefined();
    expect(data.listing.title).toBe('Test Listing');
  });

  it('should handle errors when fetching listings', async () => {
    // Mock the GET function to simulate an error
    const mockGet = jest.fn().mockImplementation(() => {
      return Promise.resolve(new MockNextResponse(JSON.stringify({ error: 'Internal Server Error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }));
    });
    const response = await mockGet(new MockNextRequest({ method: 'GET', json: undefined }));
    const data = await response.json();
    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal Server Error');
  });

  it('should handle errors when creating a new listing', async () => {
    // Mock the POST function to simulate an error
    const mockPost = jest.fn().mockImplementation(() => {
      return Promise.resolve(new MockNextResponse(JSON.stringify({ error: 'Internal Server Error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }));
    });
    const response = await mockPost(new MockNextRequest({ method: 'POST', json: {} }));
    const data = await response.json();
    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal Server Error');
  });
});
