import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { GET, testControl } from '../route';

const mockCreateTestData = jest.fn();

describe('/api/test-listings', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  let routeTestControl: any;

  beforeEach(async () => {
    mockCreateTestData.mockReset();
    // require after reset so we can set overrides on the required module's testControl
    jest.resetModules();
    const { GET: newGET, testControl: newTestControl } = require('../route');
    routeTestControl = newTestControl;
    routeTestControl.createTestDataOverride = mockCreateTestData;
    delete process.env.NODE_ENV;
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    if (routeTestControl) {
      routeTestControl.createTestDataOverride = undefined;
    }
  });

  it('returns 404 in production environment', async () => {
    process.env.NODE_ENV = 'production';
    const { GET } = require('../route');
    const response = await GET();

    expect(response.status).toBe(404);
  });

  it('returns test listings in non-production', async () => {
    process.env.NODE_ENV = 'development';
    const { GET } = require('../route');
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