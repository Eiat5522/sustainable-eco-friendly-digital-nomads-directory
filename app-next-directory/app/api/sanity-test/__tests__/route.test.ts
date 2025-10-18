import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

const mockedFetch = jest.fn();
jest.mock('@/lib/sanity/client', () => ({ client: { fetch: (...args: any[]) => mockedFetch(...args) } }));

let GET: any;
let routeTestControl: any;
const originalEnv = { ...process.env };

describe('/api/sanity-test', () => {
  beforeEach(async () => {
    jest.resetModules();
    mockedFetch.mockReset();
    // require after mocks
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    ({ GET, testControl: routeTestControl } = require('../route'));
    routeTestControl.clientFetchOverride = undefined;
    routeTestControl.nodeEnvOverride = undefined;
    delete process.env.NODE_ENV;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    if (routeTestControl) {
      routeTestControl.clientFetchOverride = undefined;
      routeTestControl.nodeEnvOverride = undefined;
    }
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
