import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

const mockCommand = jest.fn();
const mockDb = jest.fn(() => ({ command: mockCommand }));
const mockClient = { db: mockDb } as const;

let GET: any;
let routeTestControl: any;
const originalNodeEnv = process.env.NODE_ENV;

beforeEach(async () => {
  mockCommand.mockReset();
  mockDb.mockReset().mockReturnValue({ command: mockCommand });
  process.env.NODE_ENV = 'test';
  jest.resetModules();
  // require after reset so we can set overrides on the required module's _testControl

  ({ GET, _testControl: routeTestControl } = require('../route'));
  routeTestControl.clientOverride = Promise.resolve(mockClient as any);
});

afterEach(() => {
  if (routeTestControl) {
    routeTestControl.clientOverride = undefined;
  }
  process.env.NODE_ENV = originalNodeEnv;
});

describe('/api/test-mongodb', () => {
  it('returns success when MongoDB connection succeeds', async () => {
    mockCommand.mockResolvedValue({ ok: 1 });

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.message).toBe('Successfully connected to MongoDB!');
    expect(mockCommand).toHaveBeenCalledWith({ ping: 1 });
  });

  it('handles MongoDB connection errors', async () => {
    mockCommand.mockRejectedValue(new Error('Connection failed'));

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe('Connection failed');
  });

  it('hides error details in production', async () => {
    process.env.NODE_ENV = 'production';
    mockCommand.mockRejectedValue(new Error('Connection failed'));

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe('Failed to connect to MongoDB');
  });
});
