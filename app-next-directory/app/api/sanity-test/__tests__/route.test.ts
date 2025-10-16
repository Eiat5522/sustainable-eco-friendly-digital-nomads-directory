import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { GET } from '../route';
import { client } from '@/lib/sanity/client';

jest.mock('@/lib/sanity/client', () => ({
  client: {
    fetch: jest.fn(),
  },
}));

describe('/api/sanity-test', () => {
  let mockedFetch: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockedFetch = client.fetch as jest.Mock;
    delete process.env.NODE_ENV;
  });

  it('returns 404 in production environment', async () => {
    process.env.NODE_ENV = 'production';
    
    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.error).toBe('Not found');
    expect(mockedFetch).not.toHaveBeenCalled();
  });

  it('tests Sanity connection successfully in non-production', async () => {
    process.env.NODE_ENV = 'development';
    process.env.NEXT_PUBLIC_SANITY_PROJECT_ID = 'test-project';
    process.env.NEXT_PUBLIC_SANITY_DATASET = 'test-dataset';
    
    const mockResult = [{ _id: 'test-1', title: 'Test Listing' }];
    mockedFetch.mockResolvedValue(mockResult);
    
    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data.message).toBe('Sanity connection successful');
    expect(json.data.config).toEqual({
      projectId: 'test-project',
      dataset: 'test-dataset',
    });
    expect(json.data.testResult).toEqual(mockResult);
    expect(mockedFetch).toHaveBeenCalledTimes(1);
  });

  it('handles Sanity connection errors', async () => {
    process.env.NODE_ENV = 'development';
    mockedFetch.mockRejectedValue(new Error('Connection failed'));
    
    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe('Sanity connection failed');
  });
});
