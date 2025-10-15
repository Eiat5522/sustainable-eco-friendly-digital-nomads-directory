import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { GET } from '../route';
import { createTestData } from '@/tests/helpers/test-data';

jest.mock('@/tests/helpers/test-data', () => ({
  createTestData: jest.fn(),
}));

describe('/api/test-listings', () => {
  let mockedCreateTestData: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockedCreateTestData = createTestData as jest.Mock;
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
    
    mockedCreateTestData.mockReturnValue({ listings: mockListings } as any);
    
    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.listings).toEqual(mockListings);
    expect(mockedCreateTestData).toHaveBeenCalledTimes(1);
  });
});
