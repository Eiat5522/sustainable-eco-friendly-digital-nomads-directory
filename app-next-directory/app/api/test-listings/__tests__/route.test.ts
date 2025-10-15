import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { GET } from '../route';

const mockCreateTestData = jest.fn();

jest.mock('@/tests/helpers/test-data', () => ({
  createTestData: mockCreateTestData,
}));

describe('/api/test-listings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.NODE_ENV;
  });

  it('returns 404 in production environment', async () => {
    process.env.NODE_ENV = 'production';
    
    const response = await GET();

    expect(response.status).toBe(404);
  });

  it('returns test listings in non-production', async () => {
    process.env.NODE_ENV = 'development';
    
    const mockListings = [
      { id: '1', name: 'Test Listing 1' },
      { id: '2', name: 'Test Listing 2' },
    ];
    
    mockCreateTestData.mockReturnValue({ listings: mockListings } as any);
    
    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.listings).toEqual(mockListings);
    expect(mockCreateTestData).toHaveBeenCalledTimes(1);
  });
});
